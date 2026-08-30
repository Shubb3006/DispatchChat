import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TripLegsSection({ loadId }) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);

  useEffect(() => {
    fetchLegs();
  }, [loadId]);

  const fetchLegs = async () => {
    try {
      const res = await axiosInstance.get(`/load/${loadId}/legs`);
      setLegs(res.data.legs || []);
    } catch (err) {
      console.warn("Failed to fetch legs");
    }
  };

  const saveLeg = async () => {
    if (!editingLeg.driver_id || !editingLeg.truck_id) {
      toast.error("Driver and truck required");
      return;
    }
    try {
      if (editingLeg.id) {
        await axiosInstance.patch(`/legs/${editingLeg.id}`, editingLeg);
      } else {
        await axiosInstance.post(`/load/${loadId}/legs`, [...legs, editingLeg]);
      }
      toast.success("Leg saved");
      setEditingLeg(null);
      fetchLegs();
    } catch (err) {
      toast.error("Failed to save leg");
    }
  };

  const deleteLeg = async (legId) => {
    try {
      await axiosInstance.delete(`/legs/${legId}`);
      toast.success("Leg deleted");
      fetchLegs();
    } catch (err) {
      toast.error("Failed to delete leg");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Relay Legs</h3>
        <button
          onClick={() => setEditingLeg({ seq: legs.length + 1, driver_id: "", truck_id: "", status: "pending" })}
          className="px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Leg
        </button>
      </div>

      {legs.map((leg) => (
        <div key={leg.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-bold">Leg {leg.seq}</p>
            <p className="text-sm text-slate-600">Driver: {leg.driver_id} | Truck: {leg.truck_id} | {leg.miles || 0} mi</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingLeg(leg)} className="p-2 hover:bg-slate-100 rounded">
              <Edit2 className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={() => deleteLeg(leg.id)} className="p-2 hover:bg-red-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}

      {editingLeg && (
        <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 space-y-3">
          <h4 className="font-bold">Edit Leg {editingLeg.seq}</h4>
          <input
            type="text"
            placeholder="Driver ID"
            value={editingLeg.driver_id}
            onChange={(e) => setEditingLeg({ ...editingLeg, driver_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <input
            type="text"
            placeholder="Truck ID"
            value={editingLeg.truck_id}
            onChange={(e) => setEditingLeg({ ...editingLeg, truck_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <input
            type="number"
            placeholder="Miles"
            value={editingLeg.miles || ""}
            onChange={(e) => setEditingLeg({ ...editingLeg, miles: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={saveLeg}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingLeg(null)}
              className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
