# Deployment Troubleshooting Guide

Common issues and solutions when deploying your chess earning site.

---

## ❌ Issue: "This site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN

### Problem:
Trying to access wrong URL or domain doesn't exist.

### Solutions:

#### For Cyclic:
- ✅ **Correct URL:** [app.cyclic.app](https://app.cyclic.app) (NOT .sh)
- ✅ **Your app:** `your-app-name.cyclic.app`
- ❌ **Wrong:** `app.cyclic.sh` (doesn't exist)

#### For Other Platforms:
- **Fly.io:** `your-app.fly.dev`
- **Render:** `your-app.onrender.com`
- **Vercel:** `your-app.vercel.app`
- **Koyeb:** `your-app.koyeb.app`

---

## ❌ Issue: "We need your payment information"

### Problem:
Platform requires credit card (even for free tier).

### Solution:
Use platforms that **don't require credit card:**
- ✅ **Cyclic** - No card needed
- ✅ **Koyeb** - No card needed
- ✅ **Vercel** - No card needed (frontend)
- ❌ **Fly.io** - Requires card
- ❌ **Render** - May require card

---

## ❌ Issue: Build Fails

### Common Causes:

1. **Missing Dependencies:**
   ```bash
   # Check package.json has all dependencies
   # Make sure both root and client/package.json are complete
   ```

2. **Build Command Wrong:**
   - Backend: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Frontend: `npm install && npm run build`

3. **TypeScript Errors:**
   - Fix all TypeScript errors before deploying
   - Run `npm run build` locally first

4. **Missing Environment Variables:**
   - Set all required env vars in platform dashboard

---

## ❌ Issue: Database Connection Error

### Solutions:

1. **Check DATABASE_URL:**
   - Verify it's set correctly
   - Use "Internal Database URL" for same-platform databases
   - Use full connection string for external databases

2. **Run Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Check Database is Running:**
   - Verify database service is active
   - Check database logs

4. **For Supabase/Neon:**
   - Verify connection string format
   - Check database is accessible
   - Verify IP whitelist (if applicable)

---

## ❌ Issue: CORS Errors

### Problem:
Frontend can't connect to backend.

### Solutions:

1. **Set CORS_ORIGIN correctly:**
   ```
   CORS_ORIGIN=https://your-frontend-url.cyclic.app
   ```
   - Must match your frontend URL exactly
   - Include `https://`
   - No trailing slash

2. **Check Environment Variables:**
   - Backend: `CORS_ORIGIN` set to frontend URL
   - Frontend: `VITE_API_URL` set to backend URL

3. **Verify URLs:**
   - Both services must be deployed
   - URLs must be accessible

---

## ❌ Issue: Socket.io Not Working

### Solutions:

1. **Check Socket URL:**
   ```
   VITE_SOCKET_URL=https://your-backend-url.cyclic.app
   ```

2. **Verify CORS:**
   - CORS_ORIGIN must allow your frontend domain
   - Socket.io needs WebSocket support (most platforms support it)

3. **Check Backend Logs:**
   - Look for Socket.io connection errors
   - Verify Socket.io server is running

---

## ❌ Issue: 404 Not Found

### Solutions:

1. **Check Root Directory:**
   - Backend: `/` (root)
   - Frontend: `client/` (if deploying separately)

2. **Verify Build Output:**
   - Backend: `dist/` folder exists
   - Frontend: `client/dist/` folder exists

3. **Check Start Command:**
   - Backend: `npm start` (runs `node dist/server.js`)
   - Frontend: Should serve `dist/` folder

---

## ❌ Issue: Environment Variables Not Working

### Solutions:

1. **Restart Service:**
   - Most platforms need restart after adding env vars
   - Some auto-restart, some need manual restart

2. **Check Variable Names:**
   - Must match exactly (case-sensitive)
   - No spaces around `=`
   - Use quotes if value has spaces

3. **For Vite (Frontend):**
   - Must start with `VITE_` prefix
   - Example: `VITE_API_URL` (not `API_URL`)

---

## ✅ Quick Fixes Checklist

- [ ] Using correct platform URL
- [ ] All environment variables set
- [ ] Database connected and migrations run
- [ ] CORS_ORIGIN matches frontend URL
- [ ] Build commands correct
- [ ] Dependencies in package.json
- [ ] Services restarted after changes
- [ ] Check platform logs for errors

---

## 🆘 Still Having Issues?

1. **Check Platform Logs:**
   - Most platforms have logs in dashboard
   - Look for error messages

2. **Test Locally First:**
   - Make sure everything works locally
   - Fix errors before deploying

3. **Check Platform Docs:**
   - Each platform has specific requirements
   - Check their documentation

4. **Common Mistakes:**
   - Wrong URLs (.sh vs .app)
   - Missing environment variables
   - Database not connected
   - CORS misconfigured
   - Build commands incorrect

---

## 📞 Platform Support

- **Cyclic:** Check dashboard logs
- **Fly.io:** `fly logs` command
- **Render:** View logs in dashboard
- **Vercel:** Check deployment logs

---

**Most issues are:**
1. Wrong URL
2. Missing env vars
3. Database not connected
4. CORS misconfigured

Fix these first! ✅

