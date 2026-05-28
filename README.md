<div align="center">

# ZFlix

### Movie tracker, media discovery app, and subscription platform.

ZFlix is a full-stack hobby project with a Netflix-inspired architecture for browsing movies,
series, and channels, tracking user activity, managing profiles, saving bookmarks, and handling
subscription/payment flows from a shared monorepo.

<br />

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![PayPal](https://img.shields.io/badge/PayPal-003087?style=for-the-badge&logo=paypal&logoColor=white)

</div>

---

## About

ZFlix is built as a JavaScript/TypeScript monorepo inspired by Netflix-style product architecture:

- `packages/app`: Expo + React Native app with web, Android, and iOS targets.
- `packages/server`: Node.js + Express backend service with Sequelize models, migrations, Redis caching, auth, media routes, payments, and subscription management.

The app uses a backend API for accounts, profiles, bookmarks, plans, media data, channel data,
payment checkout, billing webhooks, and subscription state. The web build can be deployed to GitHub
Pages, while the API is designed to run on Render or any Node hosting service.

## Features

- Movie, series, and channel discovery.
- User authentication and profile management.
- Bookmarks, watch activity, and personalized app data.
- TMDB-powered metadata flows.
- Redis-backed cache layer.
- Sequelize/MySQL persistence.
- Backend service for Stripe and PayPal payments, billing webhooks, and subscription flows.
- Expo web export for static hosting.

## Project Structure

```text
.
+-- packages
|   +-- app       # Expo / React Native client
|   +-- server    # Express API server
+-- .github       # GitHub Actions workflows
+-- render.yaml   # Render backend deployment blueprint
+-- package.json  # Root workspace scripts
```

## Requirements

- Node.js 22+
- npm
- MySQL database
- Redis server
- TMDB API token/key
- Optional: Stripe, PayPal, SMTP, and media-service credentials

## Environment Setup

Create local env files from the examples:

```bash
cp packages/app/.env.example packages/app/.env
cp packages/server/.env.example packages/server/.env
```

On Windows PowerShell:

```powershell
Copy-Item packages/app/.env.example packages/app/.env
Copy-Item packages/server/.env.example packages/server/.env
```

Important env rule:

- `packages/server/.env` contains private runtime secrets.
- `packages/app/.env` only uses `EXPO_PUBLIC_*` values, which are bundled into web/native builds and are public.

Never put database passwords, Redis URLs, JWT private keys, Stripe secrets, PayPal secrets, or mailer passwords in `EXPO_PUBLIC_*` variables.

## Install

```bash
npm install
```

## Cookie Configuration

The API uses HTTP-only cookies for session and refresh tokens. When the API and the frontend run on **different domains** (e.g. Render + GitHub Pages), browsers block cookies unless `SameSite=None; Secure` is set.

Add these to `packages/server/.env`:

```env
# Cross-domain deployment (different API and frontend domains)
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
```

For **local development** (both on `localhost`):

```env
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```

> **Note:** `COOKIE_SECURE=true` is required when `COOKIE_SAME_SITE=none`. Browsers silently drop `SameSite=None` cookies that are not marked `Secure`.

## Database

The backend is configured for Sequelize with MySQL.

Update `packages/server/.env`:

```env
SEQUELIZE_DB=zflix
SEQUELIZE_USER=root
SEQUELIZE_PASS=your_password
SEQUELIZE_HOST=127.0.0.1
SEQUELIZE_DIALECT=mysql
SEQUELIZE_PORT=3306
```

Run migrations:

```bash
npm --workspace server run db:migrate
```

Run seeders when needed:

```bash
npm --workspace server run db:seed
```

## Redis

For local development, run Redis and use:

```env
REDIS_MODE=local
REDIS_LOCAL_HOST=127.0.0.1
REDIS_LOCAL_PORT=6379
```

This repo also includes WSL helper scripts:

```bash
npm run start:redis
npm run stop:redis
```

For hosted deployments, use:

```env
REDIS_MODE=external
REDIS_EXTERNAL_URL=rediss://default:password@host:port
```

## Run Locally

Start both the API and Expo app:

```bash
npm run start:dev
```

Or run each workspace separately:

```bash
npm run start:dev:server
npm run start:app
```

Useful app commands:

```bash
npm --workspace app run start:web
npm --workspace app run android
npm --workspace app run ios
```

## Build

Build everything that has a build script:

```bash
npm run build
```

Build only the backend:

```bash
npm run build:server
```

Export the web app:

```bash
npm run build:app:web
```

The Expo web output is generated in:

```text
packages/app/dist
```

## Quality Checks

```bash
npm run typecheck
npm run lint
```

## Deployment

- Frontend: GitHub Pages via `.github/workflows/deploy-pages.yml`.
- Backend: Render via `render.yaml`.
- Database: MySQL provider such as Aiven.
- Redis: Upstash Redis or another Redis-compatible service.

For the full deployment walkthrough, see:

[DEPLOYMENT.md](./DEPLOYMENT.md)

## License

This project is licensed under `CC-BY-NC-4.0`.
