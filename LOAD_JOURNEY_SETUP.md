# Load Journey Audit Trail Feature Setup

## Overview
This feature tracks the complete journey of a load from pickup through all warehouse stops, driver handoffs, and final delivery. It includes special handling for Freight Force consolidation points with real-time alerts.

## What's New

### Backend Files
- `src/controllers/loadJourney.controller.js` - API endpoints for journey tracking
- `src/routes/loadJourney.routes.js` - Routes for journey management
- `migrations/001_create_load_journey.sql` - Database schema

### Frontend Files
- `src/components/LoadJourneyTimeline.jsx` - Visual timeline component
- `src/components/LoadJourneyTimeline.css` - Timeline styling
- `src/components/FreightForceAlert.jsx` - Freight Force alert notification
- `src/components/FreightForceAlert.css` - Alert styling
- `src/hooks/useLoadJourney.js` - React hook for journey operations

### Modified Files
- `src/server.js` - Added loadJourneyRoutes

## Setup Instructions

### 1. Create Database Table
Run the SQL migration in your database:

```bash
psql -U your_user -d your_database -f Dispatch/backend/migrations/001_create_load_journey.sql
```

Or manually run in your database client:
```sql
CREATE TABLE IF NOT EXISTS load_journey (
  id SERIAL PRIMARY KEY,
  load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  driver_id INTEGER REFERENCES drivers(id),
  status VARCHAR(50) NOT NULL DEFAULT 'in_transit',
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('pickup', 'in_transit', 'at_warehouse', 'at_freight_force', 'in_delivery', 'delivered', 'delayed'))
);

CREATE INDEX idx_load_journey_load_id ON load_journey(load_id);
CREATE INDEX idx_load_journey_status ON load_journey(status);
CREATE INDEX idx_load_journey_timestamp ON load_journey(timestamp DESC);
```

### 2. Backend is Ready
The backend API endpoints are now available:
- `POST /api/load-journey/record` - Record a load movement
- `GET /api/load-journey/:load_id` - Get journey for a load
- `GET /api/load-journey/freight-force/all` - Get all loads at freight force
- `PUT /api/load-journey/status/update` - Update load status

### 3. Integrate Components into Load Detail Modal

Add to your TripDetailModal.jsx or ShipmentDetailsModal.jsx:

```jsx
import LoadJourneyTimeline from './LoadJourneyTimeline';

// Inside your modal component:
<LoadJourneyTimeline loadId={loadId} />
```

### 4. Add Freight Force Alert to Layout

Add to your main layout (e.g., Dispatch.jsx):

```jsx
import FreightForceAlert from './FreightForceAlert';

// At the top level of your app:
<FreightForceAlert />
```

## Status Types

- **pickup** - Load picked up from origin
- **in_transit** - Load in transit
- **at_warehouse** - Load at warehouse
- **at_freight_force** - Load at Freight Force consolidation point (RED ALERT)
- **in_delivery** - Load in delivery
- **delivered** - Load delivered
- **delayed** - Load delayed

## Usage Example

### Recording a Load Movement
```javascript
import { useLoadJourney } from './hooks/useLoadJourney';

function MyComponent() {
  const { recordMovement } = useLoadJourney();

  const handlePickup = async () => {
    await recordMovement(
      loadId,
      'Origin Address',
      'Warehouse 1',
      driverId,
      'pickup',
      'Picked up from customer'
    );
  };

  return <button onClick={handlePickup}>Record Pickup</button>;
}
```

### Marking as At Freight Force
```javascript
const { recordMovement } = useLoadJourney();

await recordMovement(
  loadId,
  'Warehouse 2',
  'Freight Force Hub',
  driverId,
  'at_freight_force',
  'Load consolidated for cross-dock'
);
```

## Features

✅ **Complete Journey Tracking** - See every stop a load makes
✅ **Driver Handoff Tracking** - Know which driver had the load at each stage
✅ **Multi-Stop Delivery** - Track multiple drops under same trip
✅ **Freight Force Integration** - Red-flag loads at consolidation points
✅ **Real-time Alerts** - Dashboard notification of loads at freight force
✅ **Visual Timeline** - Color-coded status indicators
✅ **Bulk Actions** - Recall or reassign loads from freight force

## To Revert

If you don't like this feature, simply:

```bash
git revert HEAD~N  # Where N is the number of commits to revert
```

Or restore individual files:
```bash
git checkout HEAD -- Dispatch/backend/src/controllers/loadJourney.controller.js
git checkout HEAD -- Dispatch/backend/src/routes/loadJourney.routes.js
git checkout HEAD -- Dispatch/frontend/src/components/LoadJourneyTimeline.jsx
git checkout HEAD -- Dispatch/frontend/src/components/FreightForceAlert.jsx
git checkout HEAD -- Dispatch/frontend/src/hooks/useLoadJourney.js
```
