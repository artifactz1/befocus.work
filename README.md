# BeFocus.Work

![image](https://github.com/user-attachments/assets/010b2bf4-4600-4ae0-8871-688639192f02)

> A modern productivity application with Pomodoro timer, focus tracking, and goal management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

BeFocus.Work is a comprehensive productivity application designed to help users maintain focus and achieve their goals through proven techniques like the Pomodoro Technique. Built as a modern monorepo with TypeScript, it provides a seamless experience across web platforms.

## Features

- 🍅 **Pomodoro Timer** - Customizable focus and break intervals
- 📊 **Focus Tracking** - Monitor your productivity sessions
- 🎯 **Goal Management** - Set and track your objectives
- 🔐 **Authentication** - Secure user accounts with multiple providers
- 🎨 **Modern UI** - Beautiful, responsive interface with dark/light themes
- ☁️ **Cloud Sync** - Your data synced across devices

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Modern component library
- **Zustand** - State management
- **Framer Motion** - Animations and transitions

### Backend
- **Hono.js** - Fast web framework for Cloudflare Workers
- **Neon Database** - Serverless PostgreSQL
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication system
- **Zod** - Schema validation

### Tooling
- **Bun** - Package manager and runtime
- **Turbo Repo** - Monorepo management
- **Biome** - Fast linter and formatter
- **Cloudflare Workers** - Edge deployment

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** >= 18
- **Bun** >= 1.1.20 (recommended) or npm
- **Git**

### Install Bun (Recommended)

```bash
curl -fsSL https://bun.sh/install | bash
# Restart your terminal
bun --version
```

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/befocus.work.git
   cd befocus.work
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy environment files
   cp packages/api/.dev.vars.example packages/api/.dev.vars
   cp apps/next/.env.example apps/next/.env.local
   ```

4. **Start development servers:**
   ```bash
   # Start all services
   bun run turbo:dev
   
   # Or start individually
   bun run web    # Next.js app (http://localhost:3000)
   bun run api    # API server (http://localhost:8787)
   ```

## Project Structure

```
befocus.work/
├── apps/
│   └── next/                 # Next.js web application
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── components/   # React components
│       │   ├── hooks/        # Custom hooks
│       │   ├── lib/          # Utility functions
│       │   └── store/        # Zustand stores
│       └── package.json
├── packages/
│   ├── api/                  # Hono.js API server
│   │   ├── src/
│   │   │   ├── db/           # Database schema & migrations
│   │   │   ├── routes/       # API routes
│   │   │   └── lib/          # Shared utilities
│   │   └── package.json
│   ├── ui/                   # Shared UI components
│   ├── types/                # Shared TypeScript types
│   ├── app/                  # Shared app logic
│   └── typescript-config/    # Shared TypeScript configs
├── turbo.json               # Turbo configuration
├── package.json             # Root package.json
└── README.md               # This file
```

## Development

### Running the Project

Start all services in development mode:

```bash
bun run turbo:dev
```

Or run services individually:

```bash
# Web application (Next.js)
bun run web

# API server (Hono.js)
bun run api

# UI development server
bun run ui
```

### Database Operations

```bash
# Generate database migrations
bun run generate

# Apply migrations
cd packages/api && bun run db:migrate

# Push schema changes
cd packages/api && bun run db:push

# Open database studio
cd packages/api && bun run db:studio

# Seed development data
cd packages/api && bun run db:seed
```

### Code Quality

```bash
# Lint all packages
bun run turbo:lint

# Format code
bun run turbo:format

# Type checking
bun run check

# Fix all issues
bun run fix:check
```

## Environment Variables

### API Package (`packages/api/.dev.vars`)

```env
DATABASE_URL=your_neon_database_url
ENV=development
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_WEB_CLIENT_ID=your_apple_web_client_id
APPLE_PRIVATE_KEY=your_apple_private_key
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
API_DOMAIN=http://localhost:8787
WEB_DOMAIN=http://localhost:3000
BETTER_AUTH_SECRET=your_auth_secret
API_VERSION=v1
RATE_LIMITER=5
```

### Next.js App (`apps/next/.env.local`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8787
API_URL=http://localhost:8787
```

## Scripts

### Root Level Scripts

| Script | Description |
|--------|-------------|
| `bun run web` | Start Next.js development server |
| `bun run api` | Start API development server |
| `bun run ui` | Start UI development server |
| `bun run turbo:dev` | Start all services in development |
| `bun run turbo:build` | Build all packages |
| `bun run turbo:lint` | Lint all packages |
| `bun run turbo:format` | Format all packages |
| `bun run check-deps` | Check dependency consistency |
| `bun run clean` | Clean all build artifacts |

### Package-Specific Scripts

Navigate to the specific package directory and run:

```bash
# In apps/next/
bun run dev          # Start Next.js dev server
bun run build        # Build Next.js app
bun run start        # Start production server

# In packages/api/
bun run dev          # Start API dev server with hot reload
bun run deploy       # Deploy to Cloudflare Workers
bun run db:studio    # Open database management UI
```

## Deployment

### API Deployment (Cloudflare Workers)

1. **Configure Cloudflare:**
   ```bash
   cd packages/api
   bunx wrangler login
   ```

2. **Set production environment variables:**
   ```bash
   bunx wrangler secret put DATABASE_URL
   bunx wrangler secret put JWT_SECRET
   # ... add other secrets
   ```

3. **Deploy:**
   ```bash
   bun run deploy
   ```

### Web App Deployment

The Next.js app can be deployed to various platforms:

- **Vercel:** `npx vercel --prod`
- **Netlify:** Build command: `bun run build`, Publish directory: `apps/next/.next`
- **Docker:** Use the included Dockerfile

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all checks pass before submitting PR

## Troubleshooting

### Common Issues

**Issue:** `bun install` fails with dependency conflicts

**Solution:**
```bash
rm -rf node_modules bun.lockb
bun install
```

**Issue:** Database connection errors

**Solution:**
1. Verify your `DATABASE_URL` in environment variables
2. Check if Neon database is running
3. Run migrations: `cd packages/api && bun run db:migrate`

**Issue:** TypeScript errors after updates

**Solution:**
```bash
# Clean and rebuild
bun run clean
bun install
bun run turbo:build
```

**Issue:** Hot reload not working

**Solution:**
```bash
# Restart development servers
bun run turbo:dev
```

### Getting Help

- 📖 **Documentation:** Check package-specific README files
- 🐛 **Bug Reports:** Open an issue on GitHub
- 💬 **Questions:** Start a discussion on GitHub

---

**License:** MIT  
**Last Updated:** January 2025

---

> Built with ❤️ for productivity enthusiasts

