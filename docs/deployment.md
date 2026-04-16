# Deploying OpsTrack to Railway

## Overview

Three Railway services are needed:

| Service  | Source                | Notes                              |
|----------|-----------------------|------------------------------------|
| Postgres | Railway managed add-on| Railway provisions this for you    |
| Backend  | `backend/Dockerfile`  | Flask + gunicorn                   |
| Web      | `web/Dockerfile`      | nginx serving the Vite static build|

---

## Step 1 — Create the project

1. Sign in at [railway.app](https://railway.app) and click **New Project**.
2. Choose **Deploy from GitHub repo** → select this repo.

---

## Step 2 — Provision Postgres

1. Inside the project click **+ New → Database → PostgreSQL**.
2. Railway creates a Postgres instance and exposes `DATABASE_URL` automatically.

---

## Step 3 — Deploy the backend

1. Click **+ New → GitHub Repo** (same repo).
2. In **Settings → Source**: set **Root Directory** to `backend`.
3. Railway detects `backend/Dockerfile` and `backend/railway.toml` automatically.
4. Under **Variables**, add:

| Variable                         | Value                                         |
|----------------------------------|-----------------------------------------------|
| `DATABASE_URL`                   | `${{Postgres.DATABASE_URL}}` (Railway ref)    |
| `SECRET_KEY`                     | a long random string                          |
| `JWT_SECRET_KEY`                 | a different long random string                |
| `CORS_ORIGINS`                   | `https://your-web-service.up.railway.app`     |
| `FLASK_ENV`                      | `production`                                  |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | `60`                                        |
| `JWT_REFRESH_TOKEN_EXPIRES_DAYS`   | `30`                                        |

> **Migrations run automatically** on every deploy via the `docker-entrypoint.sh`.

5. Click **Deploy**. Wait for the health check (`GET /api/health`) to pass.
6. Note the generated backend URL — you'll need it for the web service.

---

## Step 4 — Deploy the web frontend

1. Click **+ New → GitHub Repo** (same repo again).
2. Set **Root Directory** to `web`.
3. Railway detects `web/Dockerfile` and `web/railway.toml`.
4. Under **Variables**, add:

| Variable             | Value                                           |
|----------------------|-------------------------------------------------|
| `VITE_API_BASE_URL`  | `https://your-backend.up.railway.app`           |

> **This is a build-time variable.** Railway passes it as a Docker `--build-arg`,
> which Vite bakes into the JS bundle. After changing it you must redeploy.

5. Click **Deploy**. Once healthy, your app is live at the generated web URL.

---

## Step 5 — Update CORS

Go back to the **backend** service variables and update `CORS_ORIGINS` to the
final web URL (e.g. `https://opstrack.up.railway.app`). Redeploy the backend.

---

## Updating after code changes

Railway redeploys automatically on every push to your main branch.

For frontend changes that don't change the backend URL, only the web service
redeploys. Backend schema changes automatically run `flask db upgrade` on the
next deploy before gunicorn starts.

---

## Local production build test

Before pushing, verify both images build cleanly:

```bash
make build-prod-backend

make build-prod-web BACKEND_URL=https://your-backend.up.railway.app
```

---

## Environment variable reference

### Backend

| Variable                           | Required | Default          | Notes                        |
|------------------------------------|----------|------------------|------------------------------|
| `DATABASE_URL`                     | ✓        | —                | Railway Postgres URL         |
| `SECRET_KEY`                       | ✓        | dev fallback     | Flask session key            |
| `JWT_SECRET_KEY`                   | ✓        | dev fallback     | JWT signing key              |
| `CORS_ORIGINS`                     | ✓        | `""`             | Comma-separated allowed origins |
| `FLASK_ENV`                        |          | `development`    | Set to `production`          |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` |          | `60`             |                              |
| `JWT_REFRESH_TOKEN_EXPIRES_DAYS`   |          | `30`             |                              |
| `RUN_MIGRATIONS`                   |          | `1`              | Set `0` to skip on deploy    |
| `PORT`                             |          | `5000`           | Railway injects this         |

### Web

| Variable             | Required | Notes                                     |
|----------------------|----------|-------------------------------------------|
| `VITE_API_BASE_URL`  | ✓        | Full URL of the backend service, no trailing slash |
