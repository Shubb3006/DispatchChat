import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { Plus, Trash2, Edit2, Loader2, ChevronUp, ChevronDown, MapPin, Clock, DollarSign, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function TripLegsSection({ loadId, totalCost = null, totalDistance = null }) {
  const [legs, setLegs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);
  const [costPerMile, setCostPerMile] = useState(1.85);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  useEffect(() => {
    fetchLegs();
    fetchAvailableResources();
  }, [loadId]);

  const fetchLegs = async () => {
    try {
      const res = await axiosInstance.get(`/load/${loadId}/legs`);
      setLegs(res.data.legs || []);
    } catch (err) {
      console.warn("Failed to fetch legs");
    }
  };

  const fetchAvailableResources = async () => {
    try {
      const [driversRes, trucksRes] = await Promise.all([
        axiosInstance.get("/drivers?status=active&limit=100"),
        axiosInstance.get("/trucks?status=available&limit=100"),
      ]);
      setDrivers(driversRes.data.drivers || []);
      setTrucks(trucksRes.data.trucks || []);
    } catch (err) {
      console.warn("Failed to fetch resources");
    }
  };

  const validateLegChain = (newLegs) => {
    // Check for gaps in sequence
    const sequences = newLegs.map((l) => l.seq).sort((a, b) => a - b);
    for (let i = 0; i < sequences.length; i++) {
      if (sequences[i] !== i + 1) {
        return "Leg sequence must be continuous (1, 2, 3...)";
      }
    }
    return null;
  };

  const saveLeg = async () => {
    if (!editingLeg.driver_id || !editingLeg.truck_id) {
      toast.error("Driver and truck required");
      return;
    }

    if (!editingLeg.miles || editingLeg.miles < 5) {
      toast.error("Miles must be at least 5");
      return;
    }

    try {
      const updatedLegs = editingLeg.id
        ? legs.map((l) => (l.id === editingLeg.id ? editingLeg : l))
        : [...legs, { ...editingLeg, id: `new-${Date.now()}` }];

      const chainError = validateLegChain(updatedLegs);
      if (chainError) {
        toast.error(chainError);
        return;
      }

      if (editingLeg.id) {
        await axiosInstance.patch(`/legs/${editingLeg.id}`, editingLeg);
      } else {
        await axiosInstance.post(`/load/${loadId}/legs`, updatedLegs);
      }

      toast.success("Leg saved");
      setEditingLeg(null);
      fetchLegs();
    } catch (err) {
      toast.error("Failed to save leg");
    }
  };

  const deleteLeg = async (legId) => {
    if (!window.confirm("Delete this leg? Sequence will be auto-reindexed.")) return;

    try {
      await axiosInstance.delete(`/legs/${legId}`);
      toast.success("Leg deleted");
      fetchLegs();
    } catch (err) {
      toast.error("Failed to delete leg");
    }
  };

  const moveLeg = async (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === legs.length - 1) return;

    const newLegs = [...legs];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    // Swap sequences
    [newLegs[index].seq, newLegs[swapIndex].seq] = [newLegs[swapIndex].seq, newLegs[index].seq];

    try {
      await axiosInstance.post(`/load/${loadId}/legs`, newLegs);
      toast.success("Leg reordered");
      fetchLegs();
    } catch (err) {
      toast.error("Failed to reorder");
    }
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? `${driver.name || driver.driver_name} (${driver.driver_code || driverId})` : driverId;
  };

  const getTruckName = (truckId) => {
    const truck = trucks.find((t) => t.id === truckId);
    return truck ? `${truck.truck_number || truck.name} (${truck.status})` : truckId;
  };

  const totalLegsDistance = legs.reduce((sum, leg) => sum + (leg.miles || 0), 0);
  const totalLegsHours = legs.reduce((sum, leg) => sum + ((leg.miles || 0) / 65), 0); // Assuming 65 mph avg
  const estimatedCost = totalLegsDistance * costPerMile;

  const getDriverHOS = (driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.hos_remaining_hours || 11;
  };

  const canAssignDriver = (driverId, estimatedHours) => {
    return getDriverHOS(driverId) >= estimatedHours;
  };

  return (
    <div className="space-y-6 bg-gradient-to-b from-slate-50 to-white p-6 rounded-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Relay Legs Management</h3>
          <p className="text-xs text-slate-500 mt-1">Configure multi-driver load relay chains</p>
        </div>
        <button
          onClick={() => setEditingLeg({ seq: legs.length + 1, driver_id: "", truck_id: "", status: "pending", miles: 0, rate_per_mile: costPerMile })}
          className="px-3 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 flex items-center gap-2 font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Leg
        </button>
      </div>

      {/* Summary Cards */}
      {legs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 font-semibold">Total Legs</div>
            <div className="text-2xl font-bold text-slate-900">{legs.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <MapPin className="w-3 h-3" /> Total Miles
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalLegsDistance}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Clock className="w-3 h-3" /> Est. Hours
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalLegsHours.toFixed(1)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <DollarSign className="w-3 h-3" /> Est. Cost
            </div>
            <div className="text-2xl font-bold text-emerald-600">${estimatedCost.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Cost Per Mile Slider */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900">Cost Per Mile</label>
          <div className="text-sm font-mono text-blue-600">${costPerMile.toFixed(2)}/mi</div>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={costPerMile}
          onChange={(e) => setCostPerMile(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Legs List */}
      {legs.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MapPin className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm">No legs added yet. Add a leg to start building your relay chain.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {legs.map((leg, index) => {
            const driver = drivers.find((d) => d.id === leg.driver_id);
            const truck = trucks.find((t) => t.id === leg.truck_id);
            const legCost = (leg.miles || 0) * costPerMile;
            const legHours = (leg.miles || 0) / 65;
            const driverHOS = getDriverHOS(leg.driver_id);
            const canDrive = driverHOS >= legHours;

            return (
              <div key={leg.id || `leg-${index}`} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  {/* Leg Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-sky-100 text-sky-700 font-bold text-sm rounded">Leg {leg.seq}</span>
                      <span className="text-sm font-semibold text-slate-900">{getDriverName(leg.driver_id)}</span>
                      {canDrive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    {/* Truck Info */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-semibold">Truck:</span> {getTruckName(leg.truck_id)}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>
                          <span className="font-semibold">Miles:</span> {leg.miles} mi
                        </span>
                        <span>
                          <span className="font-semibold">Est. Time:</span> {legHours.toFixed(1)}h
                        </span>
                        <span className="text-emerald-600 font-bold">
                          <span className="font-semibold">Cost:</span> ${legCost.toFixed(2)}
                        </span>
                      </div>

                      {/* Driver HOS Status */}
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${canDrive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        HOS: {driverHOS}h remaining {legHours > driverHOS ? "⚠ INSUFFICIENT" : "✓ OK"}
                      </div>

                      {leg.status && (
                        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          leg.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                          leg.status === "active" ? "bg-blue-50 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {leg.status === "completed" ? "✓ Completed" : leg.status === "active" ? "⏱ Active" : "⋯ Pending"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-1">
                    {/* Move Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveLeg(index, "up")}
                        disabled={index === 0}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => moveLeg(index, "down")}
                        disabled={index === legs.length - 1}
                        className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    {/* Edit/Delete */}
                    <button
                      onClick={() => setEditingLeg(leg)}
                      className="p-2 hover:bg-blue-50 rounded text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLeg(leg.id)}
                      className="p-2 hover:bg-red-50 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Form */}
      {editingLeg && (
        <div className="border-2 border-sky-300 rounded-lg p-4 bg-sky-50 space-y-3">
          <h4 className="font-bold text-slate-900">
            {editingLeg.id ? `Edit Leg ${editingLeg.seq}` : `Add New Leg #${editingLeg.seq}`}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Driver Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Select Driver</label>
              <select
                value={editingLeg.driver_id}
                onChange={(e) => setEditingLeg({ ...editingLeg, driver_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                <option value="">Choose Driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.driver_name} - HOS: {d.hos_remaining_hours || 11}h
                  </option>
                ))}
              </select>
              {editingLeg.driver_id && (
                <div className="text-xs text-slate-600 mt-1">
                  HOS: {getDriverHOS(editingLeg.driver_id)}h | Phone: {drivers.find(d => d.id === editingLeg.driver_id)?.phone || "N/A"}
                </div>
              )}
            </div>

            {/* Truck Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Select Truck</label>
              <select
                value={editingLeg.truck_id}
                onChange={(e) => setEditingLeg({ ...editingLeg, truck_id: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                <option value="">Choose Truck...</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.truck_number} - {t.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Miles */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Miles</label>
              <input
                type="number"
                min="5"
                placeholder="Distance in miles"
                value={editingLeg.miles || ""}
                onChange={(e) => setEditingLeg({ ...editingLeg, miles: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
              <select
                value={editingLeg.status || "pending"}
                onChange={(e) => setEditingLeg({ ...editingLeg, status: e.target.value })}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm bg-white"
              >
                <option value="pending">⋯ Pending</option>
                <option value="active">⏱ Active</option>
                <option value="completed">✓ Completed</option>
              </select>
            </div>
          </div>

          {/* Cost Preview */}
          {editingLeg.miles && (
            <div className="bg-white rounded p-2 text-sm border border-sky-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Est. Cost:</span>
                <span className="font-bold text-emerald-600">${(editingLeg.miles * costPerMile).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Est. Time:</span>
                <span>{((editingLeg.miles || 0) / 65).toFixed(1)}h @ 65 mph</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={saveLeg}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Leg
            </button>
            <button
              onClick={() => setEditingLeg(null)}
              className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {legs.length > 0 && (
        <button
          onClick={() => setShowCostBreakdown(!showCostBreakdown)}
          className="w-full px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2"
        >
          <DollarSign className="w-4 h-4" /> {showCostBreakdown ? "Hide" : "Show"} Cost Breakdown
        </button>
      )}

      {showCostBreakdown && legs.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">Cost Breakdown per Leg</div>
          {legs.map((leg, index) => {
            const legCost = (leg.miles || 0) * costPerMile;
            const percentage = ((legCost / estimatedCost) * 100).toFixed(1);
            return (
              <div key={leg.id || index} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Leg {leg.seq}: {leg.miles}mi @ ${costPerMile.toFixed(2)}/mi
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="font-bold text-emerald-600 text-right w-16">${legCost.toFixed(2)} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-slate-300 flex items-center justify-between font-bold">
            <span className="text-slate-900">Total Relay Cost:</span>
            <span className="text-lg text-emerald-600">${estimatedCost.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
