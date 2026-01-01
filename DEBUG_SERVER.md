# Debug Server Issues

## Current Problem
Getting 500 Internal Server Error when trying to deposit money or access wallet.

## What I've Done

### 1. Added Detailed Logging
- All endpoints now log detailed information:
  - Request start/end markers
  - User IDs
  - Request bodies
  - Error details with stack traces

### 2. Improved Error Handling
- Each step of the deposit process is wrapped in try-catch
- Errors are logged with full details
- Database errors are caught and reported clearly

### 3. Database Connection
- Added connection testing on startup
- Better error messages for database issues

## How to Debug

### Step 1: Check Server Terminal
Look at the backend server terminal (where you ran `npm run dev`). You should see:

**On Server Start:**
- `✅ Environment variables loaded from .env file`
- `🔌 Attempting to connect to database...`
- `✅ Database connected successfully`
- `✅ Database query test successful (Users in DB: X)`
- `🚀 Server running on http://localhost:3000`

**When Making a Deposit:**
- `=== DEPOSIT REQUEST START ===`
- `User ID: ...`
- `Request body: ...`
- `Amount validated: ...`
- `Getting wallet for user: ...`
- `Wallet found: ...`
- `Updating wallet balance...`
- `Wallet balance updated successfully`
- `Creating transaction record...`
- `Transaction record created successfully`
- `Deposit successful! New balance: ...`
- `=== DEPOSIT REQUEST END ===`

**If There's an Error:**
- `=== DEPOSIT ERROR ===`
- `Error message: ...`
- `Error stack: ...`
- `=== END ERROR ===`

### Step 2: Common Issues

#### Issue: "Database connection failed"
**Solution:**
1. Check if `prisma/dev.db` file exists
2. Run: `npx prisma migrate dev`
3. Run: `npx prisma generate`

#### Issue: "User not authenticated"
**Solution:**
1. Logout and login again
2. Check if JWT token is being sent in request headers

#### Issue: "Failed to access wallet"
**Solution:**
1. Check database connection
2. Verify user exists in database
3. Check Prisma schema matches database

#### Issue: "Failed to update wallet"
**Solution:**
1. Check if wallet exists for user
2. Verify database permissions
3. Check if database file is locked

### Step 3: Check Database

Open Prisma Studio to check database:
```bash
npx prisma studio
```

Check:
- Does the `User` table have your user?
- Does the `Wallet` table have a wallet for your user?
- Are there any errors in the database?

### Step 4: Restart Server

After making changes, **always restart the server**:
1. Stop server (Ctrl+C)
2. Start again: `npm run dev`
3. Check startup messages for errors

## Next Steps

1. **Check the server terminal** - Look for the detailed error messages
2. **Share the error** - Copy the error message from the terminal
3. **Check database** - Verify database is working with Prisma Studio

The detailed logging will show exactly where the error is occurring!

