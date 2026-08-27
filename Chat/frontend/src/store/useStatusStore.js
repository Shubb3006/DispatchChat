import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useStatusStore = create((set) => ({
  statuses: [],
  isLoading: false,
  isUploading: false,
  getStatuses: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get("/status");
      set({ statuses: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoading: false });
    }
  },

  addStatus: async ({ image }) => {
    try {
      set({ isUploading: true });
      const res = await axiosInstance.post("/status", { image });
      set((state) => ({
        statuses: [res.data, ...state.statuses],
      }));
      toast.success("Status added");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUploading: false });
    }
  },
}));
