# Quick Backend Deployment on Render (5 Minutes)

Deploy your backend so your frontend works!

---

## Step 1: Create Database (2 min)

1. Go to [render.com](https://render.com) → Sign up (free)
2. **New +** → **PostgreSQL**
3. **Name:** `earn-by-chess-db`
4. **Plan:** Free
5. **Create Database**
6. **Copy "Internal Database URL"** ⚠️ (you'll need this!)

---

## Step 2: Deploy Backend (3 min)

1. **New +** → **Web Service**
2. **Connect GitHub** → Select `earn-by-chess`
3. **Configure:**
   - **Name:** `earn-by-chess-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `/` (leave empty)
   - **Runtime:** `Node`
   - **Build Command:**
     ```
     npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```
     npm start
     ```

4. **Environment Variables:**
   Click "Advanced" → Add:
   ```
   DATABASE_URL = <paste Internal Database URL>
   PORT = 3000
   CORS_ORIGIN = https://earn-by-chess.vercel.app
   JWT_SECRET = generate-a-random-secret-key-here
   MIN_WITHDRAW = 100
   RAZORPAY_KEY_ID = your-key
   RAZORPAY_KEY_SECRET = your-secret
   ```

5. **Create Web Service**
6. **Wait 5-10 minutes** for deployment
7. **Copy your backend URL** (e.g., `https://earn-by-chess-backend.onrender.com`)

---

## Step 3: Update Vercel (1 min)

1. Go to **Vercel Dashboard** → Your project
2. **Settings** → **Environment Variables**
3. **Add:**
   ```
   VITE_API_URL = https://earn-by-chess-backend.onrender.com
   VITE_SOCKET_URL = https://earn-by-chess-backend.onrender.com
   ```
   (Replace with your actual Render backend URL!)

4. **Save**
5. **Redeploy** (or wait for auto-redeploy)

---

## Step 4: Update Backend CORS

1. Go to **Render Backend** → **Environment**
2. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN = https://earn-by-chess.vercel.app
   ```
3. **Save** (auto-redeploys)

---

## Step 5: Run Database Migrations

1. Go to **Render Backend** → **Shell** tab
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

---

## ✅ Done!

Now your site should work:
- ✅ Frontend on Vercel
- ✅ Backend on Render
- ✅ Database on Render
- ✅ API calls working
- ✅ No more blank screen!

---

## 🎯 Your URLs

- **Frontend:** `https://earn-by-chess.vercel.app`
- **Backend:** `https://earn-by-chess-backend.onrender.com`

---

**Deploy backend on Render and your site will work!** 🚀

