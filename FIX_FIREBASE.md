# Fix Firebase Authentication - Step by Step

## Current Error: "Request failed with status code 500"

This means Firebase is working, but the backend is failing when syncing the user. Follow these steps:

## Step 1: Run Database Migration

The database schema needs to be updated to allow `passwordHash` to be optional:

```bash
# In the root directory (not client folder)
npx prisma migrate dev --name make_password_hash_optional
```

If you get an error, try:
```bash
npx prisma db push
```

## Step 2: Restart Backend Server

After running the migration, restart your backend server:
1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`

## Step 3: Test Again

Try creating an account again. The error should be fixed.

## Alternative: If Migration Fails

If the migration doesn't work, you can manually update the database:

1. Open your database (PostgreSQL)
2. Run this SQL:
```sql
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
```

## Check Backend Logs

When you try to sign up, check your backend terminal for error messages. The improved error handling will show you exactly what's wrong.

## Common Issues:

1. **Database not migrated**: Run `npx prisma migrate dev`
2. **Backend not running**: Make sure backend is running on port 3000
3. **Database connection issue**: Check your `.env` file has correct `DATABASE_URL`
4. **Prisma client not regenerated**: Run `npx prisma generate`

## Still Not Working?

Check the backend console for detailed error messages. The updated code now provides better error logging.

