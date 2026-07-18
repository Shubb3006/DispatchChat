import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const FALLBACK_CUSTOMERS = [
  {
    id: "CUST001",
    name: "AeroParts Manufacturing",
    email: "logistics@aeroparts.com",
    phone: "+1 (416) 555-0100",
    status: "active",
  },
  {
    id: "CUST002",
    name: "Pacific Lumber & Mill",
    email: "shipping@paclumber.com",
    phone: "+1 (425) 555-3800",
    status: "active",
  },
  {
    id: "CUST003",
    name: "Fresno Fresh Foods",
    email: "billing@fresnofresh.com",
    phone: "+1 (559) 555-4900",
    status: "active",
  },
  {
    id: "CUST004",
    name: "Global Logistics Corp",
    email: "contact@globallogistics.com",
    phone: "+1 (800) 555-0199",
    status: "active",
  },
];

export const useCustomerStore = create((set, get) => ({
  customers: FALLBACK_CUSTOMERS,
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/customers");
      const data = response.data || [];
      const parsedData = data.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      if (parsedData.length > 0) {
        set({ customers: parsedData, isLoading: false });
      } else {
        set({ customers: FALLBACK_CUSTOMERS, isLoading: false });
      }
    } catch (err) {
      console.warn("Failed to fetch customers, using fallback:", err.message);
      set({ customers: FALLBACK_CUSTOMERS, isLoading: false });
    }
  },

  addCustomer: async (customer) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/customers", customer);
      const saved = response.data || customer;
      set((state) => ({
        customers: [saved, ...state.customers],
        isLoading: false,
      }));
      toast.success(`Customer ${customer.name} created successfully`);
    } catch (err) {
      console.error("Failed to add customer:", err);
      set({ error: "Failed to add customer", isLoading: false });
      toast.error("Failed to create customer");
    }
  },

  updateCustomer: async (customer) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(
        `/customers/${customer.id}`,
        customer
      );
      const updated = response.data || customer;
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customer.id ? updated : c
        ),
        isLoading: false,
      }));
      toast.success(`Customer ${customer.name} updated`);
    } catch (err) {
      console.error("Failed to update customer:", err);
      set({ error: "Failed to update customer", isLoading: false });
      toast.error("Failed to update customer");
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/customers/${id}`);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        isLoading: false,
      }));
      toast.success("Customer deleted");
    } catch (err) {
      console.error("Failed to delete customer:", err);
      set({ error: "Failed to delete customer", isLoading: false });
      toast.error("Failed to delete customer");
    }
  },
}));
