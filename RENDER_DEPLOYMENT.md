# Dispatch Backend - Render Deployment Guide

**Status**: Ready for deployment ✅  
**Repository**: https://github.com/Shubb3006/DispatchChat  
**Backend Location**: Dispatch/backend  
**Latest Commit**: dd6b74f  

---

## 🚀 QUICK START (5 Minutes)

### Step 1: Create PostgreSQL Database

**Option A: Supabase (Recommended - Easiest)**
```
1. Go to https://supabase.com
2. Click "Start your project" → Sign up/Login
3. Create new project:
   - Name: dispatch-db
   - Region: Choose closest to your users
   - Password: Generate secure password
4. Wait for project creation (2-3 minutes)
5. Go to Project Settings → Database
6. Copy the "Connection string" (URI format)
7. Save it - you'll need it for Render
```

**Option B: Self-Hosted PostgreSQL**
```bash
# If you have PostgreSQL installed locally
createdb dispatch_db

# Get connection string (format):
postgresql://username:password@localhost:5432/dispatch_db
```

### Step 2: Deploy Backend to Render

**1. Go to Render Dashboard**
```
https://render.com/dashboard
```

**2. Create New Web Service**
- Click "New +" → "Web Service"
- Select "Deploy an existing repository"
- Authorize GitHub (if not already done)

**3. Select GitHub Repository**
- Search for: `DispatchChat`
- Select: `Shubb3006/DispatchChat`
- Click "Connect"

**4. Configure Deployment**

```
Service Name:           dispatch-api
Root Directory:         Dispatch/backend
Environment:            Node
Build Command:          npm install
Start Command:          npm start
Plan:                   Free (for testing) or Standard ($12/mo for 24/7)
```

**5. Add Environment Variables**

Click "Add Environment Variable" for each:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Strong random key (32+ chars) | `your-super-secret-key-change-this` |
| `SAMSARA_API_TOKEN` | Your Samsara token (optional) | `samsara_api_xxxxx` |
| `GEOFENCE_ENABLED` | Enable geofence worker | `true` |
| `GEOFENCE_POLL_CRON` | Poll schedule | `*/3 * * * *` |
| `GEOFENCE_RADIUS_M` | Geofence radius | `500` |
| `PORT` | Server port | `5555` |
| `NODE_ENV` | Environment | `production` |

**Example Connection String** (Supabase):
```
postgresql://postgres:XXXXXX@db.XXXXX.supabase.co:5432/postgres
```

**6. Deploy**
- Click "Create Web Service"
- Watch the deployment logs
- Wait 2-5 minutes for completion
- You'll see: "Your service is live" ✅

---

## 📋 Full Deployment Checklist

- [ ] **Database Created**
  - [ ] PostgreSQL database ready
  - [ ] Connection string copied
  - [ ] Test connection works

- [ ] **Render Account Ready**
  - [ ] Account created at render.com
  - [ ] GitHub connected
  - [ ] Permissions authorized

- [ ] **Web Service Created**
  - [ ] Service name: dispatch-api
  - [ ] Root directory: Dispatch/backend
  - [ ] Environment: Node
  - [ ] Build command: npm install
  - [ ] Start command: npm start

- [ ] **Environment Variables Set**
  - [ ] DATABASE_URL (PostgreSQL)
  - [ ] JWT_SECRET (strong random key)
  - [ ] SAMSARA_API_TOKEN (optional)
  - [ ] GEOFENCE_ENABLED = true
  - [ ] All others from .env.example

- [ ] **Deployment Complete**
  - [ ] Service status: "Live"
  - [ ] No errors in logs
  - [ ] Backend URL: https://dispatch-api-xxxx.onrender.com

---

## 🔗 After Backend Deployed

### 1. Get Your Backend URL

After deployment, you'll have a URL like:
```
https://dispatch-api-xxxxx.onrender.com
```

Copy this - you need it next.

### 2. Update Frontend Environment Variables

Go to **Vercel Dashboard** → dispatch-app → Settings → Environment Variables

Update these:
```
VITE_API_URL=https://dispatch-api-xxxxx.onrender.com/api
REACT_APP_API_URL=https://dispatch-api-xxxxx.onrender.com/api
```

Save and wait for Vercel to redeploy (auto-redeploy happens within 1 minute)

### 3. Test API Connectivity

```bash
# Test backend is running
curl https://dispatch-api-xxxxx.onrender.com/health

# Test from frontend (open DevTools)
# Go to https://dispatch-app-gamma-eight.vercel.app
# Open DevTools → Network tab
# Login and check requests go to dispatch-api-xxxxx.onrender.com
```

---

## 🐛 Troubleshooting

### Backend won't start: "DATABASE_URL not set"
- [ ] Verify DATABASE_URL is in Render environment variables
- [ ] Check connection string format is correct
- [ ] Ensure database is accessible from internet (Supabase allows this by default)

### Build fails: "npm install failed"
- [ ] Check all dependencies are in package.json
- [ ] Verify Node version matches (npm will auto-select)
- [ ] Check build logs in Render dashboard

### API calls return 403
- [ ] Frontend needs valid DATABASE_URL to connect
- [ ] Ensure CORS is configured (should be automatic)
- [ ] Check JWT_SECRET is set in both frontend and backend

### Geofence worker not running
- [ ] Verify GEOFENCE_ENABLED=true in Render env vars
- [ ] Check logs for "[GEOFENCE]" messages
- [ ] Ensure SAMSARA_API_TOKEN is set (or worker will idle)

### Database migrations fail
- [ ] Check PostgreSQL connection string
- [ ] Verify database is accessible
- [ ] Check logs for SQL errors
- [ ] Migrations auto-run on startup (check status)

---

## 📊 Render Dashboard Essentials

**After deployment:**

1. **Monitor Logs**
   - Click service → "Logs"
   - Watch for startup messages
   - Look for "[GEOFENCE] Starting worker" message

2. **Check Metrics**
   - CPU usage should be <5% idle
   - Memory should be <100MB at startup
   - Requests should show API calls from frontend

3. **Set Up Alerts** (Recommended)
   - Go to service settings
   - Enable notifications for deploy failures
   - Add to your email

---

## ⚡ Performance Notes

- **Free Plan**: Sleep after 15 min inactivity (acceptable for testing)
- **Standard Plan**: 24/7 uptime ($12/month recommended for production)
- **Database**: Supabase free tier allows 2 concurrent connections (enough for this app)
- **Cold Start**: First request after idle takes 3-5 seconds (normal)

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is 32+ characters random string
- [ ] DATABASE_URL uses encrypted connection (postgresql:// with SSL)
- [ ] SAMSARA_API_TOKEN not in .env file (env var only)
- [ ] Render env vars marked as private (they are by default)
- [ ] No hardcoded secrets in code ✅ (verified)
- [ ] CORS configured for frontend domain (auto)

---

## ✅ Success Indicators

**Backend is ready when:**
1. Render shows "Live" status ✅
2. Logs show "[GEOFENCE] Starting worker" ✅
3. GET /health returns 404 (endpoint doesn't exist - that's OK)
4. Frontend can make API calls (check DevTools Network)
5. Geofence worker polling every 3 minutes (check logs)

**You're done when:**
- Frontend loads at https://dispatch-app-gamma-eight.vercel.app ✅
- Backend serves at https://dispatch-api-xxxxx.onrender.com ✅
- API calls show in DevTools Network tab ✅
- No CORS errors in console ✅

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Troubleshooting**: Check Render service logs (most common issue)
- **GitHub Repo**: https://github.com/Shubb3006/DispatchChat

---

**Total Deployment Time: ~15 minutes**

After this, you'll have a fully deployed Dispatch app with:
- ✅ Frontend on Vercel (auto-deploys on code push)
- ✅ Backend on Render (auto-deploys on code push)
- ✅ Database on Supabase (auto-scales)
- ✅ Geofence worker polling every 3 minutes
- ✅ Detention billing system live
- ✅ Real-time relay leg management
