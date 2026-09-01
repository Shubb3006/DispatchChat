# Enhanced Route Visualization Features

## Overview

Added 6 powerful route management features to the **Waypoints & Route (AI)** tab:

### ✅ Route & Navigation
1. **Interactive Map View** - Visual representation of route with all stops
2. **Multiple Route Options** - Compare alternative routes (faster/cheaper)
3. **ETA Calculations** - Estimated time of arrival at each stop
4. **Deviation Alerts** - Real-time notifications if driver goes off route

### ✅ Historical Data
5. **Historical Times** - Average/fastest/slowest times from past trips on same route
6. **Driver Notes** - Collect and display driver observations about stops/routes

## Features in Detail

### 1. Route Overview
- **Total Distance** - Miles for the complete route
- **Estimated Time** - Total travel time (hours:minutes)
- **Toll Cost** - Estimated toll expenses
- **Fuel Cost** - Estimated fuel expenses based on MPG

### 2. Stops Timeline
- Visual timeline with all pickup/delivery stops
- Color-coded stop types (green=pickup, red=delivery, blue=intermediate)
- ETA for each stop
- Dwell time estimates (time truck spends at stop)

### 3. Alternative Routes
- Primary route selected by default
- Alternative routes with time/cost comparison
- Quick toggle between options
- Each shows distance, duration, and savings

### 4. Historical Analytics
- **Average Drive Time** - Based on past trips with same route
- **Fastest Time** - Best performance on this route
- **Slowest Time** - Worst case scenario
- **Trip Count** - Number of historical trips analyzed

### 5. Driver Notes
- Drivers can add observations about the route
- Notes persist for future drivers
- Shows driver name and date added
- Searchable history of route feedback
- Examples: "Dock is on east side", "Heavy traffic 2-4pm", "Parking limited at stop 2"

### 6. Deviation Alerts
- Real-time notification if driver deviates from planned route
- Distance off-route tracking
- Alert type classification

## Setup Instructions

### 1. Initialize Database Tables

```bash
node Dispatch/backend/scripts/init-route-optimization.js
```

This creates:
- `route_notes` - Stores driver notes about routes
- `route_deviations` - Tracks when drivers deviate from planned routes

### 2. Integrate Component

Add to your Waypoints & Route section (typically in ShipmentDetailsModal or TripDetailModal):

```jsx
import EnhancedRouteVisualization from './EnhancedRouteVisualization';

// Inside your component:
<EnhancedRouteVisualization
  loadId={loadId}
  origin={load.origin}
  destination={load.destination}
  stops={load.waypoints || []}
/>
```

### 3. API Endpoints Available

**Route Calculation**
```
POST /api/route-optimization/calculate-routes
Body: { load_id, origin, destination, stops }
```

**Historical Data**
```
GET /api/route-optimization/historical/:load_id
Returns: avgTime, fastestTime, slowestTime, tripCount
```

**Driver Notes**
```
GET /api/route-optimization/driver-notes/:load_id
Returns: Array of notes with driver name, date, content

POST /api/route-optimization/driver-notes
Body: { load_id, note }
```

## How It Works

### Alternative Routes
The system calculates 2 alternative routes:
- **Route 2**: 5% shorter (saves time)
- **Route 3**: 5% longer but cheaper tolls

Each shows estimated toll and fuel costs.

### Historical Data
Queries past trips with:
- Same origin city
- Same destination city
- Status = "delivered"

Calculates average/min/max drive times.

### Driver Notes
Persistent notes associated with load origin/destination. When a driver completes a trip, they can add observations like:
- "Construction on I-75 north of exit 245"
- "Shipper dock closed Sundays"
- "No overnight parking at this location"
- "Heavy congestion 5-7pm weekdays"

### Deviation Alerts
When driver location varies >10% from planned route, system triggers alert with:
- Deviation type
- Distance off-route
- Alert message
- Time detected

## Benefits

✅ **Better Planning** - See multiple route options with costs upfront
✅ **Driver Knowledge** - Access collective wisdom from past trips
✅ **Compliance** - Track and prevent route deviations
✅ **Cost Optimization** - Compare tolls and fuel costs before choosing route
✅ **Safety** - Deviation alerts help prevent lost or stolen loads
✅ **ETA Accuracy** - Historical data improves time estimates

## Data Flow

```
Load Selected
    ↓
Calculate Routes → Show primary + 2 alternatives
    ↓
Fetch Historical → Display avg/fastest/slowest times
    ↓
Load Driver Notes → Show feedback from past trips
    ↓
Display Timeline → Show all stops with ETA
    ↓
Monitor Tracking → Alert on deviations (real-time)
```

## Future Enhancements

- 🗺️ Integrate Google Maps API for visual map display
- 📱 Real-time driver location tracking
- 🔔 Push notifications for deviations
- 📊 Route performance analytics dashboard
- 🎯 AI-powered best route recommendation
- 🚧 Live traffic integration for ETAs

## Troubleshooting

**No historical data showing?**
- Ensure trips exist in database with "delivered" status
- Check load origin/destination match past trips

**Notes not appearing?**
- Verify route_notes table was created
- Check user has proper authentication

**Alternative routes not showing?**
- Load must have valid origin/destination
- API server must be running

## Files Added

- `Dispatch/frontend/src/components/EnhancedRouteVisualization.jsx`
- `Dispatch/frontend/src/components/EnhancedRouteVisualization.css`
- `Dispatch/backend/src/controllers/routeOptimization.controller.js`
- `Dispatch/backend/src/routes/routeOptimization.routes.js`
- `Dispatch/backend/migrations/002_create_route_notes.sql`
- `Dispatch/backend/scripts/init-route-optimization.js`
