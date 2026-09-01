# Load Journey Feature - Quick Start

## ✅ Integration Complete!

The Load Journey Audit Trail feature has been fully integrated into your app.

## What's New

### 1. **Visual Timeline in Load Details**
   - When you open a load in Trip Details modal, you'll see a timeline showing every stop
   - Color-coded statuses: Green (transit), Yellow (warehouse), Red (Freight Force), Blue (delivered)
   - Shows driver, timestamp, and notes for each movement

### 2. **Freight Force Alert Notification**
   - Red alert badge appears in top-right when loads are at Freight Force
   - Click to see all loads awaiting consolidation
   - Quick actions: Recall or Reassign from modal

## Setup (One-Time)

**Step 1: Create the Database Table**

Run this command from the project root:

```bash
node Dispatch/backend/scripts/init-load-journey-db.js
```

This creates the `load_journey` table with all indexes.

**Step 2: Start the App**

```bash
# Backend
cd Dispatch/backend
npm start

# Frontend (new terminal)
cd Dispatch/frontend
npm start
```

**Step 3: Test It Out**

1. Open a load in Trip Details
2. Scroll down - you'll see "📍 Load Journey Timeline" section (empty for now)
3. Top-right corner - Freight Force Alert will show if any loads are there

## Recording Movements

To record when a load moves, use the `useLoadJourney` hook in any component:

```javascript
import { useLoadJourney } from '../hooks/useLoadJourney';

function MyComponent({ loadId, driverId }) {
  const { recordMovement } = useLoadJourney();

  const handleStartPickup = async () => {
    await recordMovement(
      loadId,
      'Customer Address',
      'Warehouse 1',
      driverId,
      'pickup',
      'Load picked up from shipper'
    );
  };

  return <button onClick={handleStartPickup}>Record Pickup</button>;
}
```

## Status Types Available

- `pickup` - Load picked up from origin
- `in_transit` - Load in transit between stops
- `at_warehouse` - Load at warehouse
- `at_freight_force` - 🚨 Load at Freight Force (RED ALERT)
- `in_delivery` - Load being delivered to final destination
- `delivered` - Load successfully delivered
- `delayed` - Load delayed

## Integration Points

**Already Integrated:**
- ✅ LoadJourneyTimeline in TripDetailModal
- ✅ FreightForceAlert in main App layout
- ✅ API routes in backend
- ✅ Database migrations

**Ready for Integration (if needed):**
- TripLegsSection.jsx - Add journey recording when legs are started/completed
- ShipmentDetailsModal.jsx - Add LoadJourneyTimeline here too
- Driver app - Record movements when driver starts/completes legs

## Example: Auto-Record When Leg Completes

In TripLegsSection.jsx, after a leg is marked complete:

```javascript
import { useLoadJourney } from '../hooks/useLoadJourney';

// Inside your leg completion handler:
const { recordMovement } = useLoadJourney();

await recordMovement(
  loadId,
  currentLeg.from_location,
  currentLeg.to_location,
  driverId,
  currentLeg.destination === 'Freight Force' ? 'at_freight_force' : 'in_transit',
  `Leg ${legNumber} completed`
);
```

## Revert If Needed

```bash
git revert 6dd617f  # Integration commit
git revert 87285df  # Feature creation commit
```

Or manually delete:
- `Dispatch/backend/src/controllers/loadJourney.controller.js`
- `Dispatch/backend/src/routes/loadJourney.routes.js`
- `Dispatch/frontend/src/components/LoadJourneyTimeline.jsx`
- `Dispatch/frontend/src/components/FreightForceAlert.jsx`
- `Dispatch/frontend/src/hooks/useLoadJourney.js`

## Support Files

- `LOAD_JOURNEY_SETUP.md` - Detailed technical documentation
- `Dispatch/backend/migrations/001_create_load_journey.sql` - SQL schema
- `Dispatch/backend/scripts/init-load-journey-db.js` - Database initialization

Enjoy! 🚀
