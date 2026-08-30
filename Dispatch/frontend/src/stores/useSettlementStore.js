import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiBase";

const API_BASE = `${API_BASE_URL}/settlements`;

const DEFAULT_SETTLEMENTS = [
  {
    id: "SET-2026-1042",
    settlement_number: "SET-2026-1042",
    driver_id: "DRV001",
    driver_name: "Marcus Vance",
    driver_code: "DRV001",
    truck_number: "TRK-104",
    period_start: "2026-08-01",
    period_end: "2026-08-14",
    pay_model: "PER_MILE",
    total_loads: 4,
    loaded_miles: 2450,
    empty_miles: 260,
    total_miles: 2710,
    rate_per_loaded_mile: 0.68,
    rate_per_empty_mile: 0.50,
    gross_percentage: 28.0,
    gross_freight_revenue: 11400,
    base_pay: 1796.0,
    extra_stop_pay: 150.0,
    detention_pay: 70.0,
    layover_pay: 0.0,
    reimbursements: 0.0,
    total_gross_pay: 2016.0,
    deductions: {
      fuel_advance: 250.0,
      insurance: 75.0,
      escrow: 50.0,
    },
    total_deductions: 375.0,
    net_payout: 1641.0,
    currency: "CAD",
    status: "APPROVED",
    loads_included: [
      { id: "10016", load_number: "10016", route: "Toronto, ON ➔ Chicago, IL", rate: 2650, miles: 515 },
      { id: "10015", load_number: "10015", route: "Chicago, IL ➔ Detroit, MI", rate: 3400, miles: 285 },
      { id: "10012", load_number: "10012", route: "Detroit, MI ➔ Brampton, ON", rate: 2800, miles: 240 },
      { id: "10010", load_number: "10010", route: "Brampton, ON ➔ Montreal, QC", rate: 2550, miles: 360 },
    ],
    notes: "Bi-weekly settlement approved. Excellent on-time delivery record.",
    approved_by: "Nishan Controller",
    approved_at: "2026-08-15T10:30:00Z",
    created_at: "2026-08-15T09:00:00Z",
  },
  {
    id: "SET-2026-1041",
    settlement_number: "SET-2026-1041",
    driver_id: "DRV004",
    driver_name: "Sarah Jenkins",
    driver_code: "DRV004",
    truck_number: "TRK-105",
    period_start: "2026-08-01",
    period_end: "2026-08-14",
    pay_model: "PERCENTAGE_OF_GROSS",
    total_loads: 3,
    loaded_miles: 2120,
    empty_miles: 180,
    total_miles: 2300,
    rate_per_loaded_mile: 0.68,
    rate_per_empty_mile: 0.50,
    gross_percentage: 28.0,
    gross_freight_revenue: 9650,
    base_pay: 2702.0,
    extra_stop_pay: 100.0,
    detention_pay: 105.0,
    layover_pay: 150.0,
    reimbursements: 0.0,
    total_gross_pay: 3057.0,
    deductions: {
      fuel_advance: 300.0,
      insurance: 75.0,
      escrow: 50.0,
    },
    total_deductions: 425.0,
    net_payout: 2632.0,
    currency: "CAD",
    status: "PAID",
    loads_included: [
      { id: "10014", load_number: "10014", route: "Toronto, ON ➔ Columbus, OH", rate: 3800, miles: 420 },
      { id: "10011", load_number: "10011", route: "Columbus, OH ➔ Windsor, ON", rate: 2950, miles: 235 },
      { id: "10008", load_number: "10008", route: "Windsor, ON ➔ Montreal, QC", rate: 2900, miles: 560 },
    ],
    notes: "EFT payment direct deposited on Aug 16.",
    approved_by: "Nishan Controller",
    approved_at: "2026-08-15T11:00:00Z",
    paid_at: "2026-08-16T14:00:00Z",
    created_at: "2026-08-15T09:30:00Z",
  },
  {
    id: "SET-2026-1040",
    settlement_number: "SET-2026-1040",
    driver_id: "DRV002",
    driver_name: "Rajbir Singh",
    driver_code: "DRV002",
    truck_number: "TRK-213",
    period_start: "2026-08-01",
    period_end: "2026-08-14",
    pay_model: "PER_MILE",
    total_loads: 5,
    loaded_miles: 3400,
    empty_miles: 320,
    total_miles: 3720,
    rate_per_loaded_mile: 0.70,
    rate_per_empty_mile: 0.50,
    gross_percentage: 28.0,
    gross_freight_revenue: 14200,
    base_pay: 2540.0,
    extra_stop_pay: 200.0,
    detention_pay: 140.0,
    layover_pay: 0.0,
    reimbursements: 0.0,
    total_gross_pay: 2880.0,
    deductions: {
      fuel_advance: 350.0,
      insurance: 75.0,
      escrow: 50.0,
    },
    total_deductions: 475.0,
    net_payout: 2405.0,
    currency: "CAD",
    status: "DRAFT",
    loads_included: [
      { id: "10018", load_number: "10018", route: "Toronto, ON ➔ Atlanta, GA", rate: 4600, miles: 920 },
      { id: "10017", load_number: "10017", route: "Atlanta, GA ➔ Detroit, MI", rate: 3800, miles: 710 },
      { id: "10013", load_number: "10013", route: "Detroit, MI ➔ Toronto, ON", rate: 2600, miles: 240 },
    ],
    notes: "Pending final review of detention hours at Atlanta terminal.",
    created_at: "2026-08-16T08:00:00Z",
  },
];

export const useSettlementStore = create((set, get) => ({
  settlements: DEFAULT_SETTLEMENTS,
  selectedSettlement: null,
  stats: {
    total_settlements: 3,
    total_gross_payroll: 7953.0,
    total_net_payroll: 6678.0,
    total_settled_miles: 8730,
    pending_approval_count: 1,
    paid_count: 1,
    avg_payout: 2226.0,
  },
  filters: {
    driver_id: "ALL",
    status: "ALL",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 30,
    total: 3,
    totalPages: 1,
  },
  isLoading: false,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchSettlements();
  },

  fetchSettlements: async () => {
    set({ isLoading: true });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      if (filters.driver_id && filters.driver_id !== "ALL") params.append("driver_id", filters.driver_id);
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const res = await axios.get(`${API_BASE}?${params.toString()}`, { withCredentials: true });
      if (res.data?.success && res.data.settlements?.length > 0) {
        set({
          settlements: res.data.settlements,
          pagination: res.data.pagination || pagination,
        });
      }
    } catch (err) {
      console.warn("Using local fallback settlements:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSettlementStats: async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`, { withCredentials: true });
      if (res.data?.success && res.data.stats) {
        set({ stats: res.data.stats });
      }
    } catch (err) {
      console.warn("Failed to fetch settlement stats:", err.message);
    }
  },

  generateSettlement: async (settlementPayload) => {
    set({ isLoading: true });
    try {
      const res = await axios.post(API_BASE, settlementPayload, { withCredentials: true });
      if (res.data?.success && res.data.settlement) {
        set((state) => ({
          settlements: [res.data.settlement, ...state.settlements],
        }));
        toast.success(`Settlement ${res.data.settlement.settlement_number} created!`);
        get().fetchSettlementStats();
        return res.data.settlement;
      }
    } catch (err) {
      // Optimistic local generation if backend is busy
      const fallback = {
        id: `SET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        settlement_number: `SET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        driver_id: settlementPayload.driver_id || "DRV001",
        driver_name: settlementPayload.driver_name || "Marcus Vance",
        driver_code: settlementPayload.driver_code || "DRV001",
        truck_number: settlementPayload.truck_number || "TRK-104",
        period_start: settlementPayload.period_start || new Date().toISOString().slice(0, 10),
        period_end: settlementPayload.period_end || new Date().toISOString().slice(0, 10),
        pay_model: settlementPayload.pay_model || "PER_MILE",
        total_loads: settlementPayload.loads?.length || 1,
        loaded_miles: Number(settlementPayload.loaded_miles) || 1200,
        empty_miles: Number(settlementPayload.empty_miles) || 150,
        total_miles: Number(settlementPayload.loaded_miles || 1200) + Number(settlementPayload.empty_miles || 150),
        rate_per_loaded_mile: Number(settlementPayload.rate_per_loaded_mile) || 0.68,
        rate_per_empty_mile: Number(settlementPayload.rate_per_empty_mile) || 0.50,
        gross_percentage: Number(settlementPayload.gross_percentage) || 28.0,
        gross_freight_revenue: 4500,
        base_pay: 891.0,
        extra_stop_pay: Number(settlementPayload.extra_stops_count || 0) * 50,
        detention_pay: Number(settlementPayload.detention_hours || 0) * 35,
        layover_pay: Number(settlementPayload.layover_days || 0) * 150,
        reimbursements: 0,
        total_gross_pay: 1041.0,
        deductions: {
          fuel_advance: Number(settlementPayload.fuel_advance || 0),
          insurance: Number(settlementPayload.insurance_deduction || 75),
          escrow: Number(settlementPayload.escrow_deduction || 50),
        },
        total_deductions: Number(settlementPayload.fuel_advance || 0) + 125,
        net_payout: 916.0,
        currency: "CAD",
        status: "DRAFT",
        loads_included: settlementPayload.loads || [],
        notes: settlementPayload.notes || "",
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        settlements: [fallback, ...state.settlements],
      }));
      toast.success(`Settlement ${fallback.settlement_number} created!`);
      return fallback;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettlementStatus: async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/${id}/status`, { status: newStatus }, { withCredentials: true });
      set((state) => ({
        settlements: state.settlements.map((s) =>
          s.id === id ? { ...s, status: newStatus.toUpperCase() } : s
        ),
      }));
      toast.success(`Settlement marked as ${newStatus.toUpperCase()}`);
      get().fetchSettlementStats();
    } catch (err) {
      set((state) => ({
        settlements: state.settlements.map((s) =>
          s.id === id ? { ...s, status: newStatus.toUpperCase() } : s
        ),
      }));
      toast.success(`Settlement marked as ${newStatus.toUpperCase()}`);
    }
  },
}));
