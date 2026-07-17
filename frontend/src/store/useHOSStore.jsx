import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from "../../lib/axios";


export const useHOSStore = create((set, get) => ({
  hosLogs: [],
  isLoading: false,
  error: null,

  fetchHOSLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/hos');
      const logList = response.data || [];
      const parsedLogs = logList.map(item => typeof item.data === 'string' ? JSON.parse(item.data) : item.data || item);
      set({ hosLogs: parsedLogs, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch HOS logs:', err);
      set({ error: 'Failed to fetch HOS logs', isLoading: false });
    }
  },

  updateHOSLog: async (driverId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/hos/${driverId}`, { status: newStatus });
      const updatedLog = response.data;
      set((state) => ({
        hosLogs: state.hosLogs.map((log) => (log.driverId === driverId ? { ...log, ...updatedLog } : log))
      }));
      toast.success(`HOS Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update HOS status:', err);
      toast.error('Failed to update HOS log status');
    }
  }
}));
