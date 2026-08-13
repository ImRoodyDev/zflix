# ZFlix Deployment Guide

This repo is a monorepo with:

- `packages/app`: Expo app, exported as a static web build for GitHub Pages.
- `packages/server`: Node/Express API, deployed as a Render Web Service.

## Before You Publish

1. Rotate any secrets that were ever committed, pasted into chat, or shared. The server `.env` contains private keys and service credentials.
2. Commit the lockfile. CI should use the same dependency graph as your machine, so keep `package-lock.json` tracked.

## Recommended Free Services

- Frontend: GitHub Pages.
- Backend: Render free Web Service.
- Redis: Upstash Redis free tier, or Render Key Value if you want everything inside Render.
- Database: Aiven Free MySQL is the easiest fit because the server currently uses `mysql2` and `SEQUELIZE_DIALECT=mysql`.

Render Postgres is also good, but Render's free Postgres expires after 30 days. If you switch to Postgres, install `pg`, change `SEQUELIZE_DIALECT=postgres`, and test migrations.

## 1. Create The Database

1. Create an Aiven account.
2. Create a free MySQL service.
3. Copy host, port, database, user, and password into Render env vars:

```env
SEQUELIZE_DB=...
SEQUELIZE_USER=...
SEQUELIZE_PASS=...
SEQUELIZE_HOST=...
SEQUELIZE_DIALECT=mysql
SEQUELIZE_PORT=...
SEQUELIZE_LOGGING=false
```

If your MySQL provider requires TLS, update the Sequelize constructor to include `dialectOptions.ssl`.

## 2. Create Redis

1. Create an Upstash Redis database.
2. Copy the Redis URL into Render:

```env
REDIS_MODE=external
REDIS_EXTERNAL_URL=rediss://default:password@host:port
```

## 3. Deploy The Backend To Render

You can use `render.yaml` from the repo root as a Render Blueprint.

1. In Render, create a new Blueprint from your GitHub repo.
2. Pick the `render.yaml` file.
3. Fill every `sync: false` environment variable from `packages/server/.env.example`.
4. Use:

```text
Root Directory: packages/server
Build Command: npm install && npm run build
Start Command: npm start
```

Render free web services do not support pre-deploy commands. Run migrations from your local machine
against the hosted database instead:

```bash
npm --workspace server run db:migrate
```

Run seeders only when needed:

```bash
npm --workspace server run db:seed
```

5. After deploy, copy the public API URL, for example `https://zflix-api.onrender.com`.

Set CORS variables:

```env
SERVER_DOMAIN=https://zflix-api.onrender.com
FRONTEND_DOMAINS=https://your-github-username.github.io,https://your-github-username.github.io/zflix
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
COOKIE_PARTITIONED=true
```

## 4. Configure GitHub Pages

1. In GitHub, open Settings > Pages.
2. Set Source to GitHub Actions.
3. Add Repository Variables in Settings > Secrets and variables > Actions > Variables:

```env
EXPO_PUBLIC_APP_NAME=ZFlix
EXPO_PUBLIC_APP_EMAIL=hello@example.com
EXPO_PUBLIC_API_URL=https://zflix-api.onrender.com
EXPO_PUBLIC_ANDROID_DOWNLOAD_URL=https://example.com/android
EXPO_PUBLIC_IOS_DOWNLOAD_URL=https://example.com/ios
EXPO_PUBLIC_WINDOWS_DOWNLOAD_URL=https://example.com/windows
EXPO_PUBLIC_TMDB_API_KEYS=key1,key2
```

These are public because `EXPO_PUBLIC_*` values are baked into the web and native app bundles.

## 5. Set The Expo GitHub Pages Base URL

If the site URL is `https://username.github.io/zflix`, set this in `packages/app/app.json`:

```json
"experiments": {
  "typedRoutes": true,
  "autolinkingModuleResolution": true,
  "baseUrl": "/zflix"
}
```

If you publish to `https://username.github.io` with a user/org Pages repo, do not use `/zflix`; use `/`.

## 6. CI/CD Flow

- Push to `main`.
- `.github/workflows/deploy-pages.yml` installs deps, runs `npm --workspace app run build:web`, uploads `packages/app/dist`, and deploys to GitHub Pages.
- Render auto-deploys `packages/server` when backend files change.

## How Env Works For Web And Native Android

Server env vars are runtime secrets. Render injects them into `process.env` when the server starts. They are not bundled into the frontend.

Expo app env vars are build-time values. Your code reads `process.env.EXPO_PUBLIC_*`, and Expo replaces those values during bundling. That means:

- They are visible to anyone who downloads your web bundle or Android APK.
- They are fine for API URLs, app names, public support emails, and public client keys.
- They are not safe for database passwords, JWT private keys, Redis URLs, mailer passwords, Stripe secrets, or PayPal app secrets.

For Android with EAS Build, create the same `EXPO_PUBLIC_*` variables in the Expo dashboard under the `production` environment, then set your production build profile to `"environment": "production"`. If you build Android locally, keep a local `.env` in `packages/app` or export those variables before running the build.
