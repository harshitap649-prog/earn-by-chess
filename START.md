# 🚀 Quick Start Guide

## Step 1: Start the Backend

In the root directory:
```bash
npm install
npm run dev
```

Backend will run on: **http://localhost:3000**

## Step 2: Start the Frontend

Open a **NEW terminal window** and run:
```bash
cd client
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

## Step 3: Access the Application

Open your browser and go to:
**http://localhost:5173**

You should see the login page!

## ⚠️ Important Notes

- **Backend must be running** on port 3000
- **Frontend must be running** on port 5173
- Both need to run **simultaneously** in separate terminals
- If you see JSON at localhost:3000, that's the backend API (which is correct!)
- The actual website is at **localhost:5173**

## 🐛 Troubleshooting

**"Cannot GET /" or JSON response:**
- You're on the backend (localhost:3000) ✅ This is correct!
- Go to **localhost:5173** for the frontend

**Frontend not loading:**
- Make sure you ran `cd client` first
- Make sure you ran `npm install` in the client folder
- Check that port 5173 is not already in use

**API errors:**
- Make sure backend is running on port 3000
- Check your `.env` file has correct DATABASE_URL

