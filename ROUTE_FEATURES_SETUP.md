# Route Visualization — Waypoints & Route (AI) tab

Five sections render in `EnhancedRouteVisualization.jsx`, all backed by real data.

## 1. Route Overview
Total distance, drive time, toll cost, fuel cost.

Distance comes from geocoding every stop (`geocoding.service.js` — local hub presets, then
OpenStreetMap/Nominatim) and summing haversine legs with a 1.18 road-network correction.
Drive time assumes 55 mph; fuel assumes 6.5 MPG at $3.85/gal; tolls at $0.06/mile.

## 2. Stops Timeline
Every stop in sequence with a color-coded dot (green pickup, blue intermediate, red delivery),
cumulative ETA (from the load's `pickup_date`, plus 45m dwell per stop), miles from origin,
and dwell time.

## 3. Route Options
Primary route plus a toll-free and a heavy-haul variant. Click to switch — the Route Overview
stats update to the selected option.

## 4. Historical Times On This Lane
Queries `loads` for previously delivered loads with the same origin and destination, and
computes average/fastest/slowest from `delivery_date - pickup_date`. Shows an empty state
when the lane has no delivered history — no placeholder numbers.

## 5. Driver Notes
Persisted in the `route_notes` table (auto-created on server start). Shows author and date;
notes stay attached to the load.

## API

```
POST /api/route-optimization/calculate-routes   { load_id, origin, destination, stops }
GET  /api/route-optimization/historical/:load_id
GET  /api/route-optimization/driver-notes/:load_id
POST /api/route-optimization/driver-notes       { load_id, note }
```

## Files

- `Dispatch/frontend/src/components/EnhancedRouteVisualization.jsx`
- `Dispatch/backend/src/controllers/routeOptimization.controller.js`
- `Dispatch/backend/src/routes/routeOptimization.routes.js`
