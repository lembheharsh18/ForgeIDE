<p align="center">
  <h1 align="center">⚡ FORGE IDE</h1>
  <p align="center">
    <strong>Full-stack Competitive Programming Platform</strong><br/>
    Built for <em>PICT Coders League</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/License-MIT-e8ff5a?style=flat-square" alt="MIT License" />
</p>

---

## 📋 Overview

FORGE IDE is a competitive programming platform designed for PICT Coders League. It provides a full-featured online IDE with real-time code execution, Codeforces integration, contests, and leaderboards — all wrapped in a sleek, modern interface.

## 🛠 Tech Stack

| Layer                | Technology                                          |
| -------------------- | --------------------------------------------------- |
| **Frontend**         | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **Backend**          | Node.js + Express + TypeScript                      |
| **Database**         | PostgreSQL 16 + Prisma ORM                          |
| **Cache**            | Redis 7                                             |
| **Code Execution**   | Piston API (external)                               |
| **Editor**           | CodeMirror 6                                        |
| **State Management** | Zustand + TanStack Query                            |
| **Animations**       | Framer Motion                                       |
| **WebSockets**       | Socket.IO                                           |
| **Fonts**            | Syne + Space Mono                                   |
| **Auth**             | Google OAuth + JWT                                  |
| **Extension**        | Chrome Extension (MV3)                              |

## ✨ Features

- **🖥 Online IDE** — CodeMirror 6 editor with syntax highlighting for C++, Python, Java, JavaScript, and Go
- **⚡ Code Execution** — Real-time code execution via Piston API
- **🏆 Contests** — Create and participate in timed programming contests
- **📊 Leaderboards** — Live rankings with real-time updates via WebSockets
- **🔗 Codeforces Integration** — Parse problems and submit solutions via browser extension
- **🌗 Theming** — Dark/Light mode with smooth transitions
- **🔒 Authentication** — Google OAuth with JWT token management
- **📱 Responsive** — Works seamlessly across desktop and tablet

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/forge-ide.git
cd forge-ide && npm install

# 2. Set up environment
cp .env.example .env  # Edit with your credentials

# 3. Start development
docker compose up -d postgres redis   # Start databases
npm run dev                            # Start all apps
```

The client runs at `http://localhost:3000` and the server at `http://localhost:4000`.

## 🏗 Architecture

```
forge-ide/
├── apps/
│   ├── client/          → Next.js 14 frontend
│   └── server/          → Express + TypeScript API
├── extension/           → Chrome Extension (MV3)
├── packages/
│   └── shared/          → Shared types, enums, Zod schemas
├── docker-compose.yml   → PostgreSQL + Redis + app services
├── .github/workflows/   → CI pipeline (lint, typecheck, test, build)
└── .env.example         → Environment variable template
```

## 📦 Modules

### `apps/client` — Frontend

Next.js 14 application with App Router, Tailwind CSS, and a comprehensive design system. Features Syne + Space Mono fonts, dark/light theming, and Framer Motion animations.

### `apps/server` — Backend API

Express server with TypeScript strict mode, Prisma ORM for database operations, Redis caching, Socket.IO for real-time features, and BullMQ for job queues.

### `packages/shared` — Shared Package

TypeScript types, enums (Verdict, Language, Platform, Role), and Zod validation schemas shared between client and server.

### `extension/` — Chrome Extension

Manifest V3 Chrome extension for Codeforces integration. Parses problem data from CF pages and enables direct submission from Forge IDE.

## 🧪 Development

```bash
# Run individual apps
npm run dev:client     # Next.js dev server (port 3000)
npm run dev:server     # Express dev server (port 4000)

# Code quality
npm run lint           # ESLint across all workspaces
npm run typecheck      # TypeScript type checking
npm run test           # Run test suites
npm run format         # Prettier formatting

# Database
npm run prisma:migrate -w apps/server   # Run migrations
npm run prisma:studio -w apps/server    # Open Prisma Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ⚡ by <strong>PICT Coders League</strong>
</p>
"# ForgeIDE"
