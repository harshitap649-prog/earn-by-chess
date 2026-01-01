# 🔧 FIX: Backend Server Not Starting

## ❌ The Problem:
```
ECONNREFUSED - Frontend can't connect to backend
```
This means the **backend server is NOT running** on port 3000.

## ✅ Solution: Start Backend Server

### Method 1: Use the Batch File (Easiest)
1. **Double-click:** `start-backend.bat` in the root folder
2. A new window will open and start the server
3. Wait for: `🚀 Server running on http://localhost:3000`

### Method 2: Manual Start (Terminal)
1. **Open a NEW terminal/command prompt**
2. **Navigate to project folder:**
   ```bash
   cd "C:\Users\Keshav\Desktop\earn by chess"
   ```
3. **Start the server:**
   ```bash
   npm run dev
   ```
4. **Wait for these messages:**
   ```
   ✅ Razorpay payment gateway initialized successfully
   🚀 Server running on http://localhost:3000
   💳 Payment Gateway: ✅ Razorpay Enabled
   ```

### Method 3: Use Start-All Script
1. **Double-click:** `start-all.bat`
2. This starts BOTH frontend and backend automatically

## ✅ Verify It's Working:

1. **Check Backend:**
   - Open: `http://localhost:3000` in browser
   - Should show: "Chess Earning Site - Backend API" page

2. **Check Frontend:**
   - Refresh: `http://localhost:5173/dashboard`
   - `ECONNREFUSED` errors should be GONE!

## 🔍 If Server Still Won't Start:

### Check for Errors:
Look at the terminal output for error messages like:
- Database connection errors
- Port already in use
- Missing dependencies

### Common Fixes:

**Port 3000 already in use:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000
# Kill the process or change PORT in .env
```

**Missing dependencies:**
```bash
npm install
```

**Database not connected:**
- Check DATABASE_URL in .env (if using PostgreSQL)
- Or make sure Prisma is set up

## 📝 Quick Checklist:

- [ ] Backend server is running (check terminal)
- [ ] See "🚀 Server running on http://localhost:3000"
- [ ] Can access `http://localhost:3000` in browser
- [ ] Frontend errors are gone
- [ ] Payment modal works

---

**The backend MUST be running for the frontend to work!**

