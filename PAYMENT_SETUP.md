# Payment Integration Setup Guide

## Razorpay Payment Gateway Integration

This application now supports real payment integration through Razorpay, similar to WinZO and other gaming platforms.

## Features

✅ **Multiple Payment Methods:**
- UPI (PhonePe, Google Pay, Paytm, etc.)
- Credit/Debit Cards
- Net Banking
- Wallets (Paytm, Freecharge, etc.)

✅ **Secure Payment Processing**
✅ **Instant Wallet Credit**
✅ **Payment Verification**

## Setup Instructions

### 1. Get Razorpay API Keys

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live API Keys
4. Copy your **Key ID** and **Key Secret**

### 2. Configure Environment Variables

Create a `.env` file in the root directory (if not exists) and add:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 3. Restart the Server

After adding the environment variables, restart your backend server:

```bash
npm run dev
```

## How It Works

### For Users:

1. **Click "Add Money"** on the dashboard
2. **Enter amount** or use quick amount buttons (₹100, ₹500, ₹1000, ₹5000)
3. **Choose payment method:**
   - **Razorpay**: Real payment via UPI/Cards/Net Banking
   - **Test Mode**: Instant deposit (for testing only)
4. **Complete payment** through Razorpay checkout
5. **Amount is instantly credited** to wallet after successful payment

### Payment Flow:

```
User → Enter Amount → Choose Payment Method → 
Razorpay Checkout → Payment Success → 
Backend Verification → Wallet Updated → Transaction Recorded
```

## API Endpoints

### Create Payment Order
```
POST /payment/create-order
Body: { amount: number }
Response: { orderId, amount, keyId }
```

### Verify Payment
```
POST /payment/verify
Body: { 
  razorpay_order_id, 
  razorpay_payment_id, 
  razorpay_signature, 
  amount 
}
Response: { success, balance, lockedBalance }
```

## Testing

### Test Mode
- Use "Test Mode" option in payment modal for instant deposits
- No real payment required
- Useful for development and testing

### Razorpay Test Cards
When using Razorpay in test mode, use these test cards:

**Success Cards:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure Cards:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

## Production Deployment

### Before Going Live:

1. **Switch to Live Keys:**
   - Replace test keys with live keys in `.env`
   - Get live keys from Razorpay Dashboard

2. **Enable Webhooks:**
   - Set up webhook URL in Razorpay Dashboard
   - Handle payment events (optional but recommended)

3. **Remove Test Mode:**
   - Remove test payment option from frontend
   - Keep only Razorpay payment method

4. **Security:**
   - Never expose `RAZORPAY_KEY_SECRET` in frontend
   - Always verify payment signatures on backend
   - Use HTTPS in production

## Troubleshooting

### Payment Gateway Not Configured Error
- Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`
- Restart the server after adding environment variables

### Payment Verification Failed
- Check Razorpay dashboard for payment status
- Verify signature calculation is correct
- Check server logs for detailed error messages

### Script Not Loading
- Check internet connection
- Verify Razorpay CDN is accessible
- Check browser console for errors

## Support

For Razorpay-related issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For application issues:
- Check server logs
- Review error messages in payment modal

