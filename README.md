# Chess Earning Site

A complete chess earning platform where users can play chess matches with entry fees. Players pay ₹10 to enter, and the winner gets ₹18 (₹2 profit for the platform).

## Features

- **User Authentication**: Signup/Login with JWT tokens
- **Wallet System**: Balance tracking with locked balance for active matches
- **Chess Gameplay**: Full chess game with real-time moves via Socket.io
- **Match System**: Create and join matches with ₹10 entry fee
- **Prize Distribution**: Winner gets ₹18, platform keeps ₹2 profit
- **Transaction History**: Track all earnings and losses
- **Real-time Updates**: Live game moves and match status

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM (PostgreSQL)
- Socket.io for real-time communication
- JWT authentication
- bcryptjs for password hashing

**Frontend:**
- React + TypeScript
- Vite
- Socket.io Client
- Chess.js for game logic
- React Router

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- npm or yarn

### Backend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/earning_site?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MIN_WITHDRAW=100
```

3. **Set up the database:**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Run the backend server:**
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to client directory:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## How It Works

1. **User Registration**: Users sign up and get a wallet with ₹0 balance
2. **Create/Join Match**: Users can create or join matches with ₹10 entry fee
3. **Gameplay**: Two players play chess in real-time
4. **Prize Distribution**:
   - Winner receives ₹18 (their ₹10 back + ₹8 from opponent)
   - Platform keeps ₹2 as profit
   - Loser loses their ₹10 entry fee
   - Draw: Both players get their ₹10 refunded

## API Endpoints

### Auth
- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login and get JWT token

### Wallet
- `GET /wallet` - Get wallet balance (requires auth)
- `GET /transactions` - Get transaction history (requires auth)

### Matches
- `POST /match/create` - Create a new match (default ₹10 entry, requires auth)
- `POST /match/join/:id` - Join an existing match (requires auth)
- `GET /matches` - List available matches
- `GET /match/:id` - Get match details (requires auth)
- `POST /match/complete/:id` - Complete a match (requires auth)

### Withdrawals
- `POST /withdraw` - Request a withdrawal (requires auth, KYC verified)

## Socket Events

### Client → Server
- `join-match` - Join a match room
- `chess-move` - Send a chess move
- `game-over` - Notify game end

### Server → Client
- `player-joined` - Another player joined
- `chess-move` - Receive opponent's move
- `game-over` - Game ended
- `match-completed` - Match completed and prizes distributed

## Project Structure

```
.
├── server.ts              # Main Express server
├── config.ts              # Configuration
├── db.ts                  # Prisma client
├── middleware/            # Auth and other middleware
├── services/              # Business logic (match, wallet)
├── sockets/               # Socket.io handlers
├── prisma/
│   └── schema.prisma      # Database schema
└── client/                # React frontend
    ├── src/
    │   ├── pages/         # Page components
    │   ├── components/    # Reusable components
    │   ├── contexts/      # React contexts
    │   └── services/      # API services
    └── package.json
```

## Development

- Backend runs on port 3000
- Frontend runs on port 5173 (Vite dev server)
- Frontend proxies API requests to backend via Vite config

## Production Build

**Backend:**
```bash
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
# Serve the dist folder with a static server
```

## Notes

- Entry fee is fixed at ₹10 per player
- Winner prize is ₹18 (₹20 total pool - ₹2 profit)
- Platform profit is automatically deducted
- Draws result in full refunds for both players
- Users need sufficient balance to create/join matches

