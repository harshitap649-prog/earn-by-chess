# Complete Render Deployment Guide

Step-by-step guide to deploy your chess earning site on Render (FREE).

---

## Prerequisites

✅ Your code is on GitHub: `harshitap649-prog/earn-by-chess`  
✅ You have a Render account (sign up at [render.com](https://render.com) - free)

---

## Step 1: Sign Up / Login to Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest way)
4. Authorize Render to access your GitHub

---

## Step 2: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name:** `earn-by-chess-db`
   - **Database:** `earn_by_chess` (or leave default)
   - **User:** Leave default
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** Latest
   - **Plan:** Free (or Starter if you want better performance)
4. Click **"Create Database"**
5. **IMPORTANT:** Copy the **"Internal Database URL"** - you'll need this!

---

## Step 3: Update Prisma Schema for PostgreSQL

Before deploying, update your Prisma schema:

1. **Open `prisma/schema.prisma`**
2. **Change from SQLite to PostgreSQL:**

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

3. **Commit and push:**
```powershell
cd "C:\Users\Keshav\Desktop\earn by chess"
git add prisma/schema.prisma
git commit -m "Update Prisma schema for PostgreSQL"
git push
```

---

## Step 4: Deploy Backend

1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. **Connect GitHub:**
   - Click "Connect account" if not connected
   - Select repository: `earn-by-chess`
   - Click "Connect"

4. **Configure Service:**
   - **Name:** `earn-by-chess-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `/` (leave empty or put `/`)
   - **Runtime:** `Node`
   - **Build Command:** 
     ```
     npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```
     npm start
     ```

5. **Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   DATABASE_URL = <paste Internal Database URL from Step 2>
   PORT = 3000
   CORS_ORIGIN = https://earn-by-chess-frontend.onrender.com
   JWT_SECRET = <generate a random secret key>
   MIN_WITHDRAW = 100
   RAZORPAY_KEY_ID = <your razorpay key>
   RAZORPAY_KEY_SECRET = <your razorpay secret>
   ```

   **Note:** We'll update `CORS_ORIGIN` after frontend is deployed.

6. **Click "Create Web Service"**

7. **Wait for deployment** (takes 5-10 minutes)

8. **Copy your backend URL** (e.g., `https://earn-by-chess-backend.onrender.com`)

---

## Step 5: Deploy Frontend

1. In Render Dashboard, click **"New +"**
2. Select **"Static Site"**
3. **Connect GitHub:**
   - Select repository: `earn-by-chess`
   - Click "Connect"

4. **Configure:**
   - **Name:** `earn-by-chess-frontend`
   - **Branch:** `main`
   - **Root Directory:** `client`
   - **Build Command:**
     ```
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`

5. **Environment Variables:**
   Click "Environment" → "Add Environment Variable":
   
   ```
   VITE_API_URL = https://earn-by-chess-backend.onrender.com
   VITE_SOCKET_URL = https://earn-by-chess-backend.onrender.com
   ```
   
   **Replace with your actual backend URL from Step 4!**

6. **Click "Create Static Site"**

7. **Wait for deployment** (takes 3-5 minutes)

8. **Copy your frontend URL** (e.g., `https://earn-by-chess-frontend.onrender.com`)

---

## Step 6: Update Backend CORS

1. Go back to your **Backend service** in Render
2. Click **"Environment"**
3. **Update `CORS_ORIGIN`:**
   - Change to your frontend URL: `https://earn-by-chess-frontend.onrender.com`
4. **Save changes** - Render will automatically redeploy

---

## Step 7: Run Database Migrations

1. Go to your **Backend service** in Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```
4. This will create all tables in your PostgreSQL database

---

## Step 8: Test Your Deployment

1. **Visit your frontend URL:** `https://earn-by-chess-frontend.onrender.com`
2. **Test:**
   - ✅ Age verification appears
   - ✅ Can register/login
   - ✅ Dashboard loads
   - ✅ Can create matches
   - ✅ Chess game works

---

## Troubleshooting

### Backend won't start:
- Check build logs in Render dashboard
- Verify `DATABASE_URL` is correct
- Check that Prisma migrations ran

### Frontend can't connect to backend:
- Verify `VITE_API_URL` matches backend URL
- Check `CORS_ORIGIN` in backend matches frontend URL
- Check browser console for errors

### Database connection error:
- Verify `DATABASE_URL` uses "Internal Database URL"
- Check database is running in Render dashboard
- Ensure migrations ran successfully

### Socket.io not working:
- Verify `VITE_SOCKET_URL` is set correctly
- Check backend logs for Socket.io errors
- Ensure CORS allows your frontend domain

---

## Render Free Tier Limitations

⚠️ **Important to know:**
- Services **spin down after 15 minutes** of inactivity
- **First request** after spin-down takes ~30 seconds (wake-up time)
- Subsequent requests are fast
- **No credit card required** for free tier

**To keep services always on:** Upgrade to Starter plan ($7/month per service)

---

## Updating Your Code

After making changes:

1. **Commit and push to GitHub:**
   ```powershell
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Render automatically deploys** (takes 5-10 minutes)

3. **Check deployment status** in Render dashboard

---

## Cost Summary

**Free Tier:**
- ✅ PostgreSQL: Free
- ✅ Backend: Free (with spin-down)
- ✅ Frontend: Free
- **Total: $0/month**

**Starter Plan (if you want always-on):**
- Backend: $7/month
- Frontend: Free
- Database: Free
- **Total: $7/month**

---

## Success Checklist

- [ ] PostgreSQL created
- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Frontend can connect to backend
- [ ] Socket.io working
- [ ] Age verification appears
- [ ] User registration works
- [ ] Chess game functional

---

## Next Steps

1. ✅ Deploy on Render
2. ✅ Test all features
3. ✅ Share your live URL!
4. ✅ Monitor usage in Render dashboard

**Your site will be live at:** `https://earn-by-chess-frontend.onrender.com`

🎉 **Congratulations! Your site is now live!**

