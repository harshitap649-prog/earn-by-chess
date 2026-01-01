# Fix Vercel 12 Function Limit

## Problem

Vercel Hobby (free) plan limits deployments to **12 serverless functions**. We have 17+ API routes, causing deployment to fail.

## Solution

We need to **combine routes** into fewer functions. The best approach is to use a **single API router** that handles all routes internally.

## Current Function Count

We have these API files (each becomes a function):
1. health.ts
2. auth/signup.ts
3. auth/login.ts
4. auth/firebase.ts
5. wallet.ts
6. wallet/deposit.ts
7. transactions.ts
8. matches.ts
9. match/create.ts
10. match/[id].ts
11. match/join/[id].ts
12. match/complete/[id].ts
13. payment/create-order.ts
14. payment/verify.ts
15. profile.ts
16. withdraw.ts
17. withdraw/requests.ts

**Total: 17 functions** ❌ (exceeds 12 limit)

## Fixed Issues

1. ✅ **TypeScript errors fixed:**
   - Removed `username` field (doesn't exist in schema)
   - Fixed `completeMatch` function call signature
   - Added type annotations

2. ✅ **Module resolution:**
   - Created `api/tsconfig.json` for proper path resolution
   - Fixed import paths

## Next Steps

Since we can't have more than 12 functions, we have two options:

### Option 1: Combine into Single Router (Recommended)

Create a single `api/index.ts` that routes to all handlers internally. This reduces to **1 function** total.

### Option 2: Combine Related Routes

Combine related routes:
- `api/auth.ts` - handles signup, login, firebase (3 → 1)
- `api/wallet.ts` - handles wallet, deposit (2 → 1)
- `api/match.ts` - handles all match routes (4 → 1)
- `api/payment.ts` - handles payment routes (2 → 1)
- `api/withdraw.ts` - handles withdraw routes (2 → 1)
- Keep: health, transactions, matches, profile (4)

**Total: 8 functions** ✅

## Current Status

All TypeScript errors are fixed. The deployment will still fail due to function count, but the code is now correct.

To fully fix, we need to implement Option 1 or Option 2 above.

