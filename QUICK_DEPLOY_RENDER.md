# 🚀 Quick Deploy to Render (5 Minutes)

Since Railway trial expired, Render is the best FREE alternative!

---

## ✅ Pre-Deployment Checklist

1. **Prisma schema updated** ✅ (Changed to PostgreSQL)
2. **Code pushed to GitHub** ✅ (Already done)
3. **Render account** (Sign up at [render.com](https://render.com))

---

## 🎯 Quick Steps

### 1. Sign Up Render (1 min)
- Go to [render.com](https://render.com)
- Click "Get Started for Free"
- Sign up with GitHub

### 2. Create Database (2 min)
- Click "New +" → "PostgreSQL"
- Name: `earn-by-chess-db`
- Plan: Free
- Click "Create"
- **Copy "Internal Database URL"** ⚠️

### 3. Deploy Backend (2 min)
- Click "New +" → "Web Service"
- Connect GitHub → Select `earn-by-chess`
- Settings:
  - **Name:** `earn-by-chess-backend`
  - **Build:** `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
  - **Start:** `npm start`
- **Environment Variables:**
  ```
  DATABASE_URL = <paste Internal Database URL>
  PORT = 3000
  CORS_ORIGIN = https://earn-by-chess-frontend.onrender.com
  JWT_SECRET = your-random-secret-key-here
  MIN_WITHDRAW = 100
  ```
- Click "Create Web Service"
- **Wait 5-10 min** → Copy backend URL

### 4. Deploy Frontend (2 min)
- Click "New +" → "Static Site"
- Connect GitHub → Select `earn-by-chess`
- Settings:
  - **Name:** `earn-by-chess-frontend`
  - **Root Directory:** `client`
  - **Build:** `npm install && npm run build`
  - **Publish:** `dist`
- **Environment Variables:**
  ```
  VITE_API_URL = <your-backend-url>
  VITE_SOCKET_URL = <your-backend-url>
  ```
- Click "Create Static Site"
- **Wait 3-5 min** → Copy frontend URL

### 5. Update CORS (1 min)
- Go to Backend → Environment
- Update `CORS_ORIGIN` = your frontend URL
- Save (auto-redeploys)

### 6. Run Migrations (1 min)
- Go to Backend → Shell
- Run: `npx prisma migrate deploy`

---

## 🎉 Done!

Your site is live at: `https://earn-by-chess-frontend.onrender.com`

---

## 📝 Important Notes

- **Free tier spins down** after 15 min inactivity (wakes up automatically)
- **First request** after spin-down takes ~30 seconds
- **No credit card** required for free tier
- **Automatic HTTPS** included
- **Auto-deploys** on git push

---

## 🔧 Troubleshooting

**Backend won't start?**
- Check build logs
- Verify DATABASE_URL is correct

**Frontend can't connect?**
- Check VITE_API_URL matches backend URL
- Verify CORS_ORIGIN in backend

**Database error?**
- Run migrations: `npx prisma migrate deploy`
- Check DATABASE_URL uses "Internal Database URL"

---

## 💰 Cost

**FREE** - No credit card needed!

Upgrade to Starter ($7/month) if you want always-on (no spin-down).

---

See `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions!

