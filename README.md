# ⚡ Forge IDE

![CI Status](https://github.com/your-username/forge-ide/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)

> Competitive programming platform tailored for algorithmic coders.
> Write, run, and debug solutions in your browser with real-time feedback.

---

## ✨ Features

- **Multi-language IDE** — First-class support for C++17, Python 3, Java, JavaScript, and Go.
- **RC Interactor** — Live interactive problem simulator to test interactive Codeforces problems locally without penalties.
- **Codeforces Integration** — Direct problem imports and one-click submissions via the official CF API.
- **Test Case Extractor** — Automatically pulls sample test cases from Codeforces problems into the IDE.
- **Club Portal** — Comprehensive dashboard with a real-time leaderboard, contest manager, and problem archive.
- **Chrome Extension** — One-click redirect from any Codeforces problem page directly into the Forge IDE.
- **Stunning UI/UX** — Dark and light themes with smooth Framer Motion transitions and glitch aesthetics.

---

## 🛠 Tech Stack

| Component     | Technology                         | Description                                                                |
| ------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| **Frontend**  | Next.js 14, React 18, Tailwind CSS | Client-side application with App Router and Zustand state management.      |
| **Backend**   | Node.js, Express, TypeScript       | REST API and WebSocket server for real-time interactions.                  |
| **Database**  | PostgreSQL 16, Prisma ORM          | Persistent storage for users, problems, submissions, and leaderboards.     |
| **Cache**     | Redis 7                            | Caching for API responses, rate limiting, and RC session state management. |
| **Execution** | Piston API                         | Sandboxed, high-performance code execution engine.                         |
| **Extension** | Chrome Manifest V3                 | Browser extension for seamless Codeforces integration.                     |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/forge-ide.git
   cd forge-ide
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` to include your specific configuration details (e.g., JWT secrets)._

3. **Start the application:**

   ```bash
   docker compose up --build
   ```

4. **Access the platform:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Admin Access:** Use the seeded admin account to access the club portal and admin dashboard.
>
> - **Email:** admin@forge.dev
> - **Password:** Admin@1234

---

## 🏗 Architecture

The Forge IDE operates on a robust full-stack architecture:

- **Next.js Frontend:** Delivers a fast, interactive UI using the App Router, communicating with the backend via REST and WebSockets.
- **Express Backend:** Handles business logic, authentication, and external API integrations.
- **PostgreSQL & Redis:** PostgreSQL provides durable data storage managed by Prisma, while Redis handles ephemeral state (like RC Interactor sessions) and high-speed caching.
- **Piston API Engine:** Safely executes user code in isolated containers, supporting multiple languages with strict time and memory constraints.
- **Socket.io:** Powers the real-time, turn-based communication necessary for the RC Interactor.

---

## 📁 Project Structure

```text
forge-ide/
├── apps/
│   ├── client/          # Next.js 14 frontend application
│   └── server/          # Express.js backend application
├── packages/
│   └── shared/          # Shared TypeScript types and utilities
├── extension/           # Chrome extension source code
├── docker-compose.yml   # Local development orchestration
└── package.json         # Root workspace configuration
```

---

## 🔧 Environment Variables

| Variable              | Description                  | Default / Example                                          |
| --------------------- | ---------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | `postgresql://forge:forge_secret@localhost:5432/forge_ide` |
| `REDIS_URL`           | Redis connection string      | `redis://localhost:6379`                                   |
| `JWT_SECRET`          | Secret for access tokens     | _Must be 32+ characters_                                   |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens    | _Must be 32+ characters_                                   |
| `PISTON_URL`          | Execution engine API URL     | `https://emkc.org/api/v2/piston`                           |
| `NEXT_PUBLIC_API_URL` | Backend REST API URL         | `http://localhost:4000`                                    |
| `NEXT_PUBLIC_WS_URL`  | Backend WebSocket URL        | `ws://localhost:4000`                                      |

---

## 🧩 Chrome Extension

The Forge Chrome Extension adds a "Solve in Forge" button to Codeforces problem pages.

**To install locally:**

1. Navigate to the extension directory:
   ```bash
   cd extension
   npm install
   npm run build
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/dist` directory.

---

## 🚢 Deployment

Forge IDE is designed for modern cloud deployment:

- **Frontend (Vercel):** Connect the repository to Vercel, set the root directory to `apps/client`, and configure the `NEXT_PUBLIC_*` environment variables.
- **Backend (Railway):** Import the repository to Railway, set the root directory to `apps/server`, and use the provided `Dockerfile` or `railway.json` configuration.
- **Database (Railway):** Provision a PostgreSQL instance on Railway and link it to the backend.
- **Redis (Railway):** Provision a Redis instance on Railway and link it to the backend.

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
