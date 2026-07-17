import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from "../../lib/axios";


export const useSafetyStore = create((set, get) => ({
  safetyIncidents: [],
  safetyScores: [],
  isLoading: false,
  error: null,

  fetchSafetyIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/safety/incidents');
      const incList = response.data || [];
      const parsedIncidents = incList.map(item => typeof item.data === 'string' ? JSON.parse(item.data) : item.data || item);
      set({ safetyIncidents: parsedIncidents, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch safety incidents:', err);
      set({ error: 'Failed to fetch safety incidents', isLoading: false });
    }
  },

  fetchSafetyScores: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/safety/scores');
      const scList = response.data || [];
      const parsedScores = scList.map(item => typeof item.data === 'string' ? JSON.parse(item.data) : item.data || item);
      set({ safetyScores: parsedScores, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch safety scores:', err);
      set({ error: 'Failed to fetch safety scores', isLoading: false });
    }
  },

  addSafetyIncident: async (incident) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/safety/incidents', incident);
      const savedInc = response.data || incident;
      set((state) => ({ 
        safetyIncidents: [savedInc, ...state.safetyIncidents],
        isLoading: false 
      }));
      toast.success('Safety incident logged');
    } catch (err) {
      console.error('Failed to add safety incident:', err);
      set({ error: 'Failed to add safety incident', isLoading: false });
      toast.error('Failed to log safety incident');
    }
  },

  updateSafetyIncident: async (incident) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/safety/incidents/${incident.id}`, incident);
      const updated = response.data || incident;
      set((state) => ({
        safetyIncidents: state.safetyIncidents.map((inc) => (inc.id === incident.id ? updated : inc)),
        isLoading: false
      }));
      toast.success('Safety incident updated');
    } catch (err) {
      console.error('Failed to update safety incident:', err);
      set({ error: 'Failed to update safety incident', isLoading: false });
      toast.error('Failed to update safety incident');
    }
  },

  updateSafetyScore: async (driverId, score) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/safety/scores/${driverId}`, score);
      const updated = response.data || score;
      set((state) => ({
        safetyScores: state.safetyScores.map((sc) => (sc.driverId === driverId ? updated : sc)),
        isLoading: false
      }));
      toast.success('Safety score updated');
    } catch (err) {
      console.error('Failed to update safety score:', err);
      set({ error: 'Failed to update safety score', isLoading: false });
      toast.error('Failed to update safety score');
    }
  }
}));
