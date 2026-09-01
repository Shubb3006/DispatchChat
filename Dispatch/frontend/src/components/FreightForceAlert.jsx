import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './FreightForceAlert.css';

const FreightForceAlert = () => {
  const [freightForceLoads, setFreightForceLoads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreightForceLoads();
    const interval = setInterval(fetchFreightForceLoads, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFreightForceLoads = async () => {
    try {
      const response = await axios.get('/api/load-journey/freight-force/all', {
        withCredentials: true
      });
      setFreightForceLoads(response.data.loads || []);
    } catch (error) {
      console.error('Error fetching freight force loads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (freightForceLoads.length === 0) return null;

  return (
    <>
      <div className="freight-force-notification" onClick={() => setShowModal(true)}>
        <span className="alert-icon">🚨</span>
        <div className="alert-content">
          <p className="alert-title">Loads at Freight Force</p>
          <p className="alert-count">{freightForceLoads.length} load(s)</p>
        </div>
        <span className="alert-chevron">›</span>
      </div>

      {showModal && (
        <div className="freight-force-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="freight-force-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Loads at Freight Force</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {freightForceLoads.length === 0 ? (
                <p className="empty-state">No loads at freight force</p>
              ) : (
                <div className="loads-list">
                  {freightForceLoads.map((load) => (
                    <div key={load.load_id} className="load-card">
                      <div className="load-header">
                        <span className="load-number">Load #{load.load_number}</span>
                        <span className="red-badge">AT FREIGHT FORCE</span>
                      </div>
                      <div className="load-info">
                        <p><strong>Origin:</strong> {load.origin}</p>
                        <p><strong>Destination:</strong> {load.destination}</p>
                        <p><strong>Stops:</strong> {load.stops_count}</p>
                        <p><strong>Last Update:</strong> {new Date(load.last_update).toLocaleString()}</p>
                      </div>
                      <div className="load-actions">
                        <button className="action-btn recall">Recall Load</button>
                        <button className="action-btn reassign">Reassign Driver</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FreightForceAlert;
