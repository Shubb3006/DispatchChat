import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './LoadJourneyTimeline.css';

const LoadJourneyTimeline = ({ loadId }) => {
  const [journey, setJourney] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourney();
  }, [loadId]);

  const fetchJourney = async () => {
    try {
      const response = await axios.get(`/api/load-journey/${loadId}`, {
        withCredentials: true
      });
      setJourney(response.data.journey || []);
    } catch (error) {
      console.error('Error fetching load journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pickup': '#3B82F6',
      'in_transit': '#10B981',
      'at_warehouse': '#F59E0B',
      'at_freight_force': '#EF4444',
      'in_delivery': '#8B5CF6',
      'delivered': '#06B6D4',
      'delayed': '#F97316'
    };
    return colors[status] || '#6B7280';
  };

  if (loading) return <div className="journey-loading">Loading journey...</div>;

  return (
    <div className="load-journey-container">
      <h3 className="journey-title">📍 Load Journey Timeline</h3>

      {journey.length === 0 ? (
        <p className="journey-empty">No journey history yet</p>
      ) : (
        <div className="timeline">
          {journey.map((stop, index) => (
            <div key={stop.id} className="timeline-item">
              <div
                className="timeline-dot"
                style={{ backgroundColor: getStatusColor(stop.status) }}
              />

              <div className="timeline-content">
                <div className="stop-header">
                  <span className="stop-status">
                    {stop.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="stop-time">
                    {new Date(stop.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="stop-details">
                  {stop.from_location && (
                    <p><strong>From:</strong> {stop.from_location}</p>
                  )}
                  {stop.to_location && (
                    <p><strong>To:</strong> {stop.to_location}</p>
                  )}
                  {stop.driver_code && (
                    <p><strong>Driver:</strong> {stop.driver_code}</p>
                  )}
                  {stop.notes && (
                    <p><strong>Notes:</strong> {stop.notes}</p>
                  )}
                </div>

                {stop.status === 'at_freight_force' && (
                  <div className="freight-force-badge">🚨 At Freight Force</div>
                )}
              </div>

              {index < journey.length - 1 && <div className="timeline-line" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadJourneyTimeline;
