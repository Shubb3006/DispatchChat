# DispatchChat

Trucking dispatch platform (Nishan Transport). This repo contains **two apps**:

| Folder | App | Deployed to |
|--------|-----|-------------|
| `Dispatch/frontend` | Dispatch web app (React + Vite) | Vercel — Root Directory: `Dispatch/frontend` |
| `Dispatch/backend` | Dispatch API (Node + Express + PostgreSQL) | Render — Root Directory: `Dispatch/backend` |
| `Chat/` | Chat app (frontend + backend) | — |

> ⚠️ **`Dispatch/` is the single source of truth for the Dispatch app.** All feature work goes into `Dispatch/frontend` and `Dispatch/backend`. (An old duplicate copy that used to live at the repo root was removed — it is preserved on the `backup/root-copy` branch if ever needed.)

## Run the Dispatch app locally

### 1. Backend — must run on port 5555

The frontend is hardwired (in `Dispatch/frontend/lib/apiBase.js`) to call
`http://localhost:5555` when it runs on localhost, so the backend **must**
use `PORT=5555` locally.

```bash
cd Dispatch/backend
npm install
```

Create `Dispatch/backend/.env`:

```
DATABASE_URL=postgresql://...   # use the SAME URL as Render (Render dashboard → Environment) to see live data
JWT_SECRET=...                  # use the same value as Render so logins work
PORT=5555
NODE_ENV=development
SAMSARA_API_TOKEN=...           # optional — fleet map / geofence worker
GEOFENCE_ENABLED=false          # keep off locally
```

Then:

```bash
npm run dev
```

> **Seeing only a couple of loads / empty pages locally?** That means
> `DATABASE_URL` is pointing at an empty local database. Point it at the same
> Supabase/Postgres URL production uses and you'll see the same data as the
> live site.

### 2. Frontend — no .env needed

```bash
cd Dispatch/frontend
npm install
npm run dev
```

Open http://localhost:5173. On localhost it automatically talks to
`http://localhost:5555`; on any deployed domain it talks to the production
Render backend (`https://ozack-dispatch-backend.onrender.com`).

## Deployments

- **Frontend:** Vercel auto-deploys `Dispatch/frontend` on every push to `main`.
- **Backend:** Render auto-deploys `Dispatch/backend` on every push to `main`.

Do **not** change the Vercel/Render Root Directory settings — they point at `Dispatch/`.
