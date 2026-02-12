# Realtime Self-Destruct Chat

Temporary, secure, real-time chat rooms that automatically delete all data after **10 minutes**.

Built with **Next.js 16**, **Elysia**, **Upstash Redis**, and **Upstash Realtime**.

---

## ✨ Features

- ⚡ Real-time messaging
- 🔐 Room-based chat system
- ⏳ Automatic self-destruction (10 minute TTL)
- 🗄️ Redis-backed storage
- 📡 WebSocket event broadcasting
- 🧠 Fully typed with TypeScript + Zod
- 🎨 Clean Tailwind UI

---

## 🏗 Tech Stack

### Frontend
- Next.js (App Router)
- React 19
- TailwindCSS
- TanStack React Query

### Backend
- Elysia
- Upstash Redis
- Upstash Realtime
- NanoID
- Zod

---

## 🧠 How It Works

1. A room is created with a unique `roomId`.
2. Redis stores room metadata with a **10-minute TTL**.
3. Messages are stored under `messages:{roomId}`.
4. When TTL expires:
   - All room data is automatically deleted.
   - Clients receive a `chat.destroy` event.
   - Users are redirected.

No manual cleanup required.

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

UPSTASH_REALTIME_REST_URL=
UPSTASH_REALTIME_REST_TOKEN=


## 🚀 Installation 
npm install

## Run development server:
npm run dev

## Open in browser:
http://localhost:3000

## 📡 API Overview
POST   /api/room/create
GET    /api/room/ttl?roomId=...
POST   /api/messages?roomId=...
GET    /api/messages?roomId=...
DELETE /api/messages?roomId=...


## 🛠 Build
npm run build
npm start


## 💡 Author
 -Built as a learning project to explore:
 -Real-time systems
 -Redis TTL-based auto-cleanup
 -Event-driven architecture
 -Full-stack Next.js setup