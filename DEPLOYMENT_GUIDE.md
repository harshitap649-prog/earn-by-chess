# Deployment Guide - Chess Earning Site

## Recommended: Railway (Full-Stack Deployment)

Railway is the easiest option for deploying your full-stack application with Socket.io support.

### Prerequisites
1. GitHub account
2. Railway account (sign up at [railway.app](https://railway.app))
3. Push your code to GitHub

---

## Step-by-Step Deployment on Railway

### Step 1: Prepare Your Code

1. **Update Prisma Schema for PostgreSQL** (if using SQLite):
   ```prisma
   // In prisma/schema.prisma, change:
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Create `.env.example` file** (for reference):
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   PORT=3000
   CORS_ORIGIN=https://your-frontend.railway.app
   JWT_SECRET=your-secret-key
   MIN_WITHDRAW=100
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

3. **Update CORS in server.ts** to allow your production domain

4. **Commit and push to GitHub**

### Step 2: Deploy Backend on Railway

1. **Go to Railway Dashboard** → Click "New Project"
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository**
4. **Railway will auto-detect Node.js**

5. **Add PostgreSQL Database**:
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway will provide `DATABASE_URL` automatically

6. **Set Environment Variables**:
   - Go to "Variables" tab
   - Add these variables:
     ```
     PORT=3000
     CORS_ORIGIN=https://your-frontend-url.railway.app
     JWT_SECRET=generate-a-random-secret-key-here
     MIN_WITHDRAW=100
     RAZORPAY_KEY_ID=your-razorpay-key-id
     RAZORPAY_KEY_SECRET=your-razorpay-secret
     ```
   - `DATABASE_URL` is automatically set by Railway

7. **Configure Build Settings**:
   - Root Directory: `/` (root of your repo)
   - Build Command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`

8. **Deploy**:
   - Railway will automatically deploy
   - Get your backend URL (e.g., `https://your-backend.railway.app`)

### Step 3: Deploy Frontend on Railway

1. **Create New Service** in the same Railway project
2. **Select "Deploy from GitHub repo"** (same repo)
3. **Configure**:
   - Root Directory: `/client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx vite preview --port $PORT --host 0.0.0.0`
   - Output Directory: `dist`

4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

5. **Update Frontend API URL**:
   - In your frontend code, make sure API calls use `import.meta.env.VITE_API_URL`

6. **Deploy** - Railway will give you a frontend URL

### Step 4: Update Environment Variables

1. **Backend CORS_ORIGIN**: Set to your frontend Railway URL
2. **Frontend VITE_API_URL**: Set to your backend Railway URL

### Step 5: Run Database Migrations

1. In Railway backend service, go to "Deployments"
2. Click on the latest deployment → "View Logs"
3. Or use Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```

---

## Alternative: Vercel (Frontend) + Railway (Backend)

### Deploy Frontend on Vercel

1. **Push code to GitHub**
2. **Go to [vercel.com](https://vercel.com)** → "New Project"
3. **Import your GitHub repository**
4. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

6. **Deploy** - Vercel gives you a URL like `your-app.vercel.app`

### Deploy Backend on Railway

Follow Step 2 from above, but set:
```
CORS_ORIGIN=https://your-app.vercel.app
```

---

## Alternative: Render (Full-Stack)

### Deploy on Render

1. **Go to [render.com](https://render.com)** → "New +" → "Web Service"
2. **Connect GitHub** and select your repo
3. **Backend Service**:
   - Name: `chess-earning-backend`
   - Environment: Node
   - Build Command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Add PostgreSQL database (free tier available)

4. **Frontend Service**:
   - Create another Web Service
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx vite preview --port $PORT --host 0.0.0.0`
   - Publish Directory: `dist`

5. **Set Environment Variables** for both services

---

## Important Notes

### Before Deploying:

1. **Change SQLite to PostgreSQL**:
   ```bash
   # Update prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   # Generate new client
   npx prisma generate
   
   # Create migration
   npx prisma migrate dev --name init
   ```

2. **Update API URLs**:
   - Replace `http://localhost:3000` with your production backend URL
   - Use environment variables for API URLs

3. **Security**:
   - Use strong `JWT_SECRET` in production
   - Never commit `.env` files
   - Enable HTTPS (Railway/Render do this automatically)

4. **Socket.io Configuration**:
   - Make sure CORS allows your frontend domain
   - Socket.io works automatically on Railway/Render

### Post-Deployment Checklist:

- [ ] Database migrations run successfully
- [ ] Backend API accessible
- [ ] Frontend can connect to backend
- [ ] Socket.io connections working
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic on Railway/Render)
- [ ] Test user registration/login
- [ ] Test payment flow (Razorpay)
- [ ] Test chess game functionality

---

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Check `DATABASE_URL` is set correctly
   - Ensure migrations have run

2. **CORS Errors**:
   - Verify `CORS_ORIGIN` matches your frontend URL exactly
   - Check backend logs for CORS errors

3. **Socket.io Not Connecting**:
   - Verify CORS allows your frontend domain
   - Check WebSocket support (Railway/Render support it)

4. **Build Fails**:
   - Check build logs in Railway/Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation succeeds

5. **Environment Variables Not Working**:
   - Restart the service after adding variables
   - Check variable names match exactly (case-sensitive)

---

## Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Railway** | $5 credit/month | $20/month | Full-stack, easy setup |
| **Render** | Free (with limits) | $7/month | Budget-friendly |
| **Vercel** | Free (frontend) | $20/month | Frontend hosting |
| **Fly.io** | Free tier | Pay-as-you-go | Real-time apps |

---

## Quick Start: Railway Deployment (5 minutes)

1. **Push code to GitHub**
2. **Sign up at [railway.app](https://railway.app)**
3. **New Project → Deploy from GitHub**
4. **Add PostgreSQL database**
5. **Set environment variables** (see Step 2 above)
6. **Deploy!**

Railway handles everything else automatically.

---

## Recommendation

**For your chess earning site, I recommend Railway** because:
- ✅ Easiest full-stack deployment
- ✅ Built-in PostgreSQL
- ✅ Excellent Socket.io support
- ✅ Simple GitHub integration
- ✅ Good free tier to start
- ✅ One platform for everything

---

## Environment Variables Setup

### For Frontend (Railway/Vercel):
```
VITE_API_URL=https://your-backend.railway.app
VITE_SOCKET_URL=https://your-backend.railway.app
```

### For Backend (Railway):
```
DATABASE_URL=postgresql://... (auto-set by Railway)
PORT=3000
CORS_ORIGIN=https://your-frontend.railway.app
JWT_SECRET=your-secret-key-here
MIN_WITHDRAW=100
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

**Note:** The code has been updated to use environment variables automatically. Just set `VITE_API_URL` and `VITE_SOCKET_URL` in your frontend deployment!

Start with Railway's free tier, then upgrade if needed!

