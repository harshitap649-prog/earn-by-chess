# Fix Blank Screen After Login - Solution

## 🔴 Problem

Your frontend is deployed on Vercel, but:
- ❌ **Backend is NOT deployed** (only frontend is live)
- ❌ **API calls are failing** (no backend to connect to)
- ❌ **Environment variables not set** in Vercel
- ❌ **Blank screen** because API calls return errors

---

## ✅ Solution: Deploy Backend

You have **2 options**:

### Option 1: Deploy Backend on Separate Platform (Recommended)

#### Step 1: Deploy Backend on Render (Free, No Credit Card)

1. **Sign up at [render.com](https://render.com)** (free)
2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Name: `earn-by-chess-db`
   - Free tier
   - Copy **"Internal Database URL"**

3. **Deploy Backend:**
   - New → Web Service
   - Connect GitHub → Select `earn-by-chess`
   - Settings:
     - **Name:** `earn-by-chess-backend`
     - **Root Directory:** `/` (root)
     - **Build Command:** `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
     - **Start Command:** `npm start`
   
   - **Environment Variables:**
     ```
     DATABASE_URL = <Internal Database URL from PostgreSQL>
     PORT = 3000
     CORS_ORIGIN = https://earn-by-chess.vercel.app
     JWT_SECRET = your-random-secret-key
     MIN_WITHDRAW = 100
     RAZORPAY_KEY_ID = your-key
     RAZORPAY_KEY_SECRET = your-secret
     ```

4. **Wait for deployment** (5-10 minutes)
5. **Copy backend URL** (e.g., `https://earn-by-chess-backend.onrender.com`)

#### Step 2: Update Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your project
2. **Settings** → **Environment Variables**
3. **Add/Update:**
   ```
   VITE_API_URL = https://earn-by-chess-backend.onrender.com
   VITE_SOCKET_URL = https://earn-by-chess-backend.onrender.com
   ```
4. **Redeploy** (automatic or manual)

#### Step 3: Update Backend CORS

1. Go to **Render Backend** → **Environment**
2. Update `CORS_ORIGIN` to your Vercel frontend URL:
   ```
   CORS_ORIGIN = https://earn-by-chess.vercel.app
   ```
3. **Redeploy** backend

---

### Option 2: Use Vercel Serverless Functions (Advanced)

Convert your Express backend to Vercel serverless functions.

**This is more complex** - Option 1 is easier!

---

## 🔍 Quick Check: What's Happening Now?

1. **Open browser console** (F12)
2. **Check for errors:**
   - Look for failed API calls
   - Check network tab for 404/500 errors
   - See what URL it's trying to call

3. **Current behavior:**
   - Frontend tries to call `/api/wallet` or `/api/auth/me`
   - Gets 404 (not found) because no backend
   - Dashboard shows blank screen

---

## ✅ After Backend is Deployed

1. ✅ API calls will work
2. ✅ Dashboard will load
3. ✅ All features will work
4. ✅ No more blank screen!

---

## 🚀 Quick Start: Render Backend (5 minutes)

1. **Render.com** → Sign up
2. **PostgreSQL** → Create database
3. **Web Service** → Deploy backend
4. **Set environment variables**
5. **Copy backend URL**
6. **Update Vercel** with backend URL
7. **Done!**

---

## 📝 Environment Variables Checklist

### Vercel (Frontend):
```
VITE_API_URL = https://your-backend.onrender.com
VITE_SOCKET_URL = https://your-backend.onrender.com
```

### Render (Backend):
```
DATABASE_URL = postgresql://...
PORT = 3000
CORS_ORIGIN = https://earn-by-chess.vercel.app
JWT_SECRET = your-secret
MIN_WITHDRAW = 100
```

---

**The blank screen is because there's no backend! Deploy the backend and it will work!** 🎯

