import { useState, useCallback } from 'react';
import axios from 'axios';

export const useLoadJourney = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recordMovement = useCallback(async (loadId, fromLocation, toLocation, driverId, status, notes) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/load-journey/record', {
        load_id: loadId,
        from_location: fromLocation,
        to_location: toLocation,
        driver_id: driverId,
        status,
        notes
      }, { withCredentials: true });
      return response.data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record movement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getJourney = useCallback(async (loadId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/load-journey/${loadId}`, {
        withCredentials: true
      });
      return response.data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch journey');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (loadId, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put('/api/load-journey/status/update', {
        load_id: loadId,
        status
      }, { withCredentials: true });
      return response.data.journey;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordMovement, getJourney, updateStatus, loading, error };
};
