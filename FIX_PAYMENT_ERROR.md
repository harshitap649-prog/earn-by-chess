# Fix Payment Error - Step by Step

## Problem
Getting 500 Internal Server Error when trying to deposit money.

## Solution Applied

### 1. Database Fixed
- ✅ Switched from PostgreSQL to SQLite (no separate database server needed)
- ✅ Database file created at `prisma/dev.db`
- ✅ Prisma schema updated and migrations applied

### 2. Error Handling Improved
- ✅ Added detailed error logging in wallet endpoint
- ✅ Added detailed error logging in deposit endpoint
- ✅ Added detailed error logging in matches endpoint
- ✅ Better error messages for debugging

### 3. Database Connection
- ✅ Added database connection test on startup
- ✅ Improved error handling in `db.ts`

## How to Fix

### Step 1: Restart the Backend Server

**IMPORTANT:** You MUST restart the backend server for changes to take effect!

1. **Stop the current server:**
   - In the terminal where the server is running, press `Ctrl+C`
   - Wait for it to stop completely

2. **Start the server again:**
   ```bash
   npm run dev
   ```

3. **Check for these messages:**
   - ✅ `Environment variables loaded from .env file`
   - ✅ `Database connected successfully`
   - ✅ `Database query test successful`
   - ✅ `Server running on http://localhost:3000`

### Step 2: Test the Payment

1. Open `http://localhost:5173/dashboard` in your browser
2. Click "Add Money"
3. Enter an amount (e.g., ₹100)
4. Select "Test Mode"
5. Click "Pay ₹100.00"

### Step 3: Check for Errors

**If you still see errors:**

1. **Check the backend terminal** - Look for error messages
2. **Check browser console (F12)** - Look for detailed error messages
3. **Common issues:**
   - Server not restarted → Restart it!
   - Database locked → Close any Prisma Studio or other database connections
   - Port already in use → Kill the process using port 3000

## What Changed

### Files Modified:
- `prisma/schema.prisma` - Changed to SQLite
- `db.ts` - Added connection testing
- `server.ts` - Improved error handling in all endpoints
- `services/wallet.ts` - Added error handling

### Database:
- Now using SQLite (local file: `prisma/dev.db`)
- No need for PostgreSQL setup
- Database automatically created on first run

## Still Not Working?

If you're still getting errors after restarting:

1. **Share the error message** from:
   - Backend terminal
   - Browser console (F12)

2. **Check if server is running:**
   - Open `http://localhost:3000` in browser
   - Should see a redirect message or API response

3. **Verify database:**
   ```bash
   npx prisma studio
   ```
   - This opens a database viewer
   - Check if tables exist (User, Wallet, Transaction, etc.)

