# Waitz Deployment Fix Guide

All deployment issues have been fixed! Here's what was changed:

## Problems Fixed

### 1. ❌ WebSocket Connection Failures
**Issue**: Frontend on Vercel was trying to connect Socket.io to `wss://waitz.vercel.app/socket.io/` (the frontend itself)  
**Fix**: Now connects to `https://waitz.onrender.com/socket.io/` (the actual backend)

### 2. ❌ API 404 Errors  
**Issue**: API calls like `POST /api/auth/student/signup` were going to `https://waitz.vercel.app/api/*` instead of backend  
**Fix**: All API calls now route through configured backend URL

### 3. ❌ Missing Audio File
**Issue**: `chime.mp3` not found, causing continuous errors  
**Fix**: Added graceful error handling; app works without audio, but you can add the file anytime

## Changes Made

### Frontend (.env files)
```
.env.local (Local Development)
├─ VITE_API_URL=http://localhost:5000
└─ VITE_SOCKET_URL=http://localhost:5000

.env.production (Vercel Deployment)
├─ VITE_API_URL=https://waitz.onrender.com
└─ VITE_SOCKET_URL=https://waitz.onrender.com
```

### Frontend (API Service)
- Created `frontend/src/services/api.js` - Axios instance with dynamic backend URL
- Updated all components to use centralized API service:
  - `Auth.jsx`
  - `StudentDashboard.jsx`
  - `AdminDashboard.jsx`
  - `TokenView.jsx`

### Frontend (Socket.io)
- Updated all Socket.io connections to use configured backend URL
- Added proper error handling for missingaudio files

### Backend
- Enhanced CORS configuration to explicitly allow:
  - `https://waitz.vercel.app` (frontend)
  - `https://waitz.onrender.com` (socket.io)
  - Local development URLs
- Added credentials support for cross-origin requests

### Audio Assets
- Created `frontend/public/` directory
- Added README with instructions to add `chime.mp3`
- App gracefully handles missing audio file

## Deployment Steps

### For Vercel (Frontend):
1. Push code to GitHub
2. In Vercel project settings, add environment variables:
   ```
   VITE_API_URL=https://waitz.onrender.com
   VITE_SOCKET_URL=https://waitz.onrender.com
   ```
3. Vercel auto-deploys on push

**Optional: Add Audio Notification**
1. Download a notification sound (MP3) from freesound.org
2. Add `chime.mp3` to `frontend/public/chime.mp3`
3. Commit and push

### For Render (Backend):
No changes needed! Your backend configuration is already correct.

## Verification Checklist

After deployment, verify in your Render backend URL (`https://waitz.onrender.com`):

- [ ] Socket.io connects successfully (no WebSocket errors)
- [ ] `POST /api/auth/student/signup` returns 200 (not 404)
- [ ] `GET /api/queues` returns queue data
- [ ] Student/Admin dashboards load data in real-time

## Troubleshooting

### WebSocket still failing?
1. Check Render backend is running: `https://waitz.onrender.com`
2. Verify Vercel env variables are set correctly
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### API calls still getting 404?
1. Verify `.env.production` vars in Vercel dashboard
2. Check that backend API endpoints exist
3. Verify both URLs are accessible from your browser

### Still missing audio?
- This is optional! App works without it
- When ready, add `chime.mp3` to `frontend/public/`

## Environment Variables Reference

### Frontend (Vercel)
```
VITE_API_URL=https://waitz.onrender.com
VITE_SOCKET_URL=https://waitz.onrender.com
```

### Backend (Render)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens  
- `PORT` - Server port (5000 default)

## File Structure
```
frontend/
├── .env.local              (local dev)
├── .env.production         (production - Vercel)
├── public/
│   ├── chime.mp3          (optional audio asset)
│   └── README.md          (instructions)
└── src/
    ├── services/
    │   └── api.js         (NEW - centralized API)
    └── components/
        ├── Auth.jsx       (UPDATED)
        ├── StudentDashboard.jsx (UPDATED)
        ├── AdminDashboard.jsx (UPDATED)
        └── TokenView.jsx  (UPDATED)
```

---

**Your app should now work perfectly on Vercel + Render!** 🚀
