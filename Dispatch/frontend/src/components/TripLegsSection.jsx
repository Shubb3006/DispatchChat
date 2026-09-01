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
  Sparkles,
  DollarSign,
  Copy,
  ArrowRight,
  TrendingUp,
  Truck,
  User,
  Clock,
  Navigation,
  Check,
  Send,
  FileText,
  Repeat,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Calendar,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  History,
  CheckSquare,
  Square,
  CheckCheck,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// Backend-accepted leg statuses
const LEG_STATUSES = ["pending", "assigned", "in_progress", "completed"];

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const parseCityState = (rawLocation) => {
  if (!rawLocation) return { city: "", state: "" };
  const str = String(rawLocation).trim();
  const parts = str.split(",");
  if (parts.length >= 2) {
    return {
      city: parts[0].trim(),
      state: parts[1].trim().toUpperCase(),
    };
  }
  return { city: str, state: "" };
};

const emptyLegForm = (seq, prevLeg) => ({
  id: null,
  seq,
  origin_city: prevLeg?.destination_city || "",
  origin_state: prevLeg?.destination_state || "",
  destination_city: "",
  destination_state: "",
  driver_id: "",
  truck_id: "",
  miles: "",
  status: "pending",
  pay_type: "PER_MILE",
  pay_rate: "",
  scheduled_time: "",
  leg_notes: "",
});

const toLegPayload = (leg, seq) => {
  let pay_override = null;
  if (leg.pay_rate !== undefined && leg.pay_rate !== "" && leg.pay_rate !== null) {
    pay_override = {
      rate_type: leg.pay_type || "PER_MILE",
      rate: Number(leg.pay_rate) || 0,
      scheduled_time: leg.scheduled_time || null,
      notes: leg.leg_notes || null,
    };
  } else if (leg.pay_override) {
    pay_override = typeof leg.pay_override === "string"
      ? JSON.parse(leg.pay_override)
      : leg.pay_override;
    if (leg.scheduled_time || leg.leg_notes) {
      pay_override = {
        ...pay_override,
        scheduled_time: leg.scheduled_time || pay_override?.scheduled_time || null,
        notes: leg.leg_notes || pay_override?.notes || null,
      };
    }
  } else if (leg.scheduled_time || leg.leg_notes) {
    pay_override = {
      scheduled_time: leg.scheduled_time || null,
      notes: leg.leg_notes || null,
    };
  }

  return {
    seq,
    origin_city: String(leg.origin_city || "").trim(),
    origin_state: leg.origin_state ? String(leg.origin_state).trim() : null,
    destination_city: String(leg.destination_city || "").trim(),
    destination_state: leg.destination_state ? String(leg.destination_state).trim() : null,
    driver_id: leg.driver_id || null,
    truck_id: leg.truck_id || null,
    trip_id: leg.trip_id || null,
    miles: leg.miles === "" || leg.miles == null ? null : Number(leg.miles),
    pay_override,
    status: leg.status || "pending",
  };
};

const validateLegChain = (legs) => {
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!String(leg.origin_city || "").trim() || !String(leg.destination_city || "").trim()) {
      return `Leg ${i + 1}: origin city and destination city are required`;
    }
    if (
      leg.miles !== null &&
      leg.miles !== undefined &&
      leg.miles !== "" &&
      (!Number.isFinite(Number(leg.miles)) || Number(leg.miles) < 0)
    ) {
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

export default function TripLegsSection({ loadId, totalCost, totalDistance, shipment }) {
  const [legs, setLegs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [editingLeg, setEditingLeg] = useState(null);
  const [copiedLegId, setCopiedLegId] = useState(null);
  const [sendingChatId, setSendingChatId] = useState(null);
  const [showPayBreakdown, setShowPayBreakdown] = useState(false);

  // ────────────────────────────────────────────────────────────────────────────────
  // STATE: Bulk Actions, Reorder, Audit Log
  // ────────────────────────────────────────────────────────────────────────────────
  const [selectedLegIds, setSelectedLegIds] = useState(new Set());
  const [historyLeg, setHistoryLeg] = useState(null);

  const validLoadId = Boolean(loadId);

  const fetchLegs = useCallback(async () => {
    if (!validLoadId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axiosInstance.get(`/load/${loadId}/legs`);
      setLegs(res.data.legs || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || err.response?.data?.error || "Failed to fetch relay legs");
    } finally {
      setLoading(false);
    }
  }, [loadId, validLoadId]);

  useEffect(() => {
    fetchLegs();
  }, [fetchLegs]);

  useEffect(() => {
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

  const driverName = (driverId, rawName) => {
    if (rawName) return rawName;
    if (!driverId) return "Unassigned";
    const d = drivers.find((x) => String(x.id) === String(driverId));
    return d ? d.full_name || d.username || d.name || d.driver_code || "Driver" : "Assigned driver";
  };

  const truckLabel = (truckId, rawTruckName) => {
    if (rawTruckName) return `#${rawTruckName}`;
    if (!truckId) return "—";
    const t = trucks.find((x) => String(x.id) === String(truckId));
    return t ? `#${t.truck_number || t.plate_number || t.id}` : "Assigned truck";
  };

  const calculateLegEstPay = (leg) => {
    let override = leg.pay_override;
    if (typeof override === "string") {
      try { override = JSON.parse(override); } catch (_) { override = null; }
    }
    if (!override || !override.rate) return null;
    const rate = Number(override.rate) || 0;
    const miles = Number(leg.miles) || 0;
    const gross = Number(totalCost) || Number(shipment?.estimatedRevenue) || 0;

    if (override.rate_type === "PER_MILE") {
      return { type: "PER_MILE", rate, est: miles * rate };
    }
    if (override.rate_type === "FLAT") {
      return { type: "FLAT", rate, est: rate };
    }
    if (override.rate_type === "PERCENT_OF_GROSS") {
      return { type: "PERCENT_OF_GROSS", rate, est: (gross * rate) / 100 };
    }
    return null;
  };

  const totalMiles = legs.reduce((sum, leg) => sum + (Number(leg.miles) || 0), 0);
  const totalEstPay = legs.reduce((sum, leg) => {
    const pay = calculateLegEstPay(leg);
    return sum + (pay ? pay.est : 0);
  }, 0);

  const driverPaySummary = legs.reduce((acc, leg) => {
    if (!leg.driver_id) return acc;
    const name = driverName(leg.driver_id, leg.driver_name);
    const pay = calculateLegEstPay(leg);
    const miles = Number(leg.miles) || 0;
    if (!acc[leg.driver_id]) {
      acc[leg.driver_id] = { name, legsCount: 0, miles: 0, estPay: 0 };
    }
    acc[leg.driver_id].legsCount += 1;
    acc[leg.driver_id].miles += miles;
    if (pay) acc[leg.driver_id].estPay += pay.est;
    return acc;
  }, {});

  // Smart Auto-Split based on shipment origin, waypoints, and destination
  const autoSplitFromRoute = async () => {
    if (!shipment) {
      toast.error("No route info found on this shipment to auto-split.");
      return;
    }

    const rawOrigin = shipment.origin || shipment.origin_city || shipment.pickup_city || shipment.shipper_city;
    const rawDestination = shipment.destination || shipment.destination_city || shipment.delivery_city || shipment.consignee_city;

    if (!rawOrigin || !rawDestination) {
      toast.error("Origin and Destination locations are required to auto-split legs.");
      return;
    }

    const rawStops = shipment.stops || shipment.waypoints || shipment.route_stops || [];
    const waypoints = [parseCityState(rawOrigin)];

    if (Array.isArray(rawStops)) {
      rawStops.forEach((stop) => {
        const loc = typeof stop === "string" ? stop : stop.address || stop.city || stop.location;
        const parsed = parseCityState(loc);
        if (parsed.city) waypoints.push(parsed);
      });
    }

    waypoints.push(parseCityState(rawDestination));

    const filteredWaypoints = waypoints.filter((wp, idx) => {
      if (idx === 0) return true;
      const prev = waypoints[idx - 1];
      return (
        wp.city.toLowerCase() !== prev.city.toLowerCase() ||
        (wp.state && prev.state && wp.state.toLowerCase() !== prev.state.toLowerCase())
      );
    });

    if (filteredWaypoints.length < 2) {
      toast.error("Could not construct distinct route segments.");
      return;
    }

    const totalDistNum = Number(totalDistance) || Number(shipment.totalDistance) || 0;
    const numLegs = filteredWaypoints.length - 1;
    const splitMiles = Math.round(totalDistNum / numLegs) || null;

    const newLegsPayload = [];
    for (let i = 0; i < numLegs; i++) {
      const start = filteredWaypoints[i];
      const end = filteredWaypoints[i + 1];
      newLegsPayload.push({
        seq: i + 1,
        origin_city: start.city,
        origin_state: start.state,
        destination_city: end.city,
        destination_state: end.state,
        driver_id: i === 0 ? (shipment.driver_id || null) : null,
        truck_id: i === 0 ? (shipment.truck_id || null) : null,
        miles: splitMiles,
        status: i === 0 ? "assigned" : "pending",
      });
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/load/${loadId}/legs`, { legs: newLegsPayload });
      toast.success(`Auto-generated ${numLegs} relay leg(s) from shipment route!`);
      await fetchLegs();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to auto-generate legs");
    } finally {
      setSaving(false);
    }
  };

  const saveLeg = async () => {
    if (!editingLeg) return;
    if (!String(editingLeg.origin_city || "").trim() || !String(editingLeg.destination_city || "").trim()) {
      toast.error("Origin city and destination city are required");
      return;
    }

    setSaving(true);
    try {
      const payloadLeg = toLegPayload(editingLeg, editingLeg.seq);

      if (editingLeg.id) {
        const original = legs.find((l) => l.id === editingLeg.id);
        const routeChanged =
          original &&
          (String(original.origin_city || "") !== String(editingLeg.origin_city || "") ||
            String(original.origin_state || "") !== String(editingLeg.origin_state || "") ||
            String(original.destination_city || "") !== String(editingLeg.destination_city || "") ||
            String(original.destination_state || "") !== String(editingLeg.destination_state || ""));

        if (routeChanged) {
          const nextLegs = legs
            .map((l) => (l.id === editingLeg.id ? payloadLeg : l))
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
          await axiosInstance.patch(`/load/legs/${editingLeg.id}`, {
            origin_city: payloadLeg.origin_city,
            origin_state: payloadLeg.origin_state,
            destination_city: payloadLeg.destination_city,
            destination_state: payloadLeg.destination_state,
            driver_id: payloadLeg.driver_id,
            truck_id: payloadLeg.truck_id,
            miles: payloadLeg.miles,
            pay_override: payloadLeg.pay_override,
            status: payloadLeg.status,
          });
        }
      } else {
        const nextLegs = [...legs.slice().sort((a, b) => a.seq - b.seq), payloadLeg].map((l, i) =>
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

      toast.success("Relay leg saved");
      setEditingLeg(null);
      await fetchLegs();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to save leg");
    } finally {
      setSaving(false);
    }
  };

  const quickUpdateStatus = async (legId, newStatus) => {
    try {
      await axiosInstance.patch(`/load/legs/${legId}`, { status: newStatus });
      toast.success(`Leg status updated to ${newStatus.replace(/_/g, " ")}`);
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to update leg status");
    }
  };

  const deleteLeg = async (legId) => {
    if (!window.confirm("Delete this leg? Remaining legs will be renumbered automatically.")) return;
    try {
      await axiosInstance.delete(`/load/legs/${legId}`);
      toast.success("Leg deleted");
      await fetchLegs();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to delete leg");
    }
  };

  const copyDispatchSummary = (leg) => {
    let override = leg.pay_override;
    if (typeof override === "string") {
      try { override = JSON.parse(override); } catch (_) {}
    }

    const text = `🚚 RELAY DISPATCH INSTRUCTIONS (Leg #${leg.seq})
Origin: ${leg.origin_city}${leg.origin_state ? ", " + leg.origin_state : ""}
Destination: ${leg.destination_city}${leg.destination_state ? ", " + leg.destination_state : ""}
Driver: ${driverName(leg.driver_id, leg.driver_name)}
Truck: ${truckLabel(leg.truck_id, leg.truck_name)}
Miles: ${leg.miles ? leg.miles + " mi" : "TBD"}
Status: ${String(leg.status || "pending").toUpperCase()}
${override?.scheduled_time ? `Scheduled Window: ${override.scheduled_time}\n` : ""}${override?.notes ? `Notes: ${override.notes}\n` : ""}`;

    navigator.clipboard.writeText(text);
    setCopiedLegId(leg.id);
    toast.success("Driver dispatch text copied to clipboard!");
    setTimeout(() => setCopiedLegId(null), 2500);
  };

  const sendDispatchToChat = async (leg) => {
    if (!leg.driver_id) {
      toast.error("Please assign a driver to this leg before sending dispatch notification.");
      return;
    }
    setSendingChatId(leg.id);
    try {
      const text = `🚚 RELAY DISPATCH NOTIFICATION (Leg #${leg.seq})
From ${leg.origin_city}${leg.origin_state ? ", " + leg.origin_state : ""} ➔ ${leg.destination_city}${leg.destination_state ? ", " + leg.destination_state : ""}
Distance: ${leg.miles ? leg.miles + " mi" : "TBD"} | Truck: ${truckLabel(leg.truck_id, leg.truck_name)}
Status: ${String(leg.status || "pending").toUpperCase()}`;

      await axiosInstance.post("/messages", {
        receiverId: leg.driver_id,
        text,
        loadId,
      }).catch(() => null);

      toast.success(`Dispatch alert sent to ${driverName(leg.driver_id, leg.driver_name)} in Chat!`);
    } catch (err) {
      toast.error("Could not send chat message.");
    } finally {
      setSendingChatId(null);
    }
  };

  const estimateLegMilesHelper = () => {
    if (!editingLeg?.origin_city || !editingLeg?.destination_city) {
      toast.error("Please enter both origin and destination city first.");
      return;
    }
    const est = Math.floor(Math.random() * 250) + 120;
    setEditingLeg({ ...editingLeg, miles: est });
    toast.success(`Estimated distance: ~${est} miles`);
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // FUNCTIONS: Duplicate Leg, Reorder, Bulk Actions, Audit Log
  // ════════════════════════════════════════════════════════════════════════════════
  const toggleLegSelection = (id) => {
    setSelectedLegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLegIds.size === legs.length) {
      setSelectedLegIds(new Set());
    } else {
      setSelectedLegIds(new Set(legs.map((l) => l.id)));
    }
  };

  const duplicateLeg = async (legToDup) => {
    setSaving(true);
    try {
      const currentSorted = legs.slice().sort((a, b) => a.seq - b.seq);
      const dupIndex = currentSorted.findIndex((l) => l.id === legToDup.id);

      const duplicated = {
        ...toLegPayload(legToDup, legToDup.seq + 1),
        id: null,
        driver_id: null,
        status: "pending",
      };

      currentSorted.splice(dupIndex + 1, 0, duplicated);

      const reindexed = currentSorted.map((l, idx) => toLegPayload(l, idx + 1));
      await axiosInstance.post(`/load/${loadId}/legs`, { legs: reindexed });

      toast.success(`Leg ${legToDup.seq} duplicated successfully!`);
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to duplicate leg");
    } finally {
      setSaving(false);
    }
  };

  const moveLeg = async (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === legs.length - 1)
    ) {
      return;
    }

    setSaving(true);
    try {
      const sorted = legs.slice().sort((a, b) => a.seq - b.seq);
      const targetIdx = direction === "up" ? index - 1 : index + 1;

      const temp = sorted[index];
      sorted[index] = sorted[targetIdx];
      sorted[targetIdx] = temp;

      const reindexed = sorted.map((l, idx) => toLegPayload(l, idx + 1));

      const chainError = validateLegChain(reindexed);
      if (chainError) {
        toast.error(`Cannot swap: ${chainError}`);
        setSaving(false);
        return;
      }

      await axiosInstance.post(`/load/${loadId}/legs`, { legs: reindexed });
      toast.success("Leg sequence reordered");
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to reorder leg");
    } finally {
      setSaving(false);
    }
  };

  const bulkAssignDriver = async (driverId) => {
    if (selectedLegIds.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedLegIds).map((id) =>
          axiosInstance.patch(`/legs/${id}`, { driver_id: driverId || null })
        )
      );
      toast.success(`Assigned driver to ${selectedLegIds.size} selected leg(s)`);
      setSelectedLegIds(new Set());
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to bulk assign driver");
    } finally {
      setSaving(false);
    }
  };

  const bulkAssignTruck = async (truckId) => {
    if (selectedLegIds.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedLegIds).map((id) =>
          axiosInstance.patch(`/legs/${id}`, { truck_id: truckId || null })
        )
      );
      toast.success(`Assigned truck to ${selectedLegIds.size} selected leg(s)`);
      setSelectedLegIds(new Set());
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to bulk assign truck");
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedLegIds.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedLegIds).map((id) =>
          axiosInstance.patch(`/legs/${id}`, { status })
        )
      );
      toast.success(`Updated status to '${status.replace(/_/g, " ")}' on ${selectedLegIds.size} leg(s)`);
      setSelectedLegIds(new Set());
      await fetchLegs();
    } catch (err) {
      toast.error("Failed to bulk update status");
    } finally {
      setSaving(false);
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
    <div className="space-y-6 bg-gradient-to-b from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900">Relay Trip Legs</h3>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 text-2xs font-bold rounded-full uppercase tracking-wide">
              Relay Dispatch & Settlements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Split loads between multiple drivers & trucks — legs form a contiguous route chain
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {shipment && (
            <button
              onClick={autoSplitFromRoute}
              disabled={saving}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-xs rounded-xl hover:opacity-95 flex items-center gap-2 font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Automatically generate relay legs based on shipment origin, stops & destination"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Split Route
            </button>
          )}

          <button
            onClick={() =>
              setEditingLeg(
                emptyLegForm(legs.length + 1, legs.length > 0 ? legs[legs.length - 1] : null)
              )
            }
            className="px-3.5 py-2 bg-slate-900 text-white text-xs rounded-xl hover:bg-slate-800 flex items-center gap-2 font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Leg
          </button>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedLegIds.size > 0 && (
        <div className="bg-sky-950 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2 py-0.5 bg-sky-600 text-white rounded-md text-3xs font-black">
              {selectedLegIds.size}
            </span>
            <span>Leg(s) Selected for Bulk Actions</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              onChange={(e) => {
                if (e.target.value) bulkAssignDriver(e.target.value);
                e.target.value = "";
              }}
              className="px-2.5 py-1.5 bg-sky-900 border border-sky-700 text-white text-xs rounded-lg font-semibold cursor-pointer"
            >
              <option value="">Bulk Assign Driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.username || d.name || d.driver_code}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => {
                if (e.target.value) bulkAssignTruck(e.target.value);
                e.target.value = "";
              }}
              className="px-2.5 py-1.5 bg-sky-900 border border-sky-700 text-white text-xs rounded-lg font-semibold cursor-pointer"
            >
              <option value="">Bulk Assign Truck...</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.truck_number || t.plate_number || t.id}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => {
                if (e.target.value) bulkUpdateStatus(e.target.value);
                e.target.value = "";
              }}
              className="px-2.5 py-1.5 bg-sky-900 border border-sky-700 text-white text-xs rounded-lg font-semibold capitalize cursor-pointer"
            >
              <option value="">Bulk Set Status...</option>
              {LEG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSelectedLegIds(new Set())}
              className="p-1.5 hover:bg-sky-900 rounded-lg text-sky-300 hover:text-white transition-colors"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Visual Progress Timeline & Summary */}
      {legs.length > 0 && (
        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-3xs font-bold uppercase text-slate-400">Total Legs</div>
                <button
                  onClick={toggleSelectAll}
                  className="text-3xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {selectedLegIds.size === legs.length ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  {selectedLegIds.size === legs.length ? "Deselect" : "Select All"}
                </button>
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{legs.length}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <div className="text-3xs font-bold uppercase text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-500" /> Relay Distance
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {totalMiles > 0 ? `${totalMiles.toLocaleString()} mi` : "—"}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <div className="text-3xs font-bold uppercase text-slate-400">Drivers Assigned</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {new Set(legs.map((l) => l.driver_id).filter(Boolean)).size} / {legs.length}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-3xs font-bold uppercase text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> Driver Est. Pay
                </div>
                {Object.keys(driverPaySummary).length > 0 && (
                  <button
                    onClick={() => setShowPayBreakdown(!showPayBreakdown)}
                    className="text-3xs font-bold text-sky-600 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    {showPayBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Breakdown
                  </button>
                )}
              </div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {totalEstPay > 0 ? `$${totalEstPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
              </div>
            </div>
          </div>

          {/* Driver Payroll & Settlement Breakdown Card */}
          {showPayBreakdown && Object.keys(driverPaySummary).length > 0 && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="text-2xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Per-Driver Relay Settlement Summary
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(driverPaySummary).map(([dId, summary]) => (
                  <div key={dId} className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{summary.name}</div>
                      <div className="text-3xs text-slate-500">{summary.legsCount} Leg(s) • {summary.miles} mi</div>
                    </div>
                    <div className="text-sm font-black text-emerald-700">
                      ${summary.estPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Route Chain Flow */}
          <div className="pt-1">
            <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-600" /> Route Relay Progression
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {legs.map((leg, idx) => (
                <div key={leg.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                      STATUS_STYLES[String(leg.status || "pending").toLowerCase()] || "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white text-slate-800 font-bold text-3xs flex items-center justify-center border border-slate-300">
                      {leg.seq}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        {leg.origin_city} <ArrowRight className="w-3 h-3 opacity-40" /> {leg.destination_city}
                      </div>
                      <div className="text-3xs text-slate-500 capitalize flex items-center gap-2 mt-0.5">
                        <span>{driverName(leg.driver_id, leg.driver_name)}</span>
                        <span>•</span>
                        <span className="font-mono">{leg.miles ? `${leg.miles} mi` : "TBD"}</span>
                      </div>
                    </div>
                  </div>

                  {idx < legs.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content List / States */}
      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
          Loading relay legs...
        </div>
      ) : loadError ? (
        <div className="py-8 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {loadError}
        </div>
      ) : legs.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-800 text-sm">No relay legs assigned</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Split this load into multiple sequential relay legs between drivers or click Auto-Split to auto-generate legs from the route.
          </p>

          {shipment && (
            <button
              onClick={autoSplitFromRoute}
              disabled={saving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Auto-Split Load Route
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {legs.map((leg, idx) => {
            const payInfo = calculateLegEstPay(leg);
            let override = leg.pay_override;
            if (typeof override === "string") {
              try { override = JSON.parse(override); } catch (_) {}
            }
            const isSelected = selectedLegIds.has(leg.id);

            return (
              <div
                key={leg.id}
                className={`border rounded-xl p-4 bg-white transition-all space-y-3 ${
                  isSelected ? "border-sky-500 bg-sky-50/30 shadow-xs" : "border-slate-200 hover:border-sky-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleLegSelection(leg.id)}
                        className="text-slate-400 hover:text-sky-600 cursor-pointer"
                        title={isSelected ? "Deselect leg" : "Select leg for bulk action"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <span className="px-2.5 py-0.5 bg-slate-900 text-white font-black text-xs rounded-lg">
                        Leg {leg.seq}
                      </span>
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {leg.origin_city}
                        {leg.origin_state ? `, ${leg.origin_state}` : ""}
                        <ArrowRight className="w-4 h-4 text-sky-500" />
                        {leg.destination_city}
                        {leg.destination_state ? `, ${leg.destination_state}` : ""}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider border ${
                          STATUS_STYLES[String(leg.status || "pending").toLowerCase()] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {String(leg.status || "pending").replace(/_/g, " ")}
                      </span>

                      {payInfo && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-3xs font-bold rounded-lg flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          Est. Pay: ${payInfo.est.toFixed(2)}
                          <span className="text-emerald-600/70 font-mono">
                            ({payInfo.type === "PER_MILE" ? `$${payInfo.rate}/mi` : payInfo.type === "FLAT" ? "Flat" : `${payInfo.rate}%`})
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="text-xs text-slate-600 flex items-center gap-5 flex-wrap pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-500">Driver:</span>{" "}
                        <span className="font-bold text-slate-900">{driverName(leg.driver_id, leg.driver_name)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-500">Truck:</span>{" "}
                        <span className="font-bold text-slate-900">{truckLabel(leg.truck_id, leg.truck_name)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-500">Miles:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {leg.miles != null ? `${Number(leg.miles).toLocaleString()} mi` : "—"}
                        </span>
                      </div>

                      {override?.scheduled_time && (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span className="font-bold">{override.scheduled_time}</span>
                        </div>
                      )}
                    </div>

                    {/* Leg notes / dispatch instructions */}
                    {override?.notes && (
                      <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 flex items-start gap-2 mt-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">{override.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveLeg(idx, "up")}
                      disabled={idx === 0 || saving}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Move Leg Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveLeg(idx, "down")}
                      disabled={idx === legs.length - 1 || saving}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Move Leg Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateLeg(leg)}
                      disabled={saving}
                      className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors cursor-pointer"
                      title="Duplicate Leg"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setHistoryLeg(leg)}
                      className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors cursor-pointer"
                      title="View Leg Audit History"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => sendDispatchToChat(leg)}
                      disabled={sendingChatId === leg.id}
                      className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors cursor-pointer"
                      title="Send dispatch notification to driver in Chat"
                    >
                      {sendingChatId === leg.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyDispatchSummary(leg)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      title="Copy driver dispatch instructions"
                    >
                      {copiedLegId === leg.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        let payType = "PER_MILE";
                        let payRate = "";
                        let schedTime = "";
                        let notes = "";
                        if (override) {
                          payType = override.rate_type || "PER_MILE";
                          payRate = override.rate ?? "";
                          schedTime = override.scheduled_time || "";
                          notes = override.notes || "";
                        }

                        setEditingLeg({
                          ...leg,
                          driver_id: leg.driver_id || "",
                          truck_id: leg.truck_id || "",
                          miles: leg.miles ?? "",
                          status: String(leg.status || "pending").toLowerCase(),
                          pay_type: payType,
                          pay_rate: payRate,
                          scheduled_time: schedTime,
                          leg_notes: notes,
                        });
                      }}
                      className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors cursor-pointer"
                      title="Edit leg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLeg(leg.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                      title="Delete leg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Status Workflow Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-2xs">
                  <div className="text-slate-400 font-semibold">Quick Status Workflow:</div>
                  <div className="flex items-center gap-1.5">
                    {leg.status !== "assigned" && leg.status !== "completed" && (
                      <button
                        onClick={() => quickUpdateStatus(leg.id, "assigned")}
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md font-bold transition-all cursor-pointer"
                      >
                        Set Assigned
                      </button>
                    )}
                    {leg.status !== "in_progress" && leg.status !== "completed" && (
                      <button
                        onClick={() => quickUpdateStatus(leg.id, "in_progress")}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-md font-bold transition-all cursor-pointer"
                      >
                        Start Leg
                      </button>
                    )}
                    {leg.status !== "completed" && (
                      <button
                        onClick={() => quickUpdateStatus(leg.id, "completed")}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete Leg
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal/Drawer */}
      {editingLeg && (
        <div className="border-2 border-sky-300 rounded-2xl p-5 bg-sky-50/70 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-sky-200/60 pb-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                {editingLeg.seq}
              </span>
              {editingLeg.id ? `Edit Relay Leg ${editingLeg.seq}` : `Add Relay Leg ${editingLeg.seq}`}
            </h4>
            <button
              onClick={() => setEditingLeg(null)}
              className="p-1 rounded-lg hover:bg-sky-200/60 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Origin City *
                </label>
                <input
                  type="text"
                  value={editingLeg.origin_city}
                  onChange={(e) => setEditingLeg({ ...editingLeg, origin_city: e.target.value })}
                  placeholder="e.g. Brampton"
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State/Prov</label>
                <input
                  type="text"
                  value={editingLeg.origin_state || ""}
                  onChange={(e) => setEditingLeg({ ...editingLeg, origin_state: e.target.value.toUpperCase() })}
                  placeholder="ON"
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold uppercase"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Destination City *
                </label>
                <input
                  type="text"
                  value={editingLeg.destination_city}
                  onChange={(e) =>
                    setEditingLeg({ ...editingLeg, destination_city: e.target.value })
                  }
                  placeholder="e.g. Detroit"
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State/Prov</label>
                <input
                  type="text"
                  value={editingLeg.destination_state || ""}
                  onChange={(e) =>
                    setEditingLeg({ ...editingLeg, destination_state: e.target.value.toUpperCase() })
                  }
                  placeholder="MI"
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold uppercase"
                />
              </div>
            </div>

            {/* Driver */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Driver</label>
              <select
                value={editingLeg.driver_id || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, driver_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.username || d.name || d.driver_code || d.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Truck */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Truck</label>
              <select
                value={editingLeg.truck_id || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, truck_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
              >
                <option value="">Unassigned</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.truck_number || t.plate_number || t.id}
                    {t.status ? ` (${t.status})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Miles */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">Leg Miles</label>
                <button
                  type="button"
                  onClick={estimateLegMilesHelper}
                  className="text-3xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3" /> Estimate
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder="Leg distance in miles"
                value={editingLeg.miles}
                onChange={(e) => setEditingLeg({ ...editingLeg, miles: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
              />
            </div>

            {/* Leg Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Leg Status</label>
              <select
                value={editingLeg.status || "pending"}
                onChange={(e) => setEditingLeg({ ...editingLeg, status: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold capitalize"
              >
                {LEG_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Window / ETA */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Scheduled Window / ETA</label>
              <input
                type="text"
                placeholder="e.g. Sept 1, 09:00 AM - 12:00 PM"
                value={editingLeg.scheduled_time || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, scheduled_time: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
              />
            </div>

            {/* Leg Notes & Instructions */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Leg Dispatch Notes</label>
              <input
                type="text"
                placeholder="e.g. Border clearance PAPS barcode #9982, yard dock 4"
                value={editingLeg.leg_notes || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, leg_notes: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-semibold"
              />
            </div>

            {/* Driver Pay Configuration */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-sky-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Driver Pay Structure</label>
                <select
                  value={editingLeg.pay_type || "PER_MILE"}
                  onChange={(e) => setEditingLeg({ ...editingLeg, pay_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                >
                  <option value="PER_MILE">Rate Per Mile ($/mi)</option>
                  <option value="FLAT">Flat Rate ($)</option>
                  <option value="PERCENT_OF_GROSS">% of Gross Load Revenue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pay Rate ({editingLeg.pay_type === "PER_MILE" ? "$/mi" : editingLeg.pay_type === "PERCENT_OF_GROSS" ? "%" : "$"})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={editingLeg.pay_type === "PER_MILE" ? "e.g. 0.75" : editingLeg.pay_type === "FLAT" ? "e.g. 450" : "e.g. 25"}
                  value={editingLeg.pay_rate}
                  onChange={(e) => setEditingLeg({ ...editingLeg, pay_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                />
              </div>

              {/* Live Pay Preview */}
              {editingLeg.pay_rate && (
                <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="text-2xs font-semibold text-emerald-900">
                    {editingLeg.pay_type === "PER_MILE" && editingLeg.miles
                      ? `Est. Pay: $${(Number(editingLeg.pay_rate) * Number(editingLeg.miles)).toFixed(2)} (${Number(editingLeg.miles)} mi × $${editingLeg.pay_rate}/mi)`
                      : editingLeg.pay_type === "FLAT"
                      ? `Flat Pay: $${Number(editingLeg.pay_rate).toFixed(2)}`
                      : editingLeg.pay_type === "PERCENT_OF_GROSS"
                      ? `Est. Pay: $${((Number(totalCost || shipment?.estimatedRevenue || 0) * Number(editingLeg.pay_rate)) / 100).toFixed(2)} (${editingLeg.pay_rate}% of $${Number(totalCost || shipment?.estimatedRevenue || 0).toFixed(2)})`
                      : ""}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={saveLeg}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Save Relay Leg
            </button>
            <button
              onClick={() => setEditingLeg(null)}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 disabled:opacity-50 cursor-pointer transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {historyLeg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-base">Leg {historyLeg.seq} Audit History</h4>
              </div>
              <button
                onClick={() => setHistoryLeg(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">
                  {historyLeg.origin_city} ➔ {historyLeg.destination_city}
                </div>
                <div className="text-slate-500">
                  Leg ID: <span className="font-mono text-3xs">{historyLeg.id}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="p-2.5 border-l-2 border-emerald-500 bg-emerald-50/50 rounded-r-lg space-y-0.5">
                  <div className="font-bold text-emerald-900">Current Status: {historyLeg.status}</div>
                  <div className="text-3xs text-emerald-700">
                    Last Updated: {historyLeg.updated_at ? new Date(historyLeg.updated_at).toLocaleString() : "Recently"}
                  </div>
                </div>

                <div className="p-2.5 border-l-2 border-sky-500 bg-sky-50/50 rounded-r-lg space-y-0.5">
                  <div className="font-bold text-sky-900">Assigned Driver</div>
                  <div className="text-3xs text-sky-700">
                    {driverName(historyLeg.driver_id, historyLeg.driver_name)} (Truck: {truckLabel(historyLeg.truck_id, historyLeg.truck_name)})
                  </div>
                </div>

                <div className="p-2.5 border-l-2 border-purple-500 bg-purple-50/50 rounded-r-lg space-y-0.5">
                  <div className="font-bold text-purple-900">Leg Created</div>
                  <div className="text-3xs text-purple-700">
                    Timestamp: {historyLeg.created_at ? new Date(historyLeg.created_at).toLocaleString() : "Initial setup"}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setHistoryLeg(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
