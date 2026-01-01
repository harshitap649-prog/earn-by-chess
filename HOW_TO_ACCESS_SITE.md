# How to Access Your Chess Earning Site

## You're Currently Viewing:
- **Backend API** at `http://localhost:3000` (This is just the API server)

## You Need to Access:
- **Frontend Website** at `http://localhost:5173` (This is your actual website)

---

## Quick Start (Easiest Way)

### Option 1: Use the Batch File (Windows)
1. Double-click `start-all.bat` in the root folder
2. It will start both backend and frontend automatically
3. Your browser will open to `http://localhost:5173`

### Option 2: Manual Start

**Step 1: Start Backend (if not running)**
```bash
# In root directory
npm run dev
```
Backend runs on: `http://localhost:3000`

**Step 2: Start Frontend (NEW TERMINAL)**
1. Open a **NEW terminal window**
2. Navigate to client folder:
   ```bash
   cd client
   ```
3. Install dependencies (first time only):
   ```bash
   npm install
   ```
4. Start frontend:
   ```bash
   npm run dev
   ```

**Step 3: Open Your Website**
- Go to: **http://localhost:5173**
- This is your actual functional website!

---

## What You'll See:

✅ **Login/Signup Page** - Beautiful authentication page
✅ **Dashboard** - Wallet, matches, create/join games
✅ **Chess Game** - Play chess and earn money
✅ **Real-time Updates** - Live game moves via Socket.io

---

## Important Notes:

- **Backend (port 3000)**: API server - shows instructions page
- **Frontend (port 5173)**: Your actual website - this is what users see
- **Both must run**: Backend AND Frontend need to be running simultaneously

---

## Troubleshooting:

**"Cannot connect to localhost:5173"**
- Frontend is not running
- Start it with: `cd client && npm run dev`

**"Network Error" or API fails**
- Backend is not running
- Start it with: `npm run dev` (in root directory)

**Port already in use**
- Another app is using the port
- Close other apps or change the port in config files

---

## Quick Access:

Once both servers are running:
- **Website**: http://localhost:5173
- **API**: http://localhost:3000

