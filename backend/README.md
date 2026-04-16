# OpsTrack Backend

Flask + Flask-RESTful + SQLAlchemy API.

## Layout

```
app/
  __init__.py       # create_app factory
  config.py         # Dev / Test / Prod configs
  extensions.py     # db, migrate, jwt, cors singletons
  errors.py         # global error handlers
  activity.py       # SQLAlchemy hooks that write ActivityLog entries
  auth/             # current_user helper + roles_required decorator
  models/           # User, Location, Equipment, Ticket, Assignment, ActivityLog
  schemas/          # marshmallow validation / serialization
  resources/        # Flask-RESTful Resource classes (auth, health, ...)
tests/              # pytest suite + factory_boy factories
wsgi.py             # gunicorn entrypoint
```

## Local dev (without Docker)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env

# First time only — generate the migrations directory from the models:
flask --app wsgi db init
flask --app wsgi db migrate -m "initial schema"
flask --app wsgi db upgrade

flask --app wsgi run
```

Subsequent schema changes: `flask --app wsgi db migrate -m "…"` then `db upgrade`.

## Tests

```bash
pytest
```

Tests use SQLite in-memory by default (see `app/config.py::TestConfig`). Integration tests that require Postgres-specific features can override via `TEST_DATABASE_URL`.

## Endpoints

Auth:
- `GET  /api/health`
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` · `GET /api/auth/me`

Users (admin-only unless noted):
- `GET  /api/users` — `?q=` search, pagination
- `POST /api/users`
- `GET/PATCH/DELETE /api/users/<id>`
- `PATCH /api/users/me` — self-service (role/is_active ignored)

Locations:
- `GET  /api/locations` — all roles; `?q=` search
- `POST /api/locations` — admin/staff
- `GET  /api/locations/<id>` — all roles
- `PATCH /api/locations/<id>` — admin/staff
- `DELETE /api/locations/<id>` — admin

Equipment:
- `GET  /api/equipment` — all roles; `?q=&status=&location_id=`
- `POST /api/equipment` — admin/staff
- `GET  /api/equipment/<id>` — all roles
- `PATCH /api/equipment/<id>` — admin/staff (status transitions here)
- `DELETE /api/equipment/<id>` — admin

Maintenance tickets:
- `GET  /api/tickets` — all roles; `?status=&priority=&equipment_id=&assignee_id=&mine=1`
- `POST /api/tickets` — all roles (reporter = current user)
- `GET  /api/tickets/<id>` — all roles
- `PATCH /api/tickets/<id>` — admin/staff, reporter, or assignee; resolving sets `resolved_at`
- `DELETE /api/tickets/<id>` — admin/staff
- `GET/POST /api/tickets/<id>/assignments`
- `DELETE /api/tickets/<id>/assignments/<user_id>`

Activity log (admin-only):
- `GET /api/activity` — `?entity_type=&entity_id=&actor_id=&action=`

Activity log is populated automatically via SQLAlchemy session events on insert/update/delete of tracked models.
