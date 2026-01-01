# How to Test Payment Integration

## Step 1: Add Your Razorpay Keys

1. **Copy your keys from Razorpay Dashboard:**
   - Test Key ID: `rzp_test_RvsBR8JNHFy...` (copy the full key)
   - Test Key Secret: `PHU2XCGLmglm4aXU...` (copy the full key)

2. **Create `.env` file in the root directory** (same folder as `server.ts`)

3. **Add these lines to `.env`:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_RvsBR8JNHFy...your_full_key_here
   RAZORPAY_KEY_SECRET=PHU2XCGLmglm4aXU...your_full_secret_here
   PORT=3000
   JWT_SECRET=your-secret-key-change-in-production
   CORS_ORIGIN=http://localhost:5173
   ```

## Step 2: Restart Your Server

1. **Stop the current server** (if running) - Press `Ctrl+C` in the terminal
2. **Start the server again:**
   ```bash
   npm run dev
   ```

## Step 3: Test the Payment

### Option A: Test Mode (Instant - No Real Payment)
1. Go to Dashboard: `http://localhost:5173/dashboard`
2. Click "Add Money" or enter an amount
3. Click "💳 Add Money" button
4. In the payment modal, select **"Test Mode"**
5. Click "Pay ₹[amount]"
6. ✅ Amount should be instantly added to your wallet

### Option B: Razorpay Test Payment (Real Payment Flow)
1. Go to Dashboard: `http://localhost:5173/dashboard`
2. Enter amount (e.g., ₹100) or click quick amount button
3. Click "💳 Add Money"
4. In payment modal, select **"Razorpay"**
5. Click "Pay ₹[amount]"
6. Razorpay checkout will open
7. Use test card details:
   - **Card Number:** `4111 1111 1111 1111`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiry:** Any future date (e.g., `12/25`)
   - **Name:** Any name
8. Click "Pay"
9. ✅ Payment should succeed and wallet should update

## Step 4: Verify It's Working

1. **Check your wallet balance** - Should show the added amount
2. **Check browser console** - Should show "Payment successful"
3. **Check server logs** - Should show payment verification success

## Troubleshooting

### ❌ "Payment gateway not configured" error
- **Solution:** Make sure `.env` file exists and has correct keys
- Restart the server after creating `.env`

### ❌ Payment modal doesn't open
- **Solution:** Check browser console for errors
- Make sure frontend is running on `http://localhost:5173`

### ❌ Razorpay script not loading
- **Solution:** Check internet connection
- Razorpay CDN needs to be accessible

### ❌ Payment verification failed
- **Solution:** Check server logs for detailed error
- Make sure keys are correct in `.env`

## Test Card Details (Razorpay Test Mode)

**Success Card:**
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: `12/25`

**Failure Card (to test errors):**
- Card: `4000 0000 0000 0002`
- CVV: `123`
- Expiry: `12/25`

## Quick Test Checklist

- [ ] `.env` file created with Razorpay keys
- [ ] Server restarted after adding keys
- [ ] Frontend running on `http://localhost:5173`
- [ ] Backend running on `http://localhost:3000`
- [ ] Test Mode works (instant deposit)
- [ ] Razorpay checkout opens
- [ ] Test card payment succeeds
- [ ] Wallet balance updates

