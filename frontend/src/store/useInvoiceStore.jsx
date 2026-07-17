import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";


export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  fetchInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/invoices");
      const invList = response.data || [];
      const parsedInvoices = invList.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      set({ invoices: parsedInvoices, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      set({ error: "Failed to fetch invoices", isLoading: false });
    }
  },

  addInvoice: async (invoice) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/invoices", invoice);
      const savedInv = response.data || invoice;
      set((state) => ({
        invoices: [savedInv, ...state.invoices],
        isLoading: false,
      }));
      toast.success(`Invoice ${invoice.id} created`);
    } catch (err) {
      console.error("Failed to add invoice:", err);
      set({ error: "Failed to add invoice", isLoading: false });
      toast.error("Failed to create invoice");
    }
  },

  updateInvoice: async (invoice) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(
        `/invoices/${invoice.id}`,
        invoice
      );
      const updated = response.data || invoice;
      set((state) => ({
        invoices: state.invoices.map((i) =>
          i.id === invoice.id ? updated : i
        ),
        isLoading: false,
      }));
      toast.success(`Invoice ${invoice.id} updated`);
    } catch (err) {
      console.error("Failed to update invoice:", err);
      set({ error: "Failed to update invoice", isLoading: false });
      toast.error("Failed to update invoice");
    }
  },
}));
