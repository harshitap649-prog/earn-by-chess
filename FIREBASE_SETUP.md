# Firebase Authentication Setup

Firebase Authentication has been successfully integrated into your Chess Earning Site!

## What's Been Done

1. ✅ Firebase SDK installed and configured
2. ✅ Firebase Authentication integrated with login/signup
3. ✅ Backend endpoint created to sync Firebase users with database
4. ✅ AuthContext updated to use Firebase Auth
5. ✅ Error handling updated for Firebase errors

## Setup Steps

### 1. Install Firebase Package

In the `client` folder, run:
```bash
cd client
npm install
```

This will install the `firebase` package that was added to `package.json`.

### 2. Database Migration

Since we made `passwordHash` optional in the User model, you need to run a migration:

```bash
# In the root directory
npx prisma migrate dev --name make_password_hash_optional
```

### 3. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **earnbychess**
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Click **Save**

## How It Works

1. **User Signs Up/Logs In**: Uses Firebase Authentication
2. **Firebase Creates User**: User is created in Firebase Auth
3. **Backend Sync**: Frontend calls `/auth/firebase` endpoint to sync user with your database
4. **JWT Token**: Backend generates a JWT token for API access
5. **Session**: User is logged in and can access protected routes

## Features

- ✅ Email/Password authentication via Firebase
- ✅ Automatic user sync with backend database
- ✅ Secure token-based authentication
- ✅ Persistent sessions (users stay logged in)
- ✅ Error handling for Firebase-specific errors

## Testing

1. Start the backend: `npm run dev` (in root)
2. Start the frontend: `cd client && npm run dev`
3. Go to http://localhost:5173
4. Try signing up with a new email
5. Try logging in with the same credentials

## Firebase Configuration

The Firebase config is in `client/src/config/firebase.ts` with your project credentials:
- Project ID: earnbychess
- Auth Domain: earnbychess.firebaseapp.com

## Notes

- Firebase users don't need passwords stored in your database
- The `passwordHash` field is now optional in the User model
- Firebase UID is used as the user ID in your database
- Users are automatically created in your database when they sign up via Firebase

## Troubleshooting

**"Firebase: Error (auth/email-already-in-use)"**
- User already exists in Firebase, try logging in instead

**"Firebase: Error (auth/invalid-email)"**
- Check email format

**"Firebase: Error (auth/weak-password)"**
- Password must be at least 6 characters

**Backend sync fails:**
- Make sure backend is running
- Check that database migration was run
- Verify `/auth/firebase` endpoint is accessible

