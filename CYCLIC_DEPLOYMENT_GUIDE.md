# Cyclic Deployment Guide (Simplest Option)

Cyclic is the **easiest** full-stack deployment - just connect GitHub and it works!

---

## Why Cyclic?

- ✅ **Easiest setup** (literally just connect GitHub)
- ✅ **Full-stack in one service**
- ✅ **Automatic deployments**
- ✅ **Free tier**
- ✅ **No configuration needed**
- ⚠️ Uses DynamoDB (need to adapt or use Cyclic's database)

---

## Step 1: Sign Up

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click "Get Started"
3. Sign up with **GitHub** (easiest)
4. Authorize Cyclic

---

## Step 2: Deploy (Super Simple!)

1. **Click "Deploy Now"** or "New App"
2. **Select Repository:**
   - Choose `earn-by-chess` from your GitHub
   - Click "Connect"

3. **Cyclic Auto-Detects:**
   - ✅ Detects Node.js backend
   - ✅ Detects React frontend
   - ✅ Sets up everything automatically!

4. **Configure (if needed):**
   - **Root Directory:** `/` (root)
   - **Build Command:** `npm install && npm run build && cd client && npm install && npm run build`
   - **Start Command:** `npm start`

5. **Environment Variables:**
   Click "Environment" and add:
   ```
   DATABASE_URL=<Cyclic will provide or use their database>
   PORT=3000
   CORS_ORIGIN=https://your-app.cyclic.app
   JWT_SECRET=your-secret-key
   MIN_WITHDRAW=100
   VITE_API_URL=https://your-app.cyclic.app
   VITE_SOCKET_URL=https://your-app.cyclic.app
   ```

6. **Click "Deploy"**

7. **Wait 3-5 minutes** - Cyclic builds and deploys!

---

## Step 3: Database Setup

Cyclic uses **DynamoDB** by default. You have two options:

### Option A: Use Cyclic's Database (Easiest)

Cyclic provides a built-in database. Check their docs for setup.

### Option B: Use External PostgreSQL

1. Use **Supabase** (free PostgreSQL):
   - Sign up at [supabase.com](https://supabase.com)
   - Create project
   - Get connection string
   - Add to Cyclic environment variables

2. Or use **Neon** (free PostgreSQL):
   - Sign up at [neon.tech](https://neon.tech)
   - Create database
   - Get connection string
   - Add to Cyclic

---

## Step 4: Update Prisma for Production

If using external PostgreSQL, your Prisma schema is already set!

If using Cyclic's database, you may need to adapt.

---

## Step 5: Test

1. Visit: `https://your-app.cyclic.app`
2. Test all features
3. Done! 🎉

---

## Automatic Updates

Every time you push to GitHub:
```powershell
git push
```

Cyclic **automatically redeploys**! No manual steps needed.

---

## Cost

**FREE** - No credit card required!

Upgrade available if you need more resources.

---

## Troubleshooting

**Build fails?**
- Check build logs in Cyclic dashboard
- Verify all dependencies are in `package.json`

**Can't connect to database?**
- Verify `DATABASE_URL` is correct
- Check database is accessible

**Socket.io not working?**
- Verify `VITE_SOCKET_URL` matches your app URL
- Check CORS settings

---

## That's It!

Cyclic is the **simplest** option - just connect GitHub and deploy!

**Your site:** `https://your-app.cyclic.app`

---

See `BEST_DEPLOYMENT_OPTIONS.md` for other alternatives!

