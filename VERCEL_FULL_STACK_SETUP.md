# Deploy Full Stack on Vercel (Frontend + Backend)

This guide shows you how to deploy both frontend and backend on **one Vercel site**.

## ✅ What's Already Done

1. ✅ **API Routes Created** - All Express routes converted to Vercel serverless functions in `/api` folder
2. ✅ **Vercel Config Updated** - `vercel.json` configured for both frontend and API
3. ✅ **Frontend Config Updated** - Uses relative API paths when on same domain

## ⚠️ Important: Socket.io Limitation

**Socket.io cannot work with Vercel serverless functions** because:
- Serverless functions are stateless and short-lived
- WebSocket connections require persistent connections
- Each function invocation is isolated

### Solutions for Real-time Features:

**Option 1: Deploy Socket.io Separately (Recommended)**
- Deploy Socket.io server on Render (free) or Railway
- Update frontend to connect to that URL
- Keep REST API on Vercel

**Option 2: Use Polling Instead**
- Replace Socket.io with HTTP polling
- Less efficient but works everywhere

**Option 3: Use Real-time Service**
- Use Pusher, Ably, or Firebase Realtime Database
- Requires service setup but handles scaling

## 🚀 Deployment Steps

### 1. Install Dependencies

Make sure you have `@vercel/node` installed:

```bash
npm install @vercel/node --save-dev
```

### 2. Set Up Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-random-secret-key-here
CORS_ORIGIN=https://your-site.vercel.app
MIN_WITHDRAW=100
RAZORPAY_KEY_ID=your_razorpay_key (optional)
RAZORPAY_KEY_SECRET=your_razorpay_secret (optional)
```

**Important:** 
- Don't set `VITE_API_URL` or `VITE_SOCKET_URL` - the frontend will use relative paths
- Get `DATABASE_URL` from a PostgreSQL provider (Vercel Postgres, Supabase, or Neon)

### 3. Set Up Database

**Option A: Vercel Postgres (Easiest)**
1. Go to Vercel Dashboard → **Storage** → **Create Database**
2. Select **Postgres**
3. Copy the connection string to `DATABASE_URL`

**Option B: Supabase (Free)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string

**Option C: Neon (Free)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### 4. Run Database Migrations

After setting up the database, run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's build command to do this automatically.

### 5. Deploy to Vercel

**Via GitHub (Recommended):**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your GitHub repository
5. **Root Directory:** Leave empty (root)
6. **Build Command:** `npm install && cd client && npm install && npm run build:skip-check`
7. **Output Directory:** `client/dist`
8. **Install Command:** `npm install && cd client && npm install`
9. Click **Deploy**

**Via Vercel CLI:**
```bash
npm i -g vercel
vercel
```

### 6. Update Build Settings (If Needed)

If Vercel doesn't detect the config automatically:
- **Framework Preset:** Vite
- **Root Directory:** (leave empty)
- **Build Command:** `npm install && cd client && npm install && npm run build:skip-check`
- **Output Directory:** `client/dist`

## 📁 Project Structure

```
.
├── api/                    # Vercel serverless functions
│   ├── _shared/           # Shared utilities
│   │   ├── auth.ts       # Auth helpers
│   │   └── cors.ts       # CORS helpers
│   ├── auth/
│   │   ├── signup.ts
│   │   ├── login.ts
│   │   └── firebase.ts
│   ├── wallet.ts
│   ├── transactions.ts
│   ├── matches.ts
│   ├── match/
│   │   ├── create.ts
│   │   ├── [id].ts
│   │   ├── join/
│   │   └── complete/
│   ├── payment/
│   ├── profile.ts
│   └── withdraw.ts
├── client/                # React frontend
│   ├── src/
│   └── dist/              # Build output
├── prisma/                # Database schema
├── vercel.json            # Vercel configuration
└── package.json
```

## 🔧 API Routes Mapping

All routes are accessible at `/api/*`:

- `POST /api/auth/signup` → `api/auth/signup.ts`
- `POST /api/auth/login` → `api/auth/login.ts`
- `GET /api/wallet` → `api/wallet.ts`
- `GET /api/transactions` → `api/transactions.ts`
- `GET /api/matches` → `api/matches.ts`
- `POST /api/match/create` → `api/match/create.ts`
- `GET /api/match/:id` → `api/match/[id].ts`
- `POST /api/match/join/:id` → `api/match/join/[id].ts`
- `POST /api/match/complete/:id` → `api/match/complete/[id].ts`
- `POST /api/wallet/deposit` → `api/wallet/deposit.ts`
- `GET /api/profile` → `api/profile.ts`
- `POST /api/withdraw` → `api/withdraw.ts`

## 🐛 Troubleshooting

### API Routes Return 404

- Check that files are in `/api` folder (not `/client/api`)
- Verify `vercel.json` has correct `functions` configuration
- Make sure `@vercel/node` is installed

### Database Connection Errors

- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Vercel
- Run `npx prisma generate` and `npx prisma migrate deploy`

### CORS Errors

- Set `CORS_ORIGIN` to your Vercel domain
- Check API routes have CORS headers set

### Build Fails

- Make sure both root and client `package.json` have correct dependencies
- Check build command includes both `npm install` steps

## 📝 Next Steps

1. **Deploy Socket.io separately** on Render or Railway for real-time features
2. **Set up custom domain** in Vercel
3. **Configure Razorpay** for payments (optional)
4. **Add error monitoring** (Sentry, LogRocket)

## 🎉 Success!

Once deployed, your site will have:
- ✅ Frontend on Vercel
- ✅ Backend API on Vercel (serverless functions)
- ✅ All REST endpoints working
- ⚠️ Socket.io needs separate deployment

Your site URL will be: `https://your-project.vercel.app`

