# Monorepo Documentation

## Tech Stack

### Frontend

- **Next.js**
- **Expo** (TODO)
- **ShadCN UI**

### Backend

- **Hono.js** (deployed with Cloudflare Workers)
- **Neon** (database)

### Tooling

- **Biome** (linter & formatter)
- **Bun** (package manager & runtime)
- **Turbo Repo** (monorepo management)

## Prerequisites

Before starting, ensure you have the following installed:

- **Bun** (preferred package manager)
- **Git**
- **Docker** (if applicable)
- **System dependencies** (varies per package; see specific package README files)

### Install Required Tools

```sh
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Repository Setup

1. **Clone the repository:**
   ```sh
   git clone git@github.com:your-org/monorepo.git
   cd monorepo
   ```
2. **Install dependencies:**
   ```sh
   bun install
   ```
3. **Verify the setup:**
   ```sh
   bun run check-deps
   ```

### Running the Project

To start development, run the appropriate package:

```sh
bun run <script>
```

Example:

```sh
bun run web
```

### Useful Scripts

```json
"scripts": {
    "ui": "bun run --cwd packages/ui ui",
    "web": "bun run --cwd ./apps/next dev",
    "api": "bun run --cwd ./packages/api dev",
    "format": "bun x @biomejs/biome format --write ./packages ./apps",
    "lint": "bun x @biomejs/biome lint ./packages ./apps",
    "fix": "bun x @biomejs/biome check --write --unsafe ./packages ./apps",
    "turbo:dev": "turbo dev",
    "turbo:lint": "turbo lint",
    "turbo:format": "turbo format",
    "turbo:build": "turbo build",
    "check-deps": "check-dependency-version-consistency ."
}
```

### Building Packages

```sh
bun run turbo:build
```

## Code Conventions

### Linting & Formatting

We use Biome to enforce consistent code style.

```sh
bun run lint
bun run format
```

## Environment Variables

Each package requires specific environment variables. Ensure these are set up correctly.

### Essential Environment Variables

#### `packages/api/.dev.vars.example`

```
DATABASE_URL=
ENV=
JWT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_WEB_CLIENT_ID=
APPLE_PRIVATE_KEY=
APPLE_TEAM_ID=
APPLE_KEY_ID=
API_DOMAIN=
WEB_DOMAIN=
BETTER_AUTH_SECRET=
API_VERSION=v1
RATE_LIMITER=5
```

#### `apps/next/.env.example`

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=

API_URL=
```

## Troubleshooting

### Common Issues

**Issue:** Dependency installation fails.

- **Solution:** Try running:
  ```sh
  rm -rf node_modules && bun install
  ```

---

*Last updated: 2025-02-09*

