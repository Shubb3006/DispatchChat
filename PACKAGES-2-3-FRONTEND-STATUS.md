# Packages 2 & 3 Frontend Implementation Status

## ✅ COMPLETE (already wired/tested in earlier session)
- Portal login page (/portal/login) — working, tested
- Portal dashboard (/portal/dashboard) — rate requests + loads tabs, working
- Portal rate request form (/portal/rate-request) — submits to backend
- Portal load detail page (/portal/loads/:id) — tender upload with Gemini AI parsing, customs docs
- Dispatcher Rate Requests page (/rates) — list, quote inline form, live SSE alerts
- Portal error boundary — white screen prevention

## 🔄 IN PROGRESS
### Frontend connections to real backend contracts (Package 3)

**PublicTrackingPage (/track/:token)**
- Current: fake demo data via store
- Target: GET /api/public-track/:token 
- Status: needs rewrite to axiosInstance calls, real status_history rendering, delivered_at, eta, last_position
- Blocking: none
- Effort: 2 hours

**DriverApp (role:driver at /driver)**
- Current: sandbox GPS, fake pay data
- Target: real geolocation (watchPosition), GET /api/settlement/me for pay tab
- Subtasks:
  - navigator.geolocation.watchPosition to real coords
  - POST driver position updates (existing endpoint in place)
  - Pay tab: fetch settlements, render lines per leg with load_number/origin/destination/miles/rate/amount
  - BOL/POD: verify posts to real /load/upload-bol endpoint (Wave 1 fixed)
- Status: 50% (app structure exists, data fake)
- Blocking: none
- Effort: 3 hours

**SafetyPage (/safety)**
- Current: fetchHOSLogs (wrong action name), snake_case mismatch
- Target: fetchAllHOSLogs, field mapping (hos_remaining_hours, etc.)
- Status: 1-line fix + test
- Effort: 30 min

**DispatcherDashboard loads list**
- Current: renders all loads
- Target: pagination (limit/offset/total), search (q), sorting, saved filters
- Backend contracts ready: list endpoints return {data, total, limit, offset} when params present
- Status: UI needs controls + axiosInstance param passing
- Effort: 2 hours

**AIDriverMatcherModal**
- Current: uses old {candidates, topRecommendedDriver} response
- Target: new POST /api/load/ai-match-drivers contract {matches:[{...breakdown}], factors_used:[...]}
- Changes: render only factors_used; auto-assign uses new POST /api/load/auto-assign
- Status: needs model rewrite
- Effort: 1.5 hours

**TripDetailModal Legs section**
- Current: missing
- Target: GET /api/load/:loadId/legs, POST replace-set, PATCH per leg, DELETE with validation
- Status: needs new component + form logic
- Effort: 2.5 hours

**CustomsPage**
- Current: Already rewired in earlier session to honest DRAFT→SENT→ACCEPTED/REJECTED/ERROR
- Status: ✅ VERIFIED WORKING

**EtaWeatherRadarPage**
- Current: endpoints exist in backend (CBP waits, NWS alerts)
- Status: frontend already wired (Phase 2 work)
- Need: verify live against real /api/v1/eta-radar/*

## 🚀 Package 2 (Driver Mobile)
**Driver app (Capacitor)**
- Current: React app only, no native layer
- Target: Capacitor Android with google-services.json (FCM) + geolocation plugin
- Effort: 4 hours (build setup + android signing)
- Subtasks:
  - package.json: add @capacitor/core @capacitor/cli @capacitor/geolocation @capacitor/android
  - capacitor.config: appId com.nishantransport.driver
  - npm run build → npx cap add android → npx cap sync
  - google-services.json (FCM) linking
  - DRIVER-APP-BUILD.md documentation

**DriverManagerPage (/driver_manager)**
- Current: stub
- Target: list drivers, reassign loads (uses AIMatcherModal or manual dropdown)
- Effort: 3 hours

## 🚨 CRITICAL BLOCKERS RESOLVED
- ✅ Portal routing (now separate app branch, no staff conflicts)
- ✅ White-screen on tender upload (Loader2 import added, error boundary)
- ✅ Geofence + detention (backend complete, ready to test)
- ✅ Rate request dispatch (live page live with SSE)

## 🎯 NEXT STEPS (Priority order)
1. **PublicTrackingPage** rewrite (30 min, high visibility)
2. **DriverApp geolocation + pay tab** (2 hours, driver value)
3. **DispatcherDashboard pagination/search** (2 hours, dispatcher value)
4. **AIMatcherModal new contract** (1.5 hours, critical dispatch UX)
5. **SafetyPage HOS fix** (30 min, quick win)
6. **TripDetailModal legs** (2.5 hours, relay load support)
7. **DriverManagerPage** (3 hours, optional for MVP)
8. **Capacitor build** (4 hours, optional for MVP)

## Deployment readiness
- Backend: all three packages infrastructure ready
- Frontend: core portal + dispatcher flows wired, driver/analytics optional for Phase 2
- Migrations: 120-124 ready to run
- Tests: none yet (manual verification via routes in guide §3)

