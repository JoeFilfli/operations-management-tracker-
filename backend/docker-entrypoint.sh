#!/usr/bin/env bash
set -euo pipefail

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    echo "[entrypoint] Running database migrations..."
    flask db upgrade
fi

exec "$@"
