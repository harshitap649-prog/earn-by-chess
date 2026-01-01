# 🚀 START THE SERVER - CRITICAL!

## ⚠️ IMPORTANT: The server is NOT running!

The 500 errors you're seeing are because **the backend server is not running**.

## ✅ How to Start the Server:

### Step 1: Open a NEW Terminal
1. Open a **new terminal/command prompt** window
2. Navigate to your project folder:
   ```bash
   cd "C:\Users\Keshav\Desktop\earn by chess"
   ```

### Step 2: Start the Backend Server
Run this command:
```bash
npm run dev
```

### Step 3: Wait for These Messages
You should see:
```
✅ Environment variables loaded from .env file
🔌 Attempting to connect to database...
✅ Database connected successfully
✅ Database query test successful (Users in DB: X)
🚀 Server running on http://localhost:3000
💳 Payment Gateway: ✅ Razorpay Enabled (or ❌ Not Configured)
```

### Step 4: Keep the Terminal Open
**DO NOT CLOSE THIS TERMINAL!** The server must keep running.

### Step 5: Test the Payment
1. Go to `http://localhost:5173/dashboard`
2. Try to add money
3. **Watch the terminal** - you'll see detailed logs showing what's happening

## 🔍 If Server Won't Start:

### Error: "Cannot find module..."
**Fix:** Install dependencies
```bash
npm install
```

### Error: "Port 3000 already in use"
**Fix:** Kill the process using port 3000
```bash
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Error: "Database connection failed"
**Fix:** 
1. Check if `prisma/dev.db` exists
2. Run: `npx prisma migrate dev`
3. Run: `npx prisma generate`

## 📝 What You Should See:

**When you make a deposit, the terminal will show:**
```
Deposit request received: { userId: '...', body: { amount: 500 } }
Amount validated: 500
Getting wallet for user: ...
Wallet found: { balance: '0', lockedBalance: '0' }
Updating wallet balance...
Wallet balance updated successfully
Creating transaction record...
Transaction record created successfully
Deposit successful! New balance: 500
```

**If there's an error, you'll see:**
```
=== DEPOSIT ERROR ===
Error message: ...
Error stack: ...
=== END ERROR ===
```

## 🎯 Quick Checklist:

- [ ] Server terminal is open
- [ ] Server is running (you see "🚀 Server running on http://localhost:3000")
- [ ] Database connected (you see "✅ Database connected successfully")
- [ ] Frontend is running on `http://localhost:5173`
- [ ] You're logged in to the app

**Once the server is running, try the deposit again!**

