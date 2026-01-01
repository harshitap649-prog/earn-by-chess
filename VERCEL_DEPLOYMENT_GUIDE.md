# Complete Vercel Deployment Guide

Step-by-step guide to deploy your chess earning site on Vercel (FREE, no credit card).

---

## Why Vercel?

- ✅ **No credit card required**
- ✅ **Always accessible** (global CDN)
- ✅ **Fastest deployments** (2-3 minutes)
- ✅ **Best for React/Vite apps**
- ✅ **Automatic HTTPS**
- ✅ **Free tier is generous**

---

## Prerequisites

✅ Code on GitHub: `harshitap649-prog/earn-by-chess`  
✅ Vercel account (free, sign up with GitHub)

---

## Step 1: Sign Up / Login

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

---

## Step 2: Deploy Frontend

1. **Click "Add New Project"** (or "New Project")

2. **Import Repository:**
   - You'll see your GitHub repos
   - Find and click **`earn-by-chess`**
   - Click **"Import"**

3. **Configure Project:**
   - **Project Name:** `earn-by-chess` (or your choice)
   - **Root Directory:** Click "Edit" → Set to `client`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `dist` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)

4. **Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL = https://your-backend-url.vercel.app
   VITE_SOCKET_URL = https://your-backend-url.vercel.app
   ```
   
   **Note:** We'll update these after backend is deployed.

5. **Click "Deploy"**

6. **Wait 2-3 minutes** - Vercel builds and deploys!

7. **Copy your frontend URL** (e.g., `https://earn-by-chess.vercel.app`)

---

## Step 3: Deploy Backend

You have two options:

### Option A: Vercel Serverless Functions (Recommended)

Convert your Express backend to Vercel serverless functions.

1. **Create `api/` folder in root:**
   ```
   api/
     index.ts (main API handler)
   ```

2. **Install Vercel adapter:**
   ```bash
   npm install @vercel/node
   ```

3. **Create `api/index.ts`:**
   ```typescript
   import { VercelRequest, VercelResponse } from '@vercel/node';
   import express from 'express';
   import { createServer } from 'http';
   import { Server } from 'socket.io';
   // Import your existing server setup
   
   const app = express();
   // ... your existing Express setup ...
   
   export default async (req: VercelRequest, res: VercelResponse) => {
     // Handle requests
   };
   ```

**OR use simpler approach:**

### Option B: Separate Backend Service

Deploy backend separately on another platform:

1. **Use Supabase** (free):
   - Sign up at [supabase.com](https://supabase.com)
   - Create project
   - Use Supabase Edge Functions for API
   - Use Supabase PostgreSQL for database

2. **Or use Railway** (if you add card later):
   - Deploy backend only
   - Frontend on Vercel

3. **Or use Fly.io** (if you add card):
   - Deploy backend only
   - Frontend on Vercel

---

## Step 4: Update Environment Variables

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. **Update:**
   ```
   VITE_API_URL = https://your-backend-url
   VITE_SOCKET_URL = https://your-backend-url
   ```
4. **Redeploy** (automatic or manual)

---

## Step 5: Test Your Deployment

1. **Visit your Vercel URL:** `https://earn-by-chess.vercel.app`
2. **Test:**
   - ✅ Age verification appears
   - ✅ Can register/login
   - ✅ Dashboard loads
   - ✅ API calls work

---

## Automatic Updates

Every time you push to GitHub:
```powershell
git push
```

Vercel **automatically redeploys**! 🚀

---

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Vercel handles SSL automatically

---

## Troubleshooting

### Build fails:
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Check TypeScript errors

### Environment variables not working:
- Must start with `VITE_` for Vite
- Redeploy after adding variables
- Check variable names match exactly

### API not connecting:
- Verify `VITE_API_URL` is correct
- Check backend is deployed and running
- Check CORS settings

---

## Cost Summary

**Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- **Total: $0/month**

**Upgrade:** Only if you need more (not required)

---

## Success Checklist

- [ ] Vercel account created
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Backend deployed (or using Supabase)
- [ ] Site accessible
- [ ] All features working

---

## Your Live Site

**Frontend:** `https://earn-by-chess.vercel.app`  
**Backend:** (depends on your choice)

🎉 **Your site is now live on Vercel!**

---

## Next Steps

1. ✅ Test all features
2. ✅ Monitor deployments
3. ✅ Set up custom domain (optional)
4. ✅ Share your live URL!

**Vercel is the most reliable option - try it now!** ✅

