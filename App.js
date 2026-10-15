import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Map from './Map';
import Controls from './Controls';
import SpotList from './SpotList';
import Toast from './Toast';
import Auth from './Auth';
import './App.css';
import Analytics from './Analytics';

const socket = io('http://localhost:8000');

function App() {
  const [spots, setSpots] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [toast, setToast] = useState(null);
  const [mapClickMode, setMapClickMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: 51.0447, lng: -114.0719 });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ lat: 51.0447, lng: -114.0719 });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    socket.on('initialSpots', (initialSpots) => {
      console.log('Received initial spots:', initialSpots);
      setSpots(initialSpots);
    });

    socket.on('spotAdded', (spot) => {
      console.log('pot added:', spot);
      setSpots(prev => [...prev, spot]);
      
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          spot.lat, 
          spot.lng
        );
        setToast(`🅿️ Spot ${distance.toFixed(1)} km away!`);
      } else {
        setToast('🅿️ New parking spot available!');
      }
    });

    socket.on('spotRemoved', (spotId) => {
      console.log('Spot removed:', spotId);
      setSpots(prev => prev.filter(s => s.id !== spotId));
    });

    return () => {
      socket.off('initialSpots');
      socket.off('spotAdded');
      socket.off('spotRemoved');
    };
  }, [userLocation, isAuthenticated]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleAddSpot = (location, photoUrl = null) => {
  const newSpot = {
    id: Date.now(),
    lat: location.lat,
    lng: location.lng,
    createdAt: new Date().toISOString(),
    userId: user?.id,
    photoUrl: photoUrl
  };
  socket.emit('addSpot', newSpot);
};


  const handleMapClick = (latlng) => {
    if (mapClickMode) {
      handleAddSpot({ lat: latlng.lat, lng: latlng.lng });
    }
  };
const handleClaimSpot = (spotId) => {
  socket.emit('claimSpot', { spotId, userId: user?.id });
  setToast('✓ Spot claimed! Navigate to the location.');
};

const handleDeleteSpot = (spotId) => {
  socket.emit('claimSpot', { spotId, userId: user?.id });
  setToast('🗑️ Spot deleted');
};



  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <div className="user-info">
        <span>👤 {user?.name}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
          <button 
      className="analytics-btn" 
      onClick={() => setShowAnalytics(true)}
      title="View Analytics"
    >
      𓊍
    </button>
      <Controls 
        onAddSpot={handleAddSpot}
        userLocation={userLocation}
        mapClickMode={mapClickMode}
        setMapClickMode={setMapClickMode}
      />
      <SpotList 
        spots={spots}
        onClaimSpot={handleClaimSpot}
        userLocation={userLocation}
        onDeleteSpot={handleDeleteSpot}
      />
      <Map 
        spots={spots}
        userLocation={userLocation}
        onClaimSpot={handleClaimSpot}
        onMapClick={handleMapClick}
        onDeleteSpot={handleDeleteSpot}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {showAnalytics && <Analytics onClose={() => setShowAnalytics(false)} />}
    </div>
  );
}

export default App;
