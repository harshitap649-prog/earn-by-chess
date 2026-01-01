# 🔧 Install Razorpay Package

## The Error:
```
Error: Cannot find module 'razorpay'
```

## ✅ Quick Fix:

Run this command in your terminal:

```bash
npm install razorpay
```

## ✅ After Installation:

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **You should see:**
   ```
   ✅ Environment variables loaded from .env file
   ✅ Razorpay payment gateway initialized successfully
   🚀 Server running on http://localhost:3000
   💳 Payment Gateway: ✅ Razorpay Enabled
   ```

## 🔍 If Installation Fails:

Try:
```bash
npm install razorpay@2.9.2 --legacy-peer-deps
```

Or:
```bash
npm cache clean --force
npm install razorpay
```

---

**I've already added razorpay to package.json. Just run `npm install` and then `npm run dev`!**

