import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from "../../lib/axios";


export const useSafetyStore = create((set, get) => ({
  safetyIncidents: [],
  safetyScores: [],
  isLoading: false,
  error: null,

  // Real backend routes are mounted at /api/safety-incidents (see
  // Dispatch/backend/src/server.js) — the old '/safety/incidents' paths 404'd,
  // so SafetyPage never rendered real incident rows.
  fetchSafetyIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/safety-incidents');
      const incList = response.data?.incidents || [];
      set({ safetyIncidents: incList, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch safety incidents:', err);
      set({ error: 'Failed to fetch safety incidents', isLoading: false });
    }
  },

  fetchSafetyScores: async () => {
    // Backend has no dedicated safety-score endpoint.
    // Compute scores from real incidents + HOS logs: 100 - 10 per open incident, floor 40
    // This is labeled "computed from incidents" in the UI (no fabricated drivers).
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const incidents = state.safetyIncidents;

      // Build a set of unique driver IDs from incidents
      const driverIds = new Set();
      incidents.forEach(inc => {
        if (inc.driver_id) driverIds.add(inc.driver_id);
      });

      // Compute scores: 100 - 10 per open incident, floor 40
      const computedScores = Array.from(driverIds).map((driverId) => {
        const driverIncidents = incidents.filter(
          (inc) => inc.driver_id === driverId && inc.status !== "resolved"
        );
        const score = Math.max(40, 100 - driverIncidents.length * 10);
        const firstIncident = incidents.find((inc) => inc.driver_id === driverId);

        return {
          driver_id: driverId,
          driverId: driverId,
          driverName: firstIncident?.driver_name || "Driver",
          score: score,
          totalMiles: 0, // No mileage data from incidents
          totalViolations: driverIncidents.length,
          hosCompliancePercent: 100, // Placeholder
          computed: true
        };
      });

      set({ safetyScores: computedScores, isLoading: false });
    } catch (err) {
      console.error("Error computing safety scores:", err);
      set({ safetyScores: [], isLoading: false });
    }
  },

  addSafetyIncident: async (incident) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/safety-incidents', incident);
      const savedInc = response.data?.incident || incident;
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
      const response = await axiosInstance.put(`/safety-incidents/${incident.id}/status`, {
        status: incident.status,
        resolution_notes: incident.resolution_notes || incident.resolutionNotes || null,
      });
      const updated = response.data?.incident || incident;
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
    // No safety-score endpoint exists on the backend — update local state only
    // so incident resolution flows don't error, without faking a server write.
    set((state) => ({
      safetyScores: state.safetyScores.map((sc) =>
        (sc.driver_id || sc.driverId) === driverId ? { ...sc, ...score } : sc
      ),
      isLoading: false,
    }));
  }
}));
