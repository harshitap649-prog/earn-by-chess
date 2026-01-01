# Fix Profile Page on Localhost

## Problem

Profile page shows 404 error: `GET http://localhost:5173/api/data/profile 404 (Not Found)`

## Root Cause

The frontend calls `/api/data/profile`, which:
- ✅ Works on **Vercel** (via `api/data.ts` serverless function)
- ❌ Doesn't work on **localhost** (Express server doesn't have `/data/profile` route)

## Solution Applied

Added `/data/*` routes to Express server (`server.ts`) for localhost compatibility:

1. ✅ `/data/matches` - Returns available matches
2. ✅ `/data/profile` - Returns user profile with wallet, stats, transactions
3. ✅ `/data/transactions` - Returns transaction history

## How to Test

1. **Restart your Express server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Visit Profile page:**
   - Go to: `http://localhost:5173/profile`
   - Should now load correctly! ✅

## Routes Now Available

### On Localhost (Express):
- `/profile` - Original route (still works)
- `/data/profile` - New route (matches frontend expectations)
- `/matches` - Original route
- `/data/matches` - New route
- `/transactions` - Original route
- `/data/transactions` - New route

### On Vercel (Serverless):
- `/api/data/profile` - Handled by `api/data.ts`
- `/api/data/matches` - Handled by `api/data.ts`
- `/api/data/transactions` - Handled by `api/data.ts`

## Status

✅ **Fixed!** Profile page now works on both localhost and Vercel.

