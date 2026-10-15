import React, { useState, useEffect } from 'react';
import './SpotList.css';

function SpotList({ spots, onClaimSpot, userLocation, onDeleteSpot }) {

  const [timers, setTimers] = useState({});
  const [isExpanded, setIsExpanded] = useState(true);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      spots.forEach(spot => {
        const createdTime = new Date(spot.createdAt).getTime();
        const now = Date.now();
        const elapsed = now - createdTime;
        const remaining = (5 * 60 * 1000) - elapsed;
        
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          newTimers[spot.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
          newTimers[spot.id] = 'Expired';
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [spots]);

  return (
    <div className={`spot-list ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="spot-list-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2>🅿️ Spots</h2>
        <span className="spot-count">{spots.length}</span>
        <button className="toggle-btn">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          {spots.length === 0 ? (
            <p className="no-spots">No spots available</p>
          ) : (
            <div className="spots">
              {spots.map(spot => {
                const distance = userLocation 
                  ? calculateDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
                  : null;
                
                return (
                  <div key={spot.id} className="spot-item">
                    <div className="spot-info">
                      <div className="spot-distance">
                        {distance ? `${distance.toFixed(1)} km` : '...'}
                      </div>
                      <div className="spot-timer">
                        ⏱️ {timers[spot.id] || '...'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
  <button 
    className="claim-btn"
    onClick={() => onClaimSpot(spot.id)}
  >
    Claim
  </button>
  <button 
    className="delete-btn"
    onClick={() => onDeleteSpot(spot.id)}
  >
    ×
  </button>
</div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SpotList;
