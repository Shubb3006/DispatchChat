import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapPin,
  Clock,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Route,
} from 'lucide-react';
import './EnhancedRouteVisualization.css';

const EnhancedRouteVisualization = ({ loadId, origin, destination, stops = [] }) => {
  const [routeData, setRouteData] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);
  const [driverNotes, setDriverNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [deviationAlert, setDeviationAlert] = useState(null);

  useEffect(() => {
    fetchRouteData();
    fetchHistoricalData();
    fetchDriverNotes();
  }, [loadId]);

  const fetchRouteData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/load-journey/calculate-routes', {
        load_id: loadId,
        origin,
        destination,
        stops,
      }, { withCredentials: true });

      setRouteData(response.data.primaryRoute);
      setAlternatives(response.data.alternatives || []);
    } catch (error) {
      console.error('Error fetching route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get(`/api/load-journey/historical/${loadId}`, {
        withCredentials: true
      });
      setHistoricalData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchDriverNotes = async () => {
    try {
      const response = await axios.get(`/api/load-journey/driver-notes/${loadId}`, {
        withCredentials: true
      });
      setDriverNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error fetching driver notes:', error);
    }
  };

  const addDriverNote = async () => {
    if (!newNote.trim()) return;

    try {
      await axios.post(`/api/load-journey/driver-notes`, {
        load_id: loadId,
        note: newNote,
      }, { withCredentials: true });

      setNewNote('');
      await fetchDriverNotes();
    } catch (error) {
      console.error('Error adding driver note:', error);
    }
  };

  const currentRoute = selectedRoute === 0 ? routeData : alternatives[selectedRoute - 1];

  if (loading && !routeData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600 mr-2" />
        Loading route details...
      </div>
    );
  }

  return (
    <div className="enhanced-route-container space-y-4">
      {/* Route Overview */}
      {currentRoute && (
        <div className="route-overview bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Route className="w-5 h-5 text-sky-600" />
              Route Details
            </h3>
            <span className="text-sm font-semibold text-sky-600">
              {currentRoute.distance} mi • {currentRoute.duration}
            </span>
          </div>

          {/* Route Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="stat-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">TOTAL DISTANCE</div>
              <div className="text-lg font-bold text-slate-900">{currentRoute.distance} mi</div>
            </div>
            <div className="stat-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">ESTIMATED TIME</div>
              <div className="text-lg font-bold text-slate-900">{currentRoute.duration}</div>
            </div>
            <div className="stat-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">TOLL COST</div>
              <div className="text-lg font-bold text-amber-600">${currentRoute.tollCost || '0'}</div>
            </div>
            <div className="stat-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">FUEL COST</div>
              <div className="text-lg font-bold text-emerald-600">${currentRoute.fuelCost || '0'}</div>
            </div>
          </div>

          {/* Stops Timeline */}
          <div className="stops-timeline">
            {currentRoute.stops && currentRoute.stops.map((stop, idx) => (
              <div key={idx} className="stop-item">
                <div className="stop-dot" style={{ backgroundColor: idx === 0 ? '#10b981' : idx === currentRoute.stops.length - 1 ? '#ef4444' : '#3b82f6' }} />
                <div className="stop-details">
                  <div className="font-bold text-slate-900">{stop.location}</div>
                  <div className="text-xs text-slate-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    ETA: {stop.eta}
                  </div>
                  {stop.dwellTime && (
                    <div className="text-xs text-amber-600 mt-1">
                      Dwell Time: {stop.dwellTime} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Routes */}
      {alternatives.length > 0 && (
        <div className="alternatives-section bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900 mb-3">Alternative Routes</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedRoute(0)}
              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                selectedRoute === 0
                  ? 'border-sky-600 bg-sky-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-slate-900">Primary Route</div>
              <div className="text-xs text-slate-600">{routeData?.distance} mi • {routeData?.duration}</div>
            </button>

            {alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRoute(idx + 1)}
                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                  selectedRoute === idx + 1
                    ? 'border-sky-600 bg-sky-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900">
                  Alternative {idx + 1}
                  {alt.time_saved && <span className="text-green-600 ml-2">(-{alt.time_saved} min)</span>}
                </div>
                <div className="text-xs text-slate-600">{alt.distance} mi • {alt.duration}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Historical Data */}
      {historicalData && (
        <div className="historical-section bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            Historical Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="history-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">AVG DRIVE TIME</div>
              <div className="text-lg font-bold text-slate-900">{historicalData.avgTime}</div>
              <div className="text-3xs text-slate-400">from {historicalData.tripCount} trips</div>
            </div>
            <div className="history-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">FASTEST TIME</div>
              <div className="text-lg font-bold text-emerald-600">{historicalData.fastestTime}</div>
            </div>
            <div className="history-card">
              <div className="text-2xs font-bold text-slate-500 mb-1">SLOWEST TIME</div>
              <div className="text-lg font-bold text-amber-600">{historicalData.slowestTime}</div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Notes */}
      <div className="driver-notes-section bg-white rounded-xl border border-slate-200 p-4">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            Driver Notes ({driverNotes.length})
          </h3>
          {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showNotes && (
          <>
            {/* Add Note */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this route/stops..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={addDriverNote}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700"
              >
                Save
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {driverNotes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
              ) : (
                driverNotes.map((note, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-1">
                      {note.driver_name} • {new Date(note.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-slate-900">{note.note}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Deviation Alert */}
      {deviationAlert && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-rose-900">Route Deviation Alert</div>
            <div className="text-sm text-rose-800 mt-1">{deviationAlert}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRouteVisualization;
