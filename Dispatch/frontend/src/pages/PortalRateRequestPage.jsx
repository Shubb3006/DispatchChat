import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalStore } from "@/stores/usePortalStore";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PortalRateRequestPage() {
  const navigate = useNavigate();
  const { createRateRequest, isSubmittingRate } = usePortalStore();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    skids: "",
    weight_lbs: "",
    length_in: "",
    width_in: "",
    height_in: "",
    commodity: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createRateRequest({
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      freight_details: {
        skids: form.skids ? Number(form.skids) : null,
        weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : null,
        dims: form.length_in || form.width_in || form.height_in
          ? {
              length_in: form.length_in ? Number(form.length_in) : null,
              width_in: form.width_in ? Number(form.width_in) : null,
              height_in: form.height_in ? Number(form.height_in) : null,
            }
          : null,
        commodity: form.commodity.trim() || null,
        notes: form.notes.trim() || null,
      },
    });
    if (success) {
      setTimeout(() => navigate("/portal/dashboard", { replace: true }), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-black text-slate-900">New Rate Request</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          {/* Route Section */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Pickup & Delivery</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="City, State, Country"
                  required
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Delivery Location *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="City, State, Country"
                  required
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Freight Section */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Freight Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Number of Skids
                </label>
                <input
                  type="number"
                  name="skids"
                  value={form.skids}
                  onChange={handleChange}
                  placeholder="e.g. 22"
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Total Weight (lbs)
                </label>
                <input
                  type="number"
                  name="weight_lbs"
                  value={form.weight_lbs}
                  onChange={handleChange}
                  placeholder="e.g. 41200"
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Commodity *
                </label>
                <input
                  type="text"
                  name="commodity"
                  value={form.commodity}
                  onChange={handleChange}
                  placeholder="e.g. Frozen Pork"
                  required
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Length (inches)
                </label>
                <input
                  type="number"
                  name="length_in"
                  value={form.length_in}
                  onChange={handleChange}
                  placeholder="e.g. 48"
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Width (inches)
                </label>
                <input
                  type="number"
                  name="width_in"
                  value={form.width_in}
                  onChange={handleChange}
                  placeholder="e.g. 48"
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Height (inches)
                </label>
                <input
                  type="number"
                  name="height_in"
                  value={form.height_in}
                  onChange={handleChange}
                  placeholder="e.g. 48"
                  disabled={isSubmittingRate}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Special Instructions
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any special handling, equipment needs, or notes for the dispatch team..."
              disabled={isSubmittingRate}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/portal/dashboard")}
              disabled={isSubmittingRate}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRate}
              className="flex-1 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmittingRate && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmittingRate ? "Submitting..." : "Submit Rate Request"}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-600 mt-4 text-center">
          Our dispatch team will review your request and send you a quote within 24 hours.
        </p>
      </div>
    </div>
  );
}
