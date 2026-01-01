# Cyclic Quick Start (NO Credit Card Required!)

Cyclic is the **easiest** deployment - no credit card needed!

---

## 🚀 Deploy in 3 Steps

### Step 1: Sign Up (1 minute)

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click **"Get Started"** or **"Deploy Now"**
3. Sign up with **GitHub** (click GitHub button)
4. Authorize Cyclic to access your repositories

### Step 2: Deploy (2 minutes)

1. **Click "Deploy Now"** or **"New App"**
2. **Select Repository:**
   - You'll see your GitHub repos
   - Click on **`earn-by-chess`**
   - Click **"Connect"**

3. **Cyclic Auto-Detects Everything!**
   - ✅ Detects Node.js backend
   - ✅ Detects React frontend
   - ✅ Sets up automatically

4. **Configure (if needed):**
   - **Root Directory:** `/` (root)
   - **Build Command:** 
     ```
     npm install && npm run build && cd client && npm install && npm run build
     ```
   - **Start Command:** `npm start`

5. **Environment Variables:**
   - Click **"Environment"** tab
   - Add these variables:
     ```
     DATABASE_URL=<we'll get this from Supabase/Neon>
     PORT=3000
     CORS_ORIGIN=https://your-app.cyclic.app
     JWT_SECRET=your-random-secret-key-here
     MIN_WITHDRAW=100
     RAZORPAY_KEY_ID=your-key
     RAZORPAY_KEY_SECRET=your-secret
     VITE_API_URL=https://your-app.cyclic.app
     VITE_SOCKET_URL=https://your-app.cyclic.app
     ```

6. **Click "Deploy"**

7. **Wait 3-5 minutes** - Cyclic builds and deploys!

### Step 3: Add Database (2 minutes)

Cyclic needs a PostgreSQL database. Use **Supabase** (free, no card):

1. **Sign up at [supabase.com](https://supabase.com)** (free)
2. **Create New Project:**
   - Name: `earn-by-chess`
   - Database Password: (save this!)
   - Region: Choose closest
   - Click "Create new project"

3. **Get Connection String:**
   - Go to Project Settings → Database
   - Copy **"Connection string"** (URI format)
   - It looks like: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`

4. **Add to Cyclic:**
   - Go back to Cyclic dashboard
   - Your app → Environment
   - Update `DATABASE_URL` with Supabase connection string
   - Save

5. **Run Migrations:**
   - Go to Cyclic app → Logs
   - Or use their shell/console feature
   - Run: `npx prisma migrate deploy`

---

## ✅ That's It!

Your site will be live at: `https://your-app.cyclic.app`

**No credit card required!** 🎉

---

## 🔄 Automatic Updates

Every time you push to GitHub:
```powershell
git push
```

Cyclic **automatically redeploys**!

---

## 🆓 Free Tier

- ✅ No credit card required
- ✅ Automatic deployments
- ✅ Free hosting
- ✅ SSL/HTTPS included

---

## 🆘 Troubleshooting

**Build fails?**
- Check logs in Cyclic dashboard
- Verify all dependencies in `package.json`

**Database error?**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Run migrations: `npx prisma migrate deploy`

**Socket.io not working?**
- Verify `VITE_SOCKET_URL` matches your Cyclic URL
- Check CORS_ORIGIN is set correctly

---

## 📝 Alternative: Use Neon (Free PostgreSQL)

If Supabase doesn't work, try **Neon**:

1. Sign up at [neon.tech](https://neon.tech) (free)
2. Create project
3. Get connection string
4. Add to Cyclic environment variables

---

**Cyclic is the easiest - just connect GitHub and deploy!** 🚀

