# 🚨 CRITICAL: Start the Backend Server!

## The Problem:
You're getting 500 errors because **the backend server is NOT running**.

## Quick Fix:

### Step 1: Open a Terminal
Open a new terminal/command prompt window.

### Step 2: Navigate to Project
```bash
cd "C:\Users\Keshav\Desktop\earn by chess"
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Wait for These Messages
You should see:
```
✅ Environment variables loaded from .env file
🔌 Attempting to connect to database...
✅ Database connected successfully
✅ Database query test successful (Users in DB: X)
🚀 Server running on http://localhost:3000
```

### Step 5: Keep Terminal Open
**DO NOT CLOSE THIS TERMINAL!** The server must keep running.

### Step 6: Test Free Play
1. Go to `http://localhost:5173/dashboard`
2. Click "Play Now" on the Free Play card
3. Watch the terminal - you'll see logs showing what's happening

## What You'll See in Terminal:

**When creating a free match:**
```
=== MATCH CREATE REQUEST ===
User ID: ...
Request body: { "entryFee": 0 }
Entry fee: 0 Type: number
Creating match...
createMatch called: { userId: '...', entryFee: 0 }
Free match - skipping wallet operations
Creating match in database...
Match created successfully: { id: '...', entryFee: '0' }
=== MATCH CREATE END ===
```

**If there's an error, you'll see:**
```
=== MATCH CREATE ERROR ===
Error message: ...
Error stack: ...
=== END ERROR ===
```

## Alternative: Use Batch File

Double-click `start-server.bat` in your project folder - it will start the server automatically!

---

**Once the server is running, Free Play will work!**

