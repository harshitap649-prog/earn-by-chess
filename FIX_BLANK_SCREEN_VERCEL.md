# Fix Blank Screen on Vercel

## Problem

After login, the dashboard shows a blank screen with error: `Cannot read properties of undefined (reading 'toFixed')`

## Root Cause

1. **API routes not working** - The backend API functions might not be deployed or detected by Vercel
2. **Database not configured** - Missing `DATABASE_URL` environment variable
3. **Prisma not generated** - Prisma client needs to be generated during build

## Solution

### Step 1: Verify API Routes Are Deployed

1. Go to your Vercel project dashboard
2. Check **Deployments** tab
3. Look at the build logs - you should see API functions being detected
4. If not, check that:
   - Files are in `/api` folder (not `/client/api`)
   - `@vercel/node` is installed
   - `vercel.json` has correct configuration

### Step 2: Set Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-random-secret-key-min-32-characters
CORS_ORIGIN=https://your-site.vercel.app
MIN_WITHDRAW=100
```

**Important:** Get `DATABASE_URL` from:
- Vercel Postgres (Storage → Create Database)
- Supabase (free)
- Neon (free)

### Step 3: Run Database Migrations

After setting `DATABASE_URL`, you need to run migrations:

**Option A: Via Vercel CLI (Recommended)**
```bash
vercel env pull .env.local
npx prisma generate
npx prisma migrate deploy
```

**Option B: Via Vercel Build Command**
The `vercel.json` now includes `npx prisma generate` in the build command.

### Step 4: Test API Endpoints

1. Visit: `https://your-site.vercel.app/api/health`
   - Should return: `{"ok": true, "message": "API is working"}`

2. If 404, the API routes aren't being detected. Check:
   - Files are in root `/api` folder
   - `vercel.json` functions configuration
   - Build logs show API functions

### Step 5: Check Browser Console

Open browser DevTools → Console:
- Look for API call errors
- Check network tab for failed requests
- Verify API calls are going to `/api/*` (not external URLs)

## Quick Fix Checklist

- [ ] API files are in `/api` folder (root, not client)
- [ ] `@vercel/node` is installed in `package.json`
- [ ] `DATABASE_URL` is set in Vercel environment variables
- [ ] `JWT_SECRET` is set in Vercel environment variables
- [ ] `CORS_ORIGIN` is set to your Vercel domain
- [ ] Database migrations are run (`npx prisma migrate deploy`)
- [ ] Prisma client is generated (`npx prisma generate`)
- [ ] Vercel build includes Prisma generation (updated in `vercel.json`)

## Testing

1. **Test Health Endpoint:**
   ```
   https://your-site.vercel.app/api/health
   ```

2. **Test Login:**
   - Try logging in
   - Check browser console for errors
   - Check network tab for API calls

3. **Test Dashboard:**
   - After login, dashboard should load
   - Wallet balance should show (even if 0)
   - No blank screen

## If Still Not Working

1. **Check Vercel Build Logs:**
   - Look for errors during build
   - Check if API functions are detected
   - Verify Prisma generation succeeded

2. **Check Function Logs:**
   - Vercel Dashboard → Functions tab
   - Look for runtime errors

3. **Verify API Structure:**
   ```
   /api
   ├── health.ts
   ├── wallet.ts
   ├── auth/
   │   ├── login.ts
   │   └── signup.ts
   └── ...
   ```

4. **Test Locally:**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   vercel dev
   ```
   Then test: `http://localhost:3000/api/health`

## Common Issues

### Issue: API returns 404
**Fix:** Make sure files are in root `/api` folder, not `/client/api`

### Issue: Database connection error
**Fix:** Set `DATABASE_URL` in Vercel environment variables

### Issue: Prisma client not found
**Fix:** Add `npx prisma generate` to build command (already done in `vercel.json`)

### Issue: CORS errors
**Fix:** Set `CORS_ORIGIN` to your Vercel domain URL

### Issue: Authentication fails
**Fix:** Set `JWT_SECRET` in environment variables

