# Quick Setup Guide

Follow these steps to get your Chess Earning Site up and running:

## 1. Database Setup

1. Install PostgreSQL if you haven't already
2. Create a new database:
```sql
CREATE DATABASE earning_site;
```

## 2. Backend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/earning_site?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-this-to-a-random-secret-key
MIN_WITHDRAW=100
```

3. **Initialize database:**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Start backend:**
```bash
npm run dev
```

Backend should now be running on `http://localhost:3000`

## 3. Frontend Setup

1. **Navigate to client folder:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start frontend:**
```bash
npm run dev
```

Frontend should now be running on `http://localhost:5173`

## 4. Test the Application

1. Open `http://localhost:5173` in your browser
2. Create a new account
3. You'll start with ₹0 balance
4. To test matches, you can:
   - Add money manually to the database, OR
   - Create a test user with initial balance

## Adding Test Balance (Optional)

To add test balance for development, you can run this in Prisma Studio:
```bash
npx prisma studio
```

Then manually update a user's wallet balance, or use SQL:
```sql
-- First, get a user ID from the users table
-- Then update their wallet:
UPDATE "Wallet" SET balance = 1000 WHERE "userId" = 'user-id-here';
```

## Troubleshooting

- **Database connection error**: Check your DATABASE_URL in `.env`
- **Port already in use**: Change PORT in `.env` or kill the process using that port
- **CORS errors**: Make sure CORS_ORIGIN matches your frontend URL
- **Socket.io connection failed**: Check that backend is running and CORS is configured correctly

## Next Steps

- Set up KYC verification for withdrawals
- Add payment gateway integration for deposits
- Implement admin panel for managing matches and users
- Add email notifications
- Set up proper error logging and monitoring

