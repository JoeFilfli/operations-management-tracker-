# OpsTrack

<!-- Replace YOUR_USER/YOUR_REPO before pushing -->
![CI](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml/badge.svg)

Equipment & operations management platform. Tracks inventory, equipment status, and maintenance tickets across a technical organization. Web dashboard for admins, React Native app for field staff.

## Repo layout

- [backend/](backend/) — Flask + Flask-RESTful + SQLAlchemy API
- [web/](web/) — React (Vite) admin dashboard
- [mobile/](mobile/) — React Native + Expo app
- [docker/](docker/) — Dockerfiles and compose files
- [docs/](docs/) — Architecture notes, API reference

## Stack

- **Backend:** Flask, Flask-RESTful, SQLAlchemy, Alembic, Flask-JWT-Extended
- **Database:** PostgreSQL
- **Web:** React + Vite + Tailwind
- **Mobile:** React Native + Expo
- **Containerization:** Docker + Docker Compose
- **Testing:** Pytest (backend), ESLint + Vite build check (web)
- **Deployment:** Railway

## Quick start

Requires Docker and Docker Compose.

```bash
make up       # build + start db (port 5433) and backend (port 5000)
make seed     # populate demo users, locations, equipment, tickets
make logs     # follow backend logs
```

API is at `http://localhost:5000`. Demo admin login: `admin@opstrack.local` / `password123`.

## Common tasks

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `make up`          | Build + start db and backend               |
| `make down`        | Stop everything (keeps DB volume)          |
| `make logs`        | Follow backend logs                        |
| `make test`        | Run pytest inside the backend container    |
| `make migrate`     | Apply pending migrations                   |
| `make seed`        | Seed demo data (idempotent)                |
| `make reset-db`    | Truncate + reseed (destructive)            |
| `make db-shell`    | psql into the database                     |
| `make backend-shell` | bash into the backend container          |
| `make pgadmin`     | Start pgadmin at http://localhost:5050 (admin profile) |

Run `make help` for the full list.

## Working locally (without running backend in Docker)

```bash
make db-only                       # start only Postgres
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env               # defaults point at localhost:5433
flask db upgrade
flask run
```

## Running tests

```bash
make test          # pytest inside the backend container
make test-cov      # pytest with coverage report
make lint          # ruff check
make fmt           # black + ruff --fix
```

There are no separate web unit tests. The `web-build` CI job runs `eslint` and `vite build` as a smoke test.

## CI/CD

GitHub Actions runs on every push and pull request:

| Job | Trigger | What it does |
|-----|---------|--------------|
| `backend-lint` | push / PR | `ruff check app tests` |
| `backend-test` | push / PR | `pytest` against a Postgres service container |
| `web-build` | push / PR | `eslint` + `vite build` |
| `deploy-backend` | push to `main` (after all pass) | `railway up --service backend` |
| `deploy-web` | push to `main` (after all pass) | `railway up --service web` |

The deploy jobs require a `RAILWAY_TOKEN` secret and Railway auto-deploy to be **disabled** in the Railway dashboard. See [docs/deployment.md](docs/deployment.md) for setup.

## Architecture

See [docs/architecture.md](docs/architecture.md) for service diagram, data model, and auth design.

## Deployment

See [docs/deployment.md](docs/deployment.md) for the Railway step-by-step guide.
