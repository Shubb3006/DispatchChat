import React from "react";
import { Calendar, MapPin, Truck, Package, Weight } from "lucide-react";

export default function ModernLoadInfoSection({ shipment, onUpdateShipment, isEditing, editedShipment, setEditedShipment }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return String(dateStr).substring(0, 10);
  };

  const displayData = isEditing ? editedShipment : shipment;

  return (
    <div className="space-y-6">
      {/* MODERN HEADER WITH STATUS */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-8 py-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold">Load #{displayData.load_number || displayData.id}</h2>
              <p className="text-blue-100 text-sm mt-1">{displayData.loadType || "FTL"} Freight Linehaul</p>
            </div>
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm">
              {displayData.houseStatus || "Dispatched"}
            </span>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN SYMMETRIC LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        {/* SHIPPER COLUMN */}
        <div className="bg-white p-8 border-r border-slate-200 lg:border-r">
          <div className="mb-6 pb-6 border-b border-slate-200">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Pickup Location</p>
            <h3 className="text-lg font-bold text-slate-900">{displayData.shipper_name || "Shipper"}</h3>
          </div>

          <div className="space-y-5">
            {/* Address */}
            <div>
              <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedShipment.shipper_street_address || ""}
                  onChange={(e) => setEditedShipment({ ...editedShipment, shipper_street_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                />
              ) : (
                <p className="font-medium text-slate-900">{displayData.shipper_street_address || "N/A"}</p>
              )}
            </div>

            {/* City/State Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedShipment.shipper_city || ""}
                    onChange={(e) => setEditedShipment({ ...editedShipment, shipper_city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{displayData.shipper_city || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedShipment.shipper_state || ""}
                    onChange={(e) => setEditedShipment({ ...editedShipment, shipper_state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{displayData.shipper_state || "N/A"}</p>
                )}
              </div>
            </div>

            {/* Zipcode & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Zipcode</label>
                <p className="font-medium text-slate-900">{displayData.shipper_zipcode || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Phone</label>
                <p className="font-medium text-slate-900">{displayData.shipper_phone || "N/A"}</p>
              </div>
            </div>

            {/* Pickup Date */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <label className="text-xs uppercase font-semibold text-blue-700 block mb-2">
                <Calendar className="inline w-3 h-3 mr-1" /> Pickup Date
              </label>
              <input
                type="date"
                value={formatDate(displayData.pickup_date || displayData.pickupDate)}
                onChange={(e) => onUpdateShipment && onUpdateShipment(displayData.id, { pickup_date: e.target.value })}
                className="w-full bg-transparent font-bold text-blue-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CONSIGNEE COLUMN */}
        <div className="bg-white p-8">
          <div className="mb-6 pb-6 border-b border-slate-200">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Delivery Location</p>
            <h3 className="text-lg font-bold text-slate-900">{displayData.consignee_name || "Consignee"}</h3>
          </div>

          <div className="space-y-5">
            {/* Address */}
            <div>
              <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedShipment.consignee_street_address || ""}
                  onChange={(e) => setEditedShipment({ ...editedShipment, consignee_street_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                />
              ) : (
                <p className="font-medium text-slate-900">{displayData.consignee_street_address || "N/A"}</p>
              )}
            </div>

            {/* City/State Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedShipment.consignee_city || ""}
                    onChange={(e) => setEditedShipment({ ...editedShipment, consignee_city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{displayData.consignee_city || "N/A"}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedShipment.consignee_state || ""}
                    onChange={(e) => setEditedShipment({ ...editedShipment, consignee_state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{displayData.consignee_state || "N/A"}</p>
                )}
              </div>
            </div>

            {/* Zipcode & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Zipcode</label>
                <p className="font-medium text-slate-900">{displayData.consignee_zipcode || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-2">Phone</label>
                <p className="font-medium text-slate-900">{displayData.consignee_phone || "N/A"}</p>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <label className="text-xs uppercase font-semibold text-amber-700 block mb-2">
                <Calendar className="inline w-3 h-3 mr-1" /> Delivery Date
              </label>
              <input
                type="date"
                value={formatDate(displayData.delivery_date || displayData.deliveryDate)}
                onChange={(e) => onUpdateShipment && onUpdateShipment(displayData.id, { delivery_date: e.target.value })}
                className="w-full bg-transparent font-bold text-amber-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARGO SPECS FOOTER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500 mb-2"><Weight className="inline w-3 h-3 mr-1" /> Weight</p>
          <p className="text-2xl font-bold text-slate-900">{displayData.weight || "—"} <span className="text-sm font-normal">lbs</span></p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500 mb-2"><Package className="inline w-3 h-3 mr-1" /> Pallets</p>
          <p className="text-2xl font-bold text-slate-900">{displayData.pieces || "—"}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs uppercase font-bold text-green-700 mb-2">Rate</p>
          <p className="text-2xl font-bold text-green-900">${displayData.rate || "—"}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500 mb-2"><Truck className="inline w-3 h-3 mr-1" /> Cargo</p>
          <p className="text-lg font-bold text-slate-900">{displayData.commodity || "—"}</p>
        </div>
      </div>
    </div>
  );
}
