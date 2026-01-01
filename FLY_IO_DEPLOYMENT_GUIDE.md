# Complete Fly.io Deployment Guide

Step-by-step guide to deploy your chess earning site on Fly.io (FREE, always-on).

---

## Why Fly.io?

- ✅ **Always-on** (no spin-down like Render)
- ✅ **Perfect for Socket.io** (your chess game needs this!)
- ✅ **Generous free tier** (3 shared VMs)
- ✅ **PostgreSQL included**
- ✅ **Global edge network**
- ✅ **No credit card required**

---

## Prerequisites

✅ Code on GitHub: `harshitap649-prog/earn-by-chess`  
✅ Prisma schema updated for PostgreSQL ✅  
✅ Fly.io account (free)

---

## Step 1: Install Fly CLI

### Windows (PowerShell):

```powershell
# Run as Administrator (right-click PowerShell → Run as Administrator)
iwr https://fly.io/install.ps1 -useb | iex
```

### Verify Installation:

```powershell
fly version
```

You should see the Fly CLI version.

---

## Step 2: Sign Up / Login

1. **Sign up at [fly.io](https://fly.io)** (free, no credit card)
2. **Login via CLI:**
   ```powershell
   fly auth login
   ```
   - This will open your browser
   - Authorize Fly.io

---

## Step 3: Create PostgreSQL Database

```powershell
# Create database
fly postgres create --name earn-by-chess-db

# Choose:
# - Region: Select closest to you (e.g., ord for Chicago, lhr for London)
# - VM size: shared-cpu-1x (free tier)
# - Volume size: 3GB (free tier)

# Attach to your app (we'll create app next)
# For now, just create the database
```

**Save the connection string** - you'll need it!

---

## Step 4: Create Fly.io App

```powershell
cd "C:\Users\Keshav\Desktop\earn by chess"

# Initialize Fly.io app
fly launch
```

**Follow the prompts:**
- App name: `earn-by-chess` (or choose your own)
- Region: Same as database
- PostgreSQL: **No** (we created it separately)
- Deploy now: **No** (we'll configure first)

This creates a `fly.toml` file.

---

## Step 5: Configure fly.toml

Open `fly.toml` and update it:

```toml
app = "earn-by-chess"
primary_region = "ord"  # Your region

[build]

[env]
  PORT = "3000"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"

[[services.http_checks]]
  interval = "10s"
  grace_period = "5s"
  method = "GET"
  path = "/health"
  protocol = "http"
  timeout = "2s"
  tls_skip_verify = false
```

---

## Step 6: Create Dockerfile

Fly.io needs a Dockerfile. Create `Dockerfile` in root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build
RUN cd client && npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
```

---

## Step 7: Create .dockerignore

Create `.dockerignore`:

```
node_modules
client/node_modules
dist
client/dist
.env
.env.local
.git
.gitignore
*.md
prisma/dev.db
*.log
```

---

## Step 8: Attach PostgreSQL Database

```powershell
# Attach database to your app
fly postgres attach earn-by-chess-db
```

This automatically sets `DATABASE_URL` as a secret.

---

## Step 9: Set Environment Variables (Secrets)

```powershell
# Set secrets (these are encrypted)
fly secrets set JWT_SECRET="your-random-secret-key-here"
fly secrets set CORS_ORIGIN="https://earn-by-chess.fly.dev"
fly secrets set MIN_WITHDRAW="100"
fly secrets set RAZORPAY_KEY_ID="your-key"
fly secrets set RAZORPAY_KEY_SECRET="your-secret"
```

**Note:** `DATABASE_URL` is automatically set when you attach PostgreSQL.

---

## Step 10: Update server.ts for Health Check

Add a health check endpoint to `server.ts`:

```typescript
// Add this route before other routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

---

## Step 11: Deploy Backend

```powershell
# Deploy!
fly deploy
```

This will:
1. Build your Docker image
2. Push to Fly.io
3. Deploy your app
4. Run migrations automatically

**Wait 5-10 minutes** for first deployment.

---

## Step 12: Run Database Migrations

```powershell
# Run migrations
fly ssh console -C "npx prisma migrate deploy"
```

Or connect via shell:
```powershell
fly ssh console
# Then inside:
npx prisma migrate deploy
exit
```

---

## Step 13: Deploy Frontend

You have two options:

### Option A: Deploy Frontend on Fly.io (Same App)

Create a separate Fly.io app for frontend, or use Fly.io's static site hosting.

### Option B: Deploy Frontend on Vercel (Recommended)

1. **Sign up at [vercel.com](https://vercel.com)**
2. **New Project → Import `earn-by-chess`**
3. **Settings:**
   - Root Directory: `client`
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
4. **Environment Variables:**
   ```
   VITE_API_URL=https://earn-by-chess.fly.dev
   VITE_SOCKET_URL=https://earn-by-chess.fly.dev
   ```
5. **Deploy!**

---

## Step 14: Update CORS

Update your backend CORS origin:

```powershell
fly secrets set CORS_ORIGIN="https://your-frontend-url.vercel.app"
```

Or if frontend is also on Fly.io:
```powershell
fly secrets set CORS_ORIGIN="https://earn-by-chess-frontend.fly.dev"
```

---

## Step 15: Test Your Deployment

1. **Visit your frontend URL**
2. **Test:**
   - ✅ Age verification
   - ✅ Registration/Login
   - ✅ Dashboard
   - ✅ Create match
   - ✅ Chess game (Socket.io)

---

## Troubleshooting

### Build fails:
- Check `Dockerfile` is correct
- Verify all dependencies in `package.json`
- Check build logs: `fly logs`

### Database connection error:
- Verify database is attached: `fly postgres list`
- Check `DATABASE_URL` secret: `fly secrets list`
- Run migrations: `fly ssh console -C "npx prisma migrate deploy"`

### Socket.io not working:
- Verify CORS_ORIGIN is set correctly
- Check backend logs: `fly logs`
- Ensure WebSocket is enabled (Fly.io supports it automatically)

### App won't start:
- Check logs: `fly logs`
- Verify PORT is 3000
- Check health endpoint works

---

## Useful Fly.io Commands

```powershell
# View logs
fly logs

# SSH into app
fly ssh console

# Check app status
fly status

# View secrets
fly secrets list

# Scale app
fly scale count 1

# View metrics
fly metrics
```

---

## Cost Summary

**Free Tier:**
- ✅ 3 shared-cpu VMs
- ✅ 3GB persistent storage
- ✅ 160GB outbound data
- ✅ PostgreSQL database
- **Total: $0/month**

**If you need more:**
- Starter: $1.94/month per VM
- Performance: $3.88/month per VM

---

## Success Checklist

- [ ] Fly CLI installed
- [ ] Account created and logged in
- [ ] PostgreSQL database created
- [ ] App initialized
- [ ] Dockerfile created
- [ ] Database attached
- [ ] Secrets set
- [ ] Backend deployed
- [ ] Migrations run
- [ ] Frontend deployed
- [ ] CORS configured
- [ ] Site working!

---

## Your Live URLs

- **Backend:** `https://earn-by-chess.fly.dev`
- **Frontend:** `https://your-frontend.vercel.app` (or Fly.io URL)

🎉 **Your site is now live and always-on!**

---

## Next Steps

1. ✅ Test all features
2. ✅ Monitor with `fly logs`
3. ✅ Set up custom domain (optional)
4. ✅ Share your live site!

**Need help?** Check Fly.io docs: [fly.io/docs](https://fly.io/docs)

