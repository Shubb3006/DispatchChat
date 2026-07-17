import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from "../../lib/axios";


const FALLBACK_TRUCKS = [
  { id: 'TRK-102', model: 'Peterbilt 579', status: 'active', year: '2024' },
  { id: 'TRK-215', model: 'Kenworth T680', status: 'active', year: '2023' },
  { id: 'TRK-145', model: 'Freightliner Cascadia', status: 'active', year: '2024' },
  { id: 'TRK-302', model: 'Volvo VNL 860', status: 'active', year: '2022' },
  { id: 'TRK-188', model: 'Peterbilt 389', status: 'active', year: '2023' }
];

const FALLBACK_TRAILORS = [
  { id: 'TRL-504', type: 'Dry Van 53ft', status: 'active', capacityLbs: 45000 },
  { id: 'TRL-309', type: 'Flatbed 48ft', status: 'active', capacityLbs: 48000 },
  { id: 'TRL-802', type: 'Reefer 53ft', status: 'active', capacityLbs: 44000 },
  { id: 'TRL-220', type: 'Step Deck 53ft', status: 'active', capacityLbs: 46000 },
  { id: 'TRL-415', type: 'Dry Van 53ft', status: 'active', capacityLbs: 45000 }
];

export const useAssetStore = create((set, get) => ({
  trucks: FALLBACK_TRUCKS,
  trailors: FALLBACK_TRAILORS,
  isLoading: false,
  error: null,

  fetchTrucks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/trucks');
      const data = response.data || [];
      const parsedData = data.map(item => typeof item.data === 'string' ? JSON.parse(item.data) : item.data || item);
      if (parsedData.length > 0) {
        set({ trucks: parsedData, isLoading: false });
      } else {
        set({ trucks: FALLBACK_TRUCKS, isLoading: false });
      }
    } catch (err) {
      console.warn('Failed to fetch trucks, using fallback:', err.message);
      set({ trucks: FALLBACK_TRUCKS, isLoading: false });
    }
  },

  addTruck: async (truck) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/trucks', truck);
      const saved = response.data || truck;
      set((state) => ({
        trucks: [saved, ...state.trucks],
        isLoading: false
      }));
      toast.success(`Truck ${truck.id} added successfully`);
    } catch (err) {
      console.error('Failed to add truck:', err);
      set({ error: 'Failed to add truck', isLoading: false });
      toast.error('Failed to add truck');
    }
  },

  updateTruck: async (truck) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/trucks/${truck.id}`, truck);
      const updated = response.data || truck;
      set((state) => ({
        trucks: state.trucks.map((t) => (t.id === truck.id ? updated : t)),
        isLoading: false
      }));
      toast.success(`Truck ${truck.id} updated`);
    } catch (err) {
      console.error('Failed to update truck:', err);
      set({ error: 'Failed to update truck', isLoading: false });
      toast.error('Failed to update truck');
    }
  },

  deleteTruck: async (id) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/trucks/${id}`);
      set((state) => ({
        trucks: state.trucks.filter((t) => t.id !== id),
        isLoading: false
      }));
      toast.success('Truck removed');
    } catch (err) {
      console.error('Failed to delete truck:', err);
      set({ error: 'Failed to delete truck', isLoading: false });
      toast.error('Failed to remove truck');
    }
  },

  fetchTrailors: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/trailors');
      const data = response.data || [];
      const parsedData = data.map(item => typeof item.data === 'string' ? JSON.parse(item.data) : item.data || item);
      if (parsedData.length > 0) {
        set({ trailors: parsedData, isLoading: false });
      } else {
        set({ trailors: FALLBACK_TRAILORS, isLoading: false });
      }
    } catch (err) {
      console.warn('Failed to fetch trailors, using fallback:', err.message);
      set({ trailors: FALLBACK_TRAILORS, isLoading: false });
    }
  },

  addTrailor: async (trailor) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/trailors', trailor);
      const saved = response.data || trailor;
      set((state) => ({
        trailors: [saved, ...state.trailors],
        isLoading: false
      }));
      toast.success(`Trailer ${trailor.id} added successfully`);
    } catch (err) {
      console.error('Failed to add trailer:', err);
      set({ error: 'Failed to add trailer', isLoading: false });
      toast.error('Failed to add trailer');
    }
  },

  updateTrailor: async (trailor) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/trailors/${trailor.id}`, trailor);
      const updated = response.data || trailor;
      set((state) => ({
        trailors: state.trailors.map((t) => (t.id === trailor.id ? updated : t)),
        isLoading: false
      }));
      toast.success(`Trailer ${trailor.id} updated`);
    } catch (err) {
      console.error('Failed to update trailer:', err);
      set({ error: 'Failed to update trailer', isLoading: false });
      toast.error('Failed to update trailer');
    }
  },

  deleteTrailor: async (id) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/trailors/${id}`);
      set((state) => ({
        trailors: state.trailors.filter((t) => t.id !== id),
        isLoading: false
      }));
      toast.success('Trailer removed');
    } catch (err) {
      console.error('Failed to delete trailer:', err);
      set({ error: 'Failed to delete trailer', isLoading: false });
      toast.error('Failed to remove trailer');
    }
  }
}));
