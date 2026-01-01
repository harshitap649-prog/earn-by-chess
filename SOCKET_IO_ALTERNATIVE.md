# Socket.io Alternative for Vercel

Since **Socket.io cannot work with Vercel serverless functions**, you need an alternative solution for real-time features.

## 🎯 Recommended Solution: Deploy Socket.io Separately

Deploy a lightweight Socket.io server on **Render** (free) or **Railway**, and keep your REST API on Vercel.

### Quick Setup on Render

1. **Create a new file `socket-server.ts`** in your project root:

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initGameSocket } from './sockets/gameSocket';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

initGameSocket(io);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
```

2. **Create `socket-package.json`** (or use your existing one):

```json
{
  "name": "socket-server",
  "version": "1.0.0",
  "main": "socket-server.ts",
  "scripts": {
    "start": "tsx socket-server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17"
  }
}
```

3. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - New → **Web Service**
   - Connect GitHub repo
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start` (or `tsx socket-server.ts`)
   - **Environment Variables:**
     ```
     DATABASE_URL=your_database_url
     CORS_ORIGIN=https://your-site.vercel.app
     PORT=3001
     ```
   - Deploy

4. **Update Frontend:**
   - In Vercel, add environment variable:
     ```
     VITE_SOCKET_URL=https://your-socket-server.onrender.com
     ```
   - The frontend will automatically use this URL for Socket.io connections

## 🔄 Alternative: HTTP Polling

If you don't want a separate server, you can replace Socket.io with HTTP polling:

### Implementation

1. **Create polling service** (`client/src/services/polling.ts`):

```typescript
class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startPolling(
    matchId: string,
    callback: (data: any) => void,
    interval = 2000
  ) {
    const poll = async () => {
      try {
        const response = await fetch(`/api/match/${matchId}`);
        const data = await response.json();
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll(); // Immediate call
    const intervalId = setInterval(poll, interval);
    this.intervals.set(matchId, intervalId);
  }

  stopPolling(matchId: string) {
    const interval = this.intervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(matchId);
    }
  }
}

export const pollingService = new PollingService();
```

2. **Update Game component** to use polling instead of Socket.io:

```typescript
import { pollingService } from '../services/polling';

// Replace socket.on('chess-move') with:
pollingService.startPolling(matchId, (matchData) => {
  // Update game state
  setGameState(matchData.gameState);
});

// Replace socket.emit('chess-move') with:
await fetch(`/api/match/${matchId}/move`, {
  method: 'POST',
  body: JSON.stringify({ move }),
});
```

## 🚀 Option 3: Use Real-time Service

Use a managed service like **Pusher** or **Ably**:

### Pusher Setup

1. Sign up at [pusher.com](https://pusher.com) (free tier available)
2. Install: `npm install pusher-js`
3. Replace Socket.io code with Pusher:

```typescript
import Pusher from 'pusher-js';

const pusher = new Pusher('your-app-key', {
  cluster: 'your-cluster',
});

const channel = pusher.subscribe(`match-${matchId}`);
channel.bind('chess-move', (data: any) => {
  // Handle move
});
```

## 📊 Comparison

| Solution | Pros | Cons |
|----------|------|------|
| **Separate Socket.io Server** | ✅ Full Socket.io features<br>✅ Low latency<br>✅ Real-time | ⚠️ Requires separate deployment<br>⚠️ Additional cost (free tier available) |
| **HTTP Polling** | ✅ Simple<br>✅ No extra server<br>✅ Works everywhere | ❌ Higher latency<br>❌ More server requests<br>❌ Less efficient |
| **Pusher/Ably** | ✅ Managed service<br>✅ Scales automatically<br>✅ Easy setup | ⚠️ Free tier limits<br>⚠️ External dependency |

## 🎯 Recommendation

**For production:** Use **Separate Socket.io Server on Render** - it's free, gives you full control, and maintains all real-time features.

**For quick testing:** Use **HTTP Polling** - simpler but less efficient.

