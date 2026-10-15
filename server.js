const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./database');
const auth = require('./auth');
const { generateMockSpots } = require('./mockData');
const upload = require('./photoUpload');
const { verifyParkingSpot } = require('./aiVerification');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

//uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//auth
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    //check if user exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    //hash password and create user
    const hashedPassword = await auth.hashPassword(password);
    const user = await db.createUser(email, hashedPassword, name);
    
    //generate token
    const token = auth.generateToken(user.id, user.email);
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    //find user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    //check password
    const isValid = await auth.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    //generate token
    const token = auth.generateToken(user.id, user.email);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        spotsShared: user.spotsShared,
        spotsClaimed: user.spotsClaimed,
        reputation: user.reputation
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});
//analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    const spotHistory = await db.getSpotHistory();
    res.json({ ...analytics, spotHistory });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});



//photo upload and verification endpoint
app.post('/api/verify-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    const imagePath = req.file.path;
    
    //verify with AI
    const verification = await verifyParkingSpot(imagePath);
    
    res.json({
      success: true,
      verification: verification,
      photoUrl: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error('Photo verification error:', err);
    res.status(500).json({ error: 'Photo verification failed' });
  }
});

//Socket.io connection
io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);
  
  //send current active spots to new user
  try {
    const activeSpots = await db.getActiveSpots();
    socket.emit('initialSpots', activeSpots);
  } catch (err) {
    console.error('Error fetching spots:', err);
  }
  
  //handle new spot added
  socket.on('addSpot', async (spot) => {
  try {
    const savedSpot = await db.addSpot(spot);
    console.log('New spot added:', savedSpot);
    
    //update user stats if userId exists
    if (spot.userId) {
      await db.updateUserStats(spot.userId, 'spotsShared');
    }
    
    //show to all users
    io.emit('spotAdded', savedSpot);
    
    //auto-remove after 5mins
    setTimeout(async () => {
      try {
        await db.removeSpot(spot.id);
        io.emit('spotRemoved', spot.id);
        console.log('Spot expired:', spot.id);
      } catch (err) {
        console.error('Error removing expired spot:', err);
      }
    }, 5 * 60 * 1000);
  } catch (err) {
    console.error('Error adding spot:', err);
  }
});

  
  //handle spot claimed/deleted
socket.on('claimSpot', async (data) => {
  try {
    //handle both old format (just spotId) and new format (object with spotId and userId)
    const spotId = typeof data === 'object' ? data.spotId : data;
    const userId = typeof data === 'object' ? data.userId : null;
    
    await db.removeSpot(spotId);
    
    //ppdate user stats if userId exists
    if (userId) {
      await db.updateUserStats(userId, 'spotsClaimed');
      console.log('Updated spotsClaimed for user:', userId);
    }
    
    io.emit('spotRemoved', spotId);
    console.log('Spot claimed/deleted:', spotId);
  } catch (err) {
    console.error('Error claiming spot:', err);
  }
});


  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

//REST API routes
app.get('/api/spots', async (req, res) => {
  try {
    const spots = await db.getActiveSpots();
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching spots' });
  }
});

//generate mock spots on server start (for demo purposes)
setTimeout(async () => {
  const mockSpots = generateMockSpots(8);
  console.log('Adding mock spots for demo...');
  
  for (const spot of mockSpots) {
    try {
      const savedSpot = await db.addSpot(spot);
      io.emit('spotAdded', savedSpot);
      
      //auto-remove after 5 minutes
      setTimeout(async () => {
        try {
          await db.removeSpot(spot.id);
          io.emit('spotRemoved', spot.id);
        } catch (err) {
          console.error('Error removing mock spot:', err);
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error adding mock spot:', err);
    }
  }
}, 2000); //wait atleast 2 seconds after server starts

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
