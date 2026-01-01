# 🚀 How to Start Your Application

## ⚠️ IMPORTANT: You Need TWO Servers Running!

Your application needs **BOTH** servers running:
1. **Backend Server** (port 3000) - Handles API requests
2. **Frontend Server** (port 5173) - Shows the website

## 📋 Step-by-Step Instructions:

### Step 1: Start the Backend Server

**Option A: Double-click `start-server.bat`**
- This will open a new window and start the backend

**Option B: Manual start**
1. Open a **new terminal/command prompt**
2. Navigate to your project:
   ```bash
   cd "C:\Users\Keshav\Desktop\earn by chess"
   ```
3. Run:
   ```bash
   npm run dev
   ```

**You should see:**
```
✅ Environment variables loaded from .env file
🔌 Attempting to connect to database...
✅ Database connected successfully
✅ Database query test successful (Users in DB: X)
🚀 Server running on http://localhost:3000
```

### Step 2: Start the Frontend Server

**Open a SECOND terminal/command prompt** (keep the first one open!)

1. Navigate to the client folder:
   ```bash
   cd "C:\Users\Keshav\Desktop\earn by chess\client"
   ```

2. Run:
   ```bash
   npm run dev
   ```

**You should see:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Open Your Browser

1. Go to: `http://localhost:5173`
2. You should see the login page!

## ✅ Checklist:

- [ ] Backend server running (terminal 1 shows "Server running on http://localhost:3000")
- [ ] Frontend server running (terminal 2 shows "Local: http://localhost:5173/")
- [ ] Browser opens `http://localhost:5173` successfully
- [ ] You can see the login page

## 🔧 Troubleshooting:

### "Port 3000 already in use"
**Backend port conflict:**
```bash
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### "Port 5173 already in use"
**Frontend port conflict:**
```bash
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### "Cannot find module..."
**Missing dependencies:**
```bash
# In project root:
npm install

# In client folder:
cd client
npm install
```

### "ERR_CONNECTION_REFUSED"
**Server not running:**
- Make sure BOTH servers are running
- Check both terminal windows are open
- Restart both servers

## 📝 Quick Reference:

**Terminal 1 (Backend):**
```bash
cd "C:\Users\Keshav\Desktop\earn by chess"
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd "C:\Users\Keshav\Desktop\earn by chess\client"
npm run dev
```

**Browser:**
- Open: `http://localhost:5173`

## 🎯 Both Servers Must Stay Running!

- **DO NOT close** the terminal windows
- Keep both servers running while using the app
- If you close them, the app will stop working

---

**Once both servers are running, refresh your browser and the app should work!**
