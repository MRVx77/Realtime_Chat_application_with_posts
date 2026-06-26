# Real-Time Chat & Discussion Board Platform

A full-stack, real-time discussion and direct messaging platform built with Next.js, Express, PostgreSQL, Socket.io, Clerk, and Cloudinary. 

This repository is structured as a monorepo containing:
- **`backend`**: Node.js/TypeScript Express server utilizing PostgreSQL and Socket.io for real-time events.
- **`frontend`**: Next.js (App Router) client with TailwindCSS and responsive UI components.

---

## 🚀 Features

### 💬 Real-Time Chat (Direct Messages)
- **Instant Messaging**: Real-time peer-to-peer chat powered by Socket.io.
- **Online Presence**: Dynamic online user count and status indicators based on active connections.
- **Media Support**: Send text messages or upload images (managed through Cloudinary).
- **Chat History**: Infinite or paginated conversation history stored in PostgreSQL.

### 📌 Discussion Threads
- **Categorized Forums**: Default categories including *General*, *Q&A*, *Showcase*, and *Help*.
- **Interactive Threads**: Users can post threads, reply to discussions, and like/react to posts.
- **Dynamic Updates**: Real-time comment addition and reaction increments.

### 🔔 Global Notifications
- **Real-Time Alerts**: Receive instant notifications when other users reply to your threads or like your posts.
- **Unread Counters**: Dynamic tracking of read/unread system notifications.

### 👤 Profile Management & Auth
- **Secure Authentication**: Clerk-powered user signup, login, and session protection.
- **Customizable Profiles**: Update display names, bios, unique handles, and upload avatars.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: TailwindCSS v4
- **Real-Time Communication**: Socket.io Client
- **Authentication**: Clerk React/Next SDK
- **Forms & Validation**: React Hook Form, Zod
- **UI Components**: Radix UI, Lucide Icons, Sonner (for toast alerts)
- **API Client**: Axios

### Backend
- **Runtime & Language**: Node.js with TypeScript (`tsx` watch runner)
- **Framework**: Express.js
- **Database Connection**: PostgreSQL (using the `pg` client pool)
- **Real-Time Server**: Socket.io
- **Auth Middleware**: Clerk Express SDK
- **Media Handler**: Multer & Cloudinary
- **Logging**: Winston Logger

### Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostgreSQL 16 (Alpine-based container)

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/       # Configurations (clerk, cloudinary, zod env validator)
│   │   ├── db/           # pg client initialization and migration scripts
│   │   ├── lib/          # Utilities (errors, winston logger)
│   │   ├── middleware/   # Express middlewares (error handlers, multer)
│   │   ├── migrations/   # SQL raw schema migrations
│   │   ├── modules/      # Backend domain logic (chat, notifications, threads, users)
│   │   ├── realtime/     # Socket.io connection logic and event handlers
│   │   ├── routes/       # Express route handlers
│   │   ├── app.ts        # App instantiation
│   │   └── server.ts     # Entrypoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js Pages (chat, notifications, profile, sign-in, threads)
│   │   ├── components/   # Shared UI components (header, buttons, dialogs)
│   │   ├── hooks/        # Custom hooks (e.g. useSocket, API hooks)
│   │   ├── lib/          # Shared utility functions
│   │   └── types/        # TypeScript declarations
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml    # Runs Postgres container
└── README.md             # Project documentation
```

---

## 🗄️ Database Schema

The database consists of the following key tables:

| Table | Description |
| :--- | :--- |
| `users` | Syncs with Clerk authentication to store user metadata (`display_name`, `handle`, `avatar_url`, `bio`). |
| `categories` | Discussion categories (`general`, `q-and-a`, `showcase`, `help`). |
| `threads` | Main posts created by users belonging to a specific category. |
| `replies` | Thread comments/replies linked to a thread and an author. |
| `thread_reactions` | Unique user likes/reactions on threads. |
| `notifications` | System-wide alerts for `reply_on_thread` and `like_on_thread` events. |
| `direct_messages` | Private direct messages between two users with optional images. |

---

## ⚙️ Environment Variables

### Backend Configuration
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=6450
DB_NAME=realtime_chat_and_thread_app
DB_USER=postgres
DB_PASSWORD=postgres

# Clerk API Keys
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Configuration
Create a `.env` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

---

## 🛠️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd Chat-app
```

### 2. Start PostgreSQL Container
Use Docker Compose to launch the database:
```bash
docker compose up -d
```
*Note: This starts PostgreSQL mapping port `5432` inside the container to local port `6450`.*

### 3. Setup and Run the Backend
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy the environment template and fill in your values (Clerk & Cloudinary keys):
   ```bash
   cp .env.example .env # or create manually on Windows
   ```
3. Run migrations to setup database tables:
   ```bash
   npm run migrate
   ```
4. Start the server in watch/development mode:
   ```bash
   npm run dev
   ```
   *The API and WebSocket server will run on `http://localhost:5000`.*

### 4. Setup and Run the Frontend
1. Open a new terminal session, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create your `.env` configuration file.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
