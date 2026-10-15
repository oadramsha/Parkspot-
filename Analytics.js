import React, { useState, useEffect } from 'react';
import './Analytics.css';

function Analytics({ onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-modal">
        <div className="analytics-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <h2>Loading analytics...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-modal">
      <div className="analytics-content">
        <div className="analytics-header">
          <h2>Analytics Dashboard</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">{analytics.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">{analytics.activeSpots}</div>
            <div className="stat-label">Active Spots</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">{analytics.totalSpotsShared}</div>
            <div className="stat-label">Spots Shared</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">{analytics.totalSpotsClaimed}</div>
            <div className="stat-label">Spots Claimed</div>
          </div>
        </div>

        <div className="leaderboard">
          <h3>🏆 Top Contributors</h3>
          {analytics.topContributors && analytics.topContributors.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Shared</th>
                  <th>Claimed</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topContributors.map((user, index) => (
                  <tr key={user.email}>
                    <td className="rank">#{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.spotsShared}</td>
                    <td>{user.spotsClaimed}</td>
                    <td>⭐ {user.reputation.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No contributors yet</p>
          )}
        </div>

        <div className="recent-activity">
          <h3>📍 Recent Spot Activity</h3>
          {analytics.spotHistory && analytics.spotHistory.length > 0 ? (
            <div className="activity-list">
              {analytics.spotHistory.slice(0, 10).map((spot) => (
                <div key={spot.id} className="activity-item">
                  <span className="activity-icon"></span>
                  <div className="activity-details">
                    <div className="activity-location">
                      Lat: {spot.lat.toFixed(4)}, Lng: {spot.lng.toFixed(4)}
                    </div>
                    <div className="activity-time">
                      {new Date(spot.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {spot.photoUrl && <span className="has-photo">📸</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
