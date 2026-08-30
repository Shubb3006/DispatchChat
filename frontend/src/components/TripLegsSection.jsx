import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Backend-accepted leg statuses (see PATCH /api/legs/:id).
const LEG_STATUSES = ["pending", "assigned", "in_progress", "completed"];

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-700",
  assigned: "bg-sky-50 text-sky-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const emptyLegForm = (seq, prevLeg) => ({
  id: null,
  seq,
  // Chain rule: a new leg starts where the previous one ended.
  origin_city: prevLeg?.destination_city || "",
  origin_state: prevLeg?.destination_state || "",
  destination_city: "",
  destination_state: "",
  driver_id: "",
  truck_id: "",
  miles: "",
  status: "pending",
});

// Maps a leg (DB row or form) onto exactly the fields the replace-set
// endpoint accepts, preserving pay_override / trip_id when present.
const toLegPayload = (leg, seq) => ({
  seq,
  origin_city: String(leg.origin_city || "").trim(),
  origin_state: leg.origin_state ? String(leg.origin_state).trim() : null,
  destination_city: String(leg.destination_city || "").trim(),
  destination_state: leg.destination_state ? String(leg.destination_state).trim() : null,
  driver_id: leg.driver_id || null,
  truck_id: leg.truck_id || null,
  trip_id: leg.trip_id || null,
  miles: leg.miles === "" || leg.miles == null ? null : Number(leg.miles),
  pay_override: leg.pay_override || null,
  status: leg.status || null,
});

// Client-side mirror of the backend chain validation: contiguous seq starting
// at 1 and each leg beginning where the previous one ended.
const validateLegChain = (legs) => {
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!String(leg.origin_city || "").trim() || !String(leg.destination_city || "").trim()) {
      return `Leg ${i + 1}: origin city and destination city are required`;
    }
    if (leg.miles !== null && leg.miles !== undefined && leg.miles !== "" && (!Number.isFinite(Number(leg.miles)) || Number(leg.miles) < 0)) {
      return `Leg ${i + 1}: miles must be a non-negative number`;
    }
  }
  for (let i = 1; i < legs.length; i++) {
    const prev = legs[i - 1];
    const cur = legs[i];
    const cityMatches =
      String(prev.destination_city || "").trim().toLowerCase() ===
      String(cur.origin_city || "").trim().toLowerCase();
    const stateMatches =
      !prev.destination_state ||
      !cur.origin_state ||
      String(prev.destination_state).trim().toLowerCase() ===
        String(cur.origin_state).trim().toLowerCase();
    if (!cityMatches || !stateMatches) {
      return `Leg ${i + 1} must start where leg ${i} ends (${prev.destination_city}${
        prev.destination_state ? ", " + prev.destination_state : ""
      })`;
    }
  }
  return null;
};

export default function TripLegsSection({ loadId }) {
  const [legs, setLegs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [editingLeg, setEditingLeg] = useState(null);

  const validLoadId = loadId && UUID_REGEX.test(String(loadId));

  const fetchLegs = useCallback(async () => {
    if (!validLoadId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axiosInstance.get(`/load/${loadId}/legs`);
      setLegs(res.data.legs || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to fetch relay legs");
    } finally {
      setLoading(false);
    }
  }, [loadId, validLoadId]);

  useEffect(() => {
    fetchLegs();
  }, [fetchLegs]);

  useEffect(() => {
    // Driver dropdown from the existing drivers endpoint (legacy shape),
    // trucks from the trucks endpoint (legacy shape is a raw array).
    const fetchResources = async () => {
      try {
        const [driversRes, trucksRes] = await Promise.all([
          axiosInstance.get("/drivers"),
          axiosInstance.get("/trucks"),
        ]);
        const driverRows = Array.isArray(driversRes.data)
          ? driversRes.data
          : driversRes.data?.drivers || driversRes.data?.data || [];
        const truckRows = Array.isArray(trucksRes.data)
          ? trucksRes.data
          : trucksRes.data?.trucks || trucksRes.data?.data || [];
        setDrivers(driverRows);
        setTrucks(truckRows);
      } catch (err) {
        console.warn("Failed to fetch drivers/trucks for legs:", err.message);
      }
    };
    fetchResources();
  }, []);

  const driverName = (driverId) => {
    if (!driverId) return "Unassigned";
    const d = drivers.find((x) => String(x.id) === String(driverId));
    return d ? d.full_name || d.username || d.name || d.driver_code || "Driver" : "Assigned driver";
  };

  const truckLabel = (truckId) => {
    if (!truckId) return "—";
    const t = trucks.find((x) => String(x.id) === String(truckId));
    return t ? t.truck_number || t.unit_number || t.name || "Truck" : "Assigned truck";
  };

  const totalMiles = legs.reduce((sum, leg) => sum + (Number(leg.miles) || 0), 0);

  const saveLeg = async () => {
    if (!editingLeg) return;
    if (!String(editingLeg.origin_city || "").trim() || !String(editingLeg.destination_city || "").trim()) {
      toast.error("Origin city and destination city are required");
      return;
    }

    setSaving(true);
    try {
      if (editingLeg.id) {
        // Existing leg. Route/order changes replace the whole ordered set;
        // driver/truck/miles/status changes go through PATCH /legs/:id.
        const original = legs.find((l) => l.id === editingLeg.id);
        const routeChanged =
          original &&
          (String(original.origin_city || "") !== String(editingLeg.origin_city || "") ||
            String(original.origin_state || "") !== String(editingLeg.origin_state || "") ||
            String(original.destination_city || "") !== String(editingLeg.destination_city || "") ||
            String(original.destination_state || "") !== String(editingLeg.destination_state || ""));

        if (routeChanged) {
          const nextLegs = legs
            .map((l) => (l.id === editingLeg.id ? editingLeg : l))
            .sort((a, b) => a.seq - b.seq)
            .map((l, i) => toLegPayload(l, i + 1));
          const chainError = validateLegChain(nextLegs);
          if (chainError) {
            toast.error(chainError);
            setSaving(false);
            return;
          }
          await axiosInstance.post(`/load/${loadId}/legs`, { legs: nextLegs });
        } else {
          await axiosInstance.patch(`/legs/${editingLeg.id}`, {
            driver_id: editingLeg.driver_id || null,
            truck_id: editingLeg.truck_id || null,
            miles:
              editingLeg.miles === "" || editingLeg.miles == null
                ? null
                : Number(editingLeg.miles),
            status: editingLeg.status || "pending",
          });
        }
      } else {
        // New leg — replace the ordered set with existing legs + this one.
        const nextLegs = [...legs.slice().sort((a, b) => a.seq - b.seq), editingLeg].map((l, i) =>
          toLegPayload(l, i + 1)
        );
        const chainError = validateLegChain(nextLegs);
        if (chainError) {
          toast.error(chainError);
          setSaving(false);
          return;
        }
        await axiosInstance.post(`/load/${loadId}/legs`, { legs: nextLegs });
      }

      toast.success("Relay legs saved");
      setEditingLeg(null);
      await fetchLegs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save leg");
    } finally {
      setSaving(false);
    }
  };

  const deleteLeg = async (legId) => {
    if (!window.confirm("Delete this leg? Remaining legs are renumbered automatically.")) return;
    try {
      await axiosInstance.delete(`/legs/${legId}`);
      toast.success("Leg deleted");
      await fetchLegs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete leg");
    }
  };

  if (!validLoadId) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
        Relay legs are available once this load is saved on the server.
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-gradient-to-b from-slate-50 to-white p-6 rounded-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Relay Legs</h3>
          <p className="text-xs text-slate-500 mt-1">
            Split this load between drivers — each leg must start where the previous one ends
          </p>
        </div>
        <button
          onClick={() =>
            setEditingLeg(
              emptyLegForm(legs.length + 1, legs.length > 0 ? legs[legs.length - 1] : null)
            )
          }
          className="px-3 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 flex items-center gap-2 font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Leg
        </button>
      </div>

      {/* Summary */}
      {legs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 font-semibold">Legs</div>
            <div className="text-2xl font-bold text-slate-900">{legs.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <MapPin className="w-3 h-3" /> Total Miles
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalMiles > 0 ? totalMiles.toLocaleString() : "—"}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 font-semibold">Drivers Assigned</div>
            <div className="text-2xl font-bold text-slate-900">
              {new Set(legs.map((l) => l.driver_id).filter(Boolean)).size}
            </div>
          </div>
        </div>
      )}

      {/* List / states */}
      {loading ? (
        <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
          Loading relay legs...
        </div>
      ) : loadError ? (
        <div className="py-6 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {loadError}
        </div>
      ) : legs.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MapPin className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm">No relay legs on this load yet. Add a leg to split it between drivers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {legs.map((leg) => (
            <div
              key={leg.id}
              className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-700 font-bold text-sm rounded">
                      Leg {leg.seq}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      {leg.origin_city}
                      {leg.origin_state ? `, ${leg.origin_state}` : ""}
                      <span className="text-slate-400">→</span>
                      {leg.destination_city}
                      {leg.destination_state ? `, ${leg.destination_state}` : ""}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        STATUS_STYLES[String(leg.status || "pending").toLowerCase()] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {String(leg.status || "pending").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                    <span>
                      <span className="font-semibold">Driver:</span> {driverName(leg.driver_id)}
                    </span>
                    <span>
                      <span className="font-semibold">Truck:</span> {truckLabel(leg.truck_id)}
                    </span>
                    <span>
                      <span className="font-semibold">Miles:</span>{" "}
                      {leg.miles != null ? Number(leg.miles).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditingLeg({
                        ...leg,
                        driver_id: leg.driver_id || "",
                        truck_id: leg.truck_id || "",
                        miles: leg.miles ?? "",
                        status: String(leg.status || "pending").toLowerCase(),
                      })
                    }
                    className="p-2 hover:bg-blue-50 rounded text-blue-600"
                    title="Edit leg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLeg(leg.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Delete leg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {editingLeg && (
        <div className="border-2 border-sky-300 rounded-lg p-4 bg-sky-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900">
              {editingLeg.id ? `Edit Leg ${editingLeg.seq}` : `Add Leg ${editingLeg.seq}`}
            </h4>
            <button
              onClick={() => setEditingLeg(null)}
              className="p-1 rounded hover:bg-sky-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Origin City
                </label>
                <input
                  type="text"
                  value={editingLeg.origin_city}
                  onChange={(e) => setEditingLeg({ ...editingLeg, origin_city: e.target.value })}
                  placeholder="e.g. Brampton"
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">State</label>
                <input
                  type="text"
                  value={editingLeg.origin_state || ""}
                  onChange={(e) => setEditingLeg({ ...editingLeg, origin_state: e.target.value })}
                  placeholder="ON"
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Destination City
                </label>
                <input
                  type="text"
                  value={editingLeg.destination_city}
                  onChange={(e) =>
                    setEditingLeg({ ...editingLeg, destination_city: e.target.value })
                  }
                  placeholder="e.g. Detroit"
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">State</label>
                <input
                  type="text"
                  value={editingLeg.destination_state || ""}
                  onChange={(e) =>
                    setEditingLeg({ ...editingLeg, destination_state: e.target.value })
                  }
                  placeholder="MI"
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Driver</label>
              <select
                value={editingLeg.driver_id || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, driver_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.username || d.name || d.driver_code || d.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Truck</label>
              <select
                value={editingLeg.truck_id || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, truck_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.truck_number || t.unit_number || t.name || t.id}
                    {t.status ? ` — ${t.status}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Miles</label>
              <input
                type="number"
                min="0"
                placeholder="Leg distance in miles"
                value={editingLeg.miles}
                onChange={(e) => setEditingLeg({ ...editingLeg, miles: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
              <select
                value={editingLeg.status || "pending"}
                onChange={(e) => setEditingLeg({ ...editingLeg, status: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                {LEG_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={saveLeg}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Save Leg
            </button>
            <button
              onClick={() => setEditingLeg(null)}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
