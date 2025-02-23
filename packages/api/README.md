# API Project Setup Guide

## Index

1. [Running the Development Server](#running-the-development-server)
2. [Environment Variables](#environment-variables)
3. [Auth Configuration](#auth-configuration)
4. [Adding New Environment Variables](#adding-new-environment-variables)
5. [Deployment](#deployment)

---

## Running the Development Server

To start the development server, run:

```bash
bun dev
```

Ensure your setup is correct by following the steps below.

---

## Environment Variables

1. **Fill Out `.dev.vars`**:
   - Ensure all required fields in the `.dev.vars` file are filled out completely.

2. **Initialization**:
   - If you need to use environment variables outside the Hono app, initialize the configuration using `dotenv` and specify the `.dev.vars` path:
     ```typescript
     import dotenv from 'dotenv';
     dotenv.config({ path: '.dev.vars' });
     ```

3. **Accessing Environment Variables Within Hono**:
   - Use `env(c).ENV_VAR_NAME` to access environment variables.
   - To set environment variables within the `c` (context) object, use `c.set("NAME", value)`. Ensure to pass `c` to any functions that require these variables.

## Auth Configuration

1. **Setup Client ID and Secret**:
   - Provide the **Client ID** and **Client Secret** for authentication in your `.dev.vars` file.

2. **Supported Clients**:
   - Currently tested with Google and GitHub clients.

3. **Adding Additional Clients**:
   - Update the `.dev.vars` file with the new client’s credentials.
   - Modify your authentication logic to support the new client.

4. **OAuth Client Provider**:
   - Main app should be hosted at `http://localhost:8787`.
   - Authorization Callback URL should be `http://localhost:8787/api/auth/callback/github` or `[example-domain]/api/auth/callback/github`.

---

## Adding New Environment Variables

1. **Updating `.dev.vars`**:
   - Add the new variable directly to the `.dev.vars` file.

2. **Using Variables Outside Hono**:
   - Ensure the configuration is initialized using `dotenv` as described above.

3. **Using Variables Within Hono**:
   - Set the variable within the `c` (context) object:
     ```typescript
     c.set('NEW_VAR_NAME', process.env.NEW_VAR_NAME);
     ```
   - Pass the context (`c`) to any functions requiring access to the variable.

---

## Deployment

To deploy your API to Cloudflare Workers, run:

```bash
bun run deploy
```

Ensure you have a Cloudflare account and are signed in through the CLI. Within the settings of the Cloudflare Worker, copy your `.dev.vars` to the environment settings. Make sure `ENV` is set to `production`.

It is recommended to host your API and frontend on the same domain in production, e.g., `api.example.com` and `frontend-app.example.com`.
