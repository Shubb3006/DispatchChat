# Nishan Driver — Android App Build Guide (Capacitor)

The Dispatch frontend doubles as the driver mobile app. Driver-role logins land
directly on the standalone Driver App screen (`/driver`) — see "How driver
logins work" below. This guide packages that experience as a native Android app
with Capacitor.

- **appId**: `com.nishantransport.driver`
- **appName**: `Nishan Driver`
- **webDir**: `dist` (Vite's default build output — see `vite.config.ts`)
- Config file: `capacitor.config.json` (same convention as `Chat/frontend`)

Installed packages (already in `package.json`):
`@capacitor/core`, `@capacitor/cli`, `@capacitor/geolocation`, `@capacitor/android`.

---

## 1. One-time project setup

```bash
cd "Dispatch/frontend"     # quote the path — the repo root contains spaces

# 1. Build the web bundle (webDir must exist before cap add)
npm run build

# 2. Generate the native Android project (creates android/)
npx cap add android

# 3. Copy the web bundle + plugin config into the native project
npx cap sync
```

Re-run `npm run build && npx cap sync` after every frontend change.
`npx cap open android` opens the project in Android Studio.

## 2. API base URL (required before a device build)

The shared axios instance (`lib/axios.js`) points at
`http://localhost:5555/api`. On a phone, `localhost` is the phone itself, so
point it at the reachable backend before building:

- LAN testing: your machine's LAN IP (e.g. `http://192.168.x.x:5555/api`), or
  `http://10.0.2.2:5555/api` for the Android emulator.
- Production: the deployed backend's HTTPS URL.

Auth uses a JWT cookie (`withCredentials: true`), so the backend's CORS config
must allow the app's origin with credentials, and production should serve over
HTTPS (`capacitor.config.json` uses `androidScheme: "https"`). If you must test
against plain HTTP, add `"server": { "cleartext": true }` to
`capacitor.config.json` (the Chat app uses this pattern) and remove it for
release builds.

## 3. Geolocation permissions

The Driver App uses the Capacitor Geolocation plugin on native builds
(`Capacitor.isNativePlatform()`), falling back to browser
`navigator.geolocation` on the web. After `npx cap add android`, add the
permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

The app requests runtime permission on first use and shows honest
denied/unavailable/error states in the GPS Telemetry tab.

## 4. Push notifications (FCM) — optional, proven pattern exists

The Chat app already runs FCM push end-to-end. Follow **`Chat/FCM-SETUP.md`**
as the proven pattern when adding push to this app:

1. Create (or reuse) a Firebase project; register an Android app with package
   name `com.nishantransport.driver`.
2. Download `google-services.json` into `android/app/`.
3. Add the `@capacitor/push-notifications` plugin and the Google services
   Gradle plugin exactly as documented in `Chat/FCM-SETUP.md`.
4. Backend side: the Chat backend's `lib/push.js` (firebase-admin, honest no-op
   when `FIREBASE_SERVICE_ACCOUNT_PATH`/`_JSON` is unset) plus its
   `POST/DELETE /api/auth/device-token` routes are the reference
   implementation to replicate for Dispatch if/when driver push is needed.

Until that is wired, the driver app simply has no push — nothing is faked.

## 5. Signing a release build

1. Generate a keystore (keep it out of git):
   ```bash
   keytool -genkey -v -keystore nishan-driver.keystore -alias nishan-driver \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Reference it in `android/app/build.gradle` (`signingConfigs.release`) or via
   `android/keystore.properties` (Android Studio → Build → Generate Signed
   Bundle/APK also works).
3. Build:
   ```bash
   cd android
   ./gradlew assembleRelease   # APK
   ./gradlew bundleRelease     # AAB for Play Store
   ```

## 6. How driver logins land on `/driver`

- On login, the backend returns `{ user: { role, allowed_modules, driver } }`.
  `Login.jsx` navigates `role === "driver"` users straight to `/driver`.
- `App.jsx` renders a dedicated route set for driver-role sessions:
  `/driver` → `DriverPage`, and every other path redirects to `/driver` — so a
  driver can never reach (or loop through) the office console.
- The Driver App screen (`DriverApp.jsx`) then:
  - watches real GPS (Capacitor Geolocation on device) and reports coordinates
    to the driver-coords endpoint (`PUT /api/drivers/:id`,
    `current_lat`/`current_lng`) about every 30 s while GPS is on,
  - loads the driver's own HOS log (`/api/hos-logs/me`),
  - uploads BOL / skid / POD documents to the real endpoints
    (`POST /api/load/upload-bol`, `POST /api/upload/:load_number`),
  - shows pay via `GET /api/settlement/me`.

## 7. Checklist

- [ ] `npm run build` (zero errors)
- [ ] `npx cap add android` (first time only)
- [ ] `npx cap sync`
- [ ] API base URL points at a reachable backend
- [ ] Location permissions in `AndroidManifest.xml`
- [ ] (optional) `google-services.json` per `Chat/FCM-SETUP.md`
- [ ] Signed release build
