# Fix Vercel Deployment - Full Stack Setup

## ✅ Fixed Issues

1. ✅ **Removed invalid functions config** - Vercel auto-detects `/api` folder
2. ✅ **Build command includes Prisma** - Generates Prisma client during build
3. ✅ **Both frontend and backend on same site** - API routes in `/api`, frontend in `/client`

## 🚀 How It Works

Vercel automatically detects:
- **Frontend:** Files in `/client` folder (React/Vite app)
- **Backend API:** TypeScript files in `/api` folder (serverless functions)

Both run on the same domain: `https://your-site.vercel.app`

## 📋 Vercel Project Settings

### Important: Root Directory Configuration

**DO NOT set Root Directory to `client`** - Leave it empty (root)!

When Root Directory is empty:
- ✅ Vercel builds from project root
- ✅ Detects `/api` folder automatically
- ✅ Builds `/client` folder for frontend
- ✅ Both work on same domain

### Project Settings in Vercel Dashboard:

1. Go to **Settings** → **General**
2. **Root Directory:** Leave **EMPTY** (not `client`)
3. **Framework Preset:** Vite (auto-detected)
4. **Build Command:** (auto from vercel.json)
5. **Output Directory:** `client/dist` (from vercel.json)
6. **Install Command:** (auto from vercel.json)

## 🔧 Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-random-secret-key-min-32-characters
CORS_ORIGIN=https://your-site.vercel.app
MIN_WITHDRAW=100
RAZORPAY_KEY_ID=your_key (optional)
RAZORPAY_KEY_SECRET=your_secret (optional)
```

**Important:** 
- Don't set `VITE_API_URL` or `VITE_SOCKET_URL` 
- Frontend uses relative paths (`/api/*`) automatically

## 📁 Project Structure

```
.
├── api/                    # Backend API (serverless functions)
│   ├── health.ts
│   ├── wallet.ts
│   ├── auth/
│   │   ├── login.ts
│   │   └── signup.ts
│   └── ...
├── client/                 # Frontend (React/Vite)
│   ├── src/
│   ├── dist/              # Build output
│   └── package.json
├── prisma/                 # Database schema
├── vercel.json             # Vercel config
└── package.json
```

## 🎯 API Routes

All API routes are automatically available at `/api/*`:

- `GET /api/health` → `api/health.ts`
- `POST /api/auth/login` → `api/auth/login.ts`
- `GET /api/wallet` → `api/wallet.ts`
- `GET /api/matches` → `api/matches.ts`
- etc.

## 🐛 Troubleshooting

### Error: "Function Runtimes must have a valid version"

**Fixed!** Removed the `functions` config from `vercel.json`. Vercel auto-detects API routes.

### API Routes Return 404

1. Check files are in root `/api` folder (not `/client/api`)
2. Verify Root Directory is **empty** (not set to `client`)
3. Check build logs show API functions detected

### Build Fails

1. Check `DATABASE_URL` is set (even if database not ready)
2. Prisma generation might fail - that's OK if database not set up yet
3. Check both root and client `package.json` have dependencies

### Database Connection Errors

1. Set `DATABASE_URL` in environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Or skip Prisma generation if database not ready yet

## ✅ Deployment Checklist

- [ ] Root Directory is **EMPTY** (not `client`)
- [ ] `vercel.json` is in project root
- [ ] `/api` folder exists in root
- [ ] `/client` folder exists
- [ ] `DATABASE_URL` is set (or will be set later)
- [ ] `JWT_SECRET` is set
- [ ] `CORS_ORIGIN` is set to your Vercel domain
- [ ] `@vercel/node` is in `package.json` dependencies

## 🚀 Deploy Now

1. Push code to GitHub (already done)
2. Vercel will auto-deploy
3. Or manually trigger deployment in Vercel dashboard
4. Check build logs for any errors
5. Test: `https://your-site.vercel.app/api/health`

## 🎉 Success!

After deployment:
- Frontend: `https://your-site.vercel.app`
- API: `https://your-site.vercel.app/api/*`
- Both on same domain! ✅

