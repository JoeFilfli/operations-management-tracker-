FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-dev.txt ./
ARG INSTALL_DEV=0
RUN if [ "$INSTALL_DEV" = "1" ]; then \
        pip install -r requirements-dev.txt ; \
    else \
        pip install -r requirements.txt ; \
    fi

COPY app ./app
COPY migrations ./migrations
COPY wsgi.py ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
# Use $PORT if set (Railway injects it), fall back to 5000 for local Docker.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 60 --access-logfile - wsgi:app"]
