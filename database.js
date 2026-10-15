const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//create database file
const dbPath = path.join(__dirname, 'parkspot.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

//create spots table and users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  createdAt TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  photoUrl TEXT,
  userId INTEGER
)

  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Spots table ready');
    }
  });

  //create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      spotsShared INTEGER DEFAULT 0,
      spotsClaimed INTEGER DEFAULT 0,
      reputation REAL DEFAULT 5.0,
      createdAt TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
    }
  });
});

// Add a spot
const addSpot = (spot) => {
  return new Promise((resolve, reject) => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    db.run(
      'INSERT INTO spots (id, lat, lng, createdAt, expiresAt, photoUrl, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [spot.id, spot.lat, spot.lng, spot.createdAt, expiresAt, spot.photoUrl || null, spot.userId || null],
      (err) => {
        if (err) reject(err);
        else resolve({ ...spot, expiresAt });
      }
    );
  });
};


// Get all active spots (not expired)
const getActiveSpots = () => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.all(
      'SELECT * FROM spots WHERE expiresAt > ?',
      [now],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

//remove a spot
const removeSpot = (spotId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM spots WHERE id = ?',
      [spotId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

//clean up expired spots
const cleanupExpiredSpots = () => {
  const now = new Date().toISOString();
  db.run(
    'DELETE FROM spots WHERE expiresAt <= ?',
    [now],
    (err) => {
      if (err) console.error('Error cleaning up spots:', err);
      else console.log('Cleaned up expired spots');
    }
  );
};

//run cleanup every minute
setInterval(cleanupExpiredSpots, 60 * 1000);

//user functions
const createUser = (email, password, name) => {
  return new Promise((resolve, reject) => {
    const createdAt = new Date().toISOString();
    db.run(
      'INSERT INTO users (email, password, name, createdAt) VALUES (?, ?, ?, ?)',
      [email, password, name, createdAt],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, email, name });
      }
    );
  });
};

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, name, spotsShared, spotsClaimed, reputation FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateUserStats = (userId, field) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET ${field} = ${field} + 1 WHERE id = ?`,
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};


//analytics functions
const getAnalytics = () => {
  return new Promise((resolve, reject) => {
    const queries = {
      totalUsers: 'SELECT COUNT(*) as count FROM users',
      totalSpotsShared: 'SELECT SUM(spotsShared) as total FROM users',
      totalSpotsClaimed: 'SELECT SUM(spotsClaimed) as total FROM users',
      activeSpots: 'SELECT COUNT(*) as count FROM spots WHERE expiresAt > datetime("now")',
      topContributors: 'SELECT name, email, spotsShared, spotsClaimed, reputation FROM users ORDER BY spotsShared DESC LIMIT 5'
    };

    const results = {};

    db.get(queries.totalUsers, (err, row) => {
      if (err) return reject(err);
      results.totalUsers = row.count;

      db.get(queries.totalSpotsShared, (err, row) => {
        if (err) return reject(err);
        results.totalSpotsShared = row.total || 0;

        db.get(queries.totalSpotsClaimed, (err, row) => {
          if (err) return reject(err);
          results.totalSpotsClaimed = row.total || 0;

          db.get(queries.activeSpots, (err, row) => {
            if (err) return reject(err);
            results.activeSpots = row.count;

            db.all(queries.topContributors, (err, rows) => {
              if (err) return reject(err);
              results.topContributors = rows;
              resolve(results);
            });
          });
        });
      });
    });
  });
};

const getSpotHistory = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM spots ORDER BY createdAt DESC LIMIT 50',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};
const rateUser = (userId, rating) => {
  return new Promise((resolve, reject) => {
    //get current reputation
    db.get('SELECT reputation FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('User not found'));
      
      
      const newReputation = (row.reputation + rating) / 2;
      
      db.run(
        'UPDATE users SET reputation = ? WHERE id = ?',
        [newReputation, userId],
        (err) => {
          if (err) reject(err);
          else resolve(newReputation);
        }
      );
    });
  });
};



module.exports = {
  addSpot,
  getActiveSpots,
  removeSpot,
  cleanupExpiredSpots,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserStats,
  getAnalytics,
  getSpotHistory,
  rateUser
};


