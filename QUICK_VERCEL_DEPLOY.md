# 🚀 Quick Vercel Deployment Guide

## ✅ What's Ready

Your backend is now converted to Vercel serverless functions! All API routes are in the `/api` folder.

## 📋 Pre-Deployment Checklist

1. ✅ API routes created in `/api` folder
2. ✅ `vercel.json` configured
3. ✅ Frontend uses relative API paths
4. ⚠️ Need to install `@vercel/node` package
5. ⚠️ Need PostgreSQL database
6. ⚠️ Socket.io needs separate deployment (see `SOCKET_IO_ALTERNATIVE.md`)

## 🎯 Step-by-Step Deployment

### Step 1: Install Dependencies

```bash
npm install @vercel/node
```

### Step 2: Set Up Database

**Option A: Vercel Postgres (Easiest)**
1. Vercel Dashboard → **Storage** → **Create Database** → **Postgres**
2. Copy connection string

**Option B: Supabase (Free)**
1. [supabase.com](https://supabase.com) → Create project
2. Settings → Database → Copy connection string

**Option C: Neon (Free)**
1. [neon.tech](https://neon.tech) → Create project
2. Copy connection string

### Step 3: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add Vercel serverless API functions"
git push
```

### Step 5: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. **Add New Project** → Import your GitHub repo
3. **Settings:**
   - **Root Directory:** (leave empty)
   - **Framework Preset:** Vite
   - **Build Command:** `npm install && cd client && npm install && npm run build:skip-check`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install && cd client && npm install`

4. **Environment Variables:**
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your-random-secret-key-min-32-chars
   CORS_ORIGIN=https://your-site.vercel.app
   MIN_WITHDRAW=100
   RAZORPAY_KEY_ID=your_key (optional)
   RAZORPAY_KEY_SECRET=your_secret (optional)
   ```

5. **Deploy!**

### Step 6: Deploy Socket.io (Optional but Recommended)

See `SOCKET_IO_ALTERNATIVE.md` for Socket.io deployment options.

## 🎉 After Deployment

Your site will be live at: `https://your-project.vercel.app`

- ✅ Frontend: Working
- ✅ REST API: Working at `/api/*`
- ⚠️ Socket.io: Needs separate deployment

## 🐛 Troubleshooting

### API Routes Return 404
- Check files are in `/api` folder (not `/client/api`)
- Verify `@vercel/node` is installed
- Check `vercel.json` configuration

### Database Errors
- Verify `DATABASE_URL` is correct
- Run `npx prisma generate` and `npx prisma migrate deploy`
- Check database is accessible

### Build Fails
- Make sure both root and client dependencies are installed
- Check build command includes both `npm install` steps

## 📚 More Info

- Full setup guide: `VERCEL_FULL_STACK_SETUP.md`
- Socket.io alternatives: `SOCKET_IO_ALTERNATIVE.md`

