# 🚀 Quick Payment Test Guide

## ⚡ Fastest Way to Test (2 Minutes)

### Step 1: Create `.env` File
1. Copy your Razorpay keys from the dashboard modal:
   - **Test Key ID:** Copy the full key (starts with `rzp_test_`)
   - **Test Key Secret:** Copy the full secret

2. Create a file named `.env` in the root folder (same folder as `server.ts`)

3. Paste this template and fill in your keys:
   ```env
   RAZORPAY_KEY_ID=rzp_test_RvsBR8JNHFy...paste_your_full_key_here
   RAZORPAY_KEY_SECRET=PHU2XCGLmglm4aXU...paste_your_full_secret_here
   PORT=3000
   JWT_SECRET=your-secret-key-change-in-production
   CORS_ORIGIN=http://localhost:5173
   ```

### Step 2: Restart Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test Payment

**Easiest Method - Test Mode:**
1. Open `http://localhost:5173/dashboard`
2. Enter amount: `100`
3. Click "💳 Add Money"
4. Select **"Test Mode"** radio button
5. Click "Pay ₹100.00"
6. ✅ Done! Wallet updated instantly

**Real Payment Flow - Razorpay:**
1. Open `http://localhost:5173/dashboard`
2. Enter amount: `100`
3. Click "💳 Add Money"
4. Select **"Razorpay"** radio button
5. Click "Pay ₹100.00"
6. Razorpay checkout opens
7. Enter test card:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
8. Click "Pay"
9. ✅ Payment successful!

## ✅ Success Indicators

- Wallet balance increases
- No error messages
- Transaction appears in wallet
- Browser console shows "Payment successful"

## ❌ Common Issues

**"Payment gateway not configured"**
→ Check `.env` file exists and has correct keys
→ Restart server after creating `.env`

**Modal doesn't open**
→ Check if frontend is running
→ Check browser console for errors

**Payment fails**
→ Use test card: `4111 1111 1111 1111`
→ Check server logs for errors

