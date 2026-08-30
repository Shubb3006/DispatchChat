import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from "../../lib/axios";
import nishanFleetData from "../data/nishanFleetData.json";

const FALLBACK_TRUCKS = (nishanFleetData.trucks || []).map(t => ({
  id: t.truck_number,
  truck_number: t.truck_number,
  model: `${t.make} ${t.model}`,
  make: t.make,
  vin: t.vin,
  dot_number: t.dot_number,
  plate_number: t.plate_number,
  state_province: t.state_province,
  terminal: t.terminal,
  status: t.status.toLowerCase(),
  year: t.year || 2023,
}));

const FALLBACK_TRAILORS = (nishanFleetData.trailers || []).map(t => ({
  id: t.trailer_number,
  trailer_number: t.trailer_number,
  type: t.type_description,
  trailer_type: t.trailer_type,
  type_code: t.type_code,
  plate_number: t.plate_number,
  state_province: t.state_province,
  terminal: t.terminal,
  status: t.status.toLowerCase(),
  capacityLbs: t.capacity || 45000,
}));

export const useAssetStore = create((set, get) => ({
  trucks: FALLBACK_TRUCKS,
  trailors: FALLBACK_TRAILORS,
  isLoading: false,
  error: null,

  fetchTrucks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/trucks');
      const data = Array.isArray(response.data) ? response.data : (response.data?.trucks || response.data?.data || []);
      const parsedData = data.map(raw => {
        const item = typeof raw.data === 'string' ? JSON.parse(raw.data) : (raw.data || raw);
        const make = item.make || "Truck";
        const model = item.model || "Tractor";
        return {
          ...item,
          id: item.id || item.truck_number,
          truck_number: item.truck_number || item.id,
          make,
          model: item.model ? `${make} ${item.model}` : make,
          status: (item.status || "available").toLowerCase(),
          year: item.year || 2023,
          plate_number: item.plate_number || "",
          terminal: item.terminal || "",
        };
      });
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
      const data = Array.isArray(response.data) ? response.data : (response.data?.trailors || response.data?.data || response.data?.trailers || []);
      const parsedData = data.map(raw => {
        const item = typeof raw.data === 'string' ? JSON.parse(raw.data) : (raw.data || raw);
        return {
          ...item,
          id: item.id || item.trailer_number,
          trailer_number: item.trailer_number || item.id,
          type: item.type_description || item.trailer_type || "Semi trailer",
          status: (item.status || "available").toLowerCase(),
          capacityLbs: parseFloat(item.capacity || 45000),
          plate_number: item.plate_number || "",
          terminal: item.terminal || "",
        };
      });
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
