COMPOSE := docker compose -f docker/docker-compose.yml
BACKEND := $(COMPOSE) exec backend
BACKEND_RUN := $(COMPOSE) run --rm backend

.PHONY: help up down build rebuild logs ps db-only stop restart \
        backend-shell db-shell \
        migrate migrate-new seed reset-db \
        test test-cov lint fmt \
        pgadmin \
        build-prod-backend build-prod-web build-prod

WEB := $(COMPOSE) exec web

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start db + backend in background
	$(COMPOSE) up -d --build

down: ## Stop all services (keeps volume)
	$(COMPOSE) down

build: ## Build backend image
	$(COMPOSE) build backend

rebuild: ## Rebuild backend image from scratch
	$(COMPOSE) build --no-cache backend

logs: ## Follow backend logs
	$(COMPOSE) logs -f backend

web-logs: ## Follow web dev server logs
	$(COMPOSE) logs -f web

web-shell: ## Open a shell in the web container
	$(WEB) sh

ps: ## Show container status
	$(COMPOSE) ps

db-only: ## Start only the database (for local venv dev)
	$(COMPOSE) up -d db

stop: ## Stop containers without removing
	$(COMPOSE) stop

restart: ## Restart backend
	$(COMPOSE) restart backend

backend-shell: ## Open a bash shell inside the backend container
	$(BACKEND) bash

db-shell: ## psql into the database
	$(COMPOSE) exec db psql -U opstrack -d opstrack

migrate: ## Apply database migrations
	$(BACKEND) flask db upgrade

migrate-new: ## Generate a new migration (usage: make migrate-new m="description")
	$(BACKEND) flask db migrate -m "$(m)"

seed: ## Seed the database with demo data
	$(BACKEND) flask opstrack seed

reset-db: ## Reseed with --reset (wipes existing data first)
	$(BACKEND) flask opstrack seed --reset

test: ## Run pytest inside backend container
	$(BACKEND_RUN) pytest

test-cov: ## Run pytest with coverage
	$(BACKEND_RUN) pytest --cov=app --cov-report=term-missing

lint: ## Run ruff on backend code
	$(BACKEND_RUN) ruff check app tests

fmt: ## Format backend code with black + ruff --fix
	$(BACKEND_RUN) bash -c "black app tests && ruff check --fix app tests"

pgadmin: ## Start pgadmin alongside the stack (http://localhost:5050)
	$(COMPOSE) --profile admin up -d pgadmin

# ── Production image builds ──────────────────────────────────────────────────

build-prod-backend: ## Build production backend image (usage: make build-prod-backend TAG=v1.2.0)
	docker build \
		--build-arg INSTALL_DEV=0 \
		-t opstrack-backend:$(or $(TAG),latest) \
		backend/

build-prod-web: ## Build production web image (usage: make build-prod-web BACKEND_URL=https://... TAG=v1.2.0)
	@test -n "$(BACKEND_URL)" || (echo "ERROR: set BACKEND_URL=https://your-backend.railway.app" && exit 1)
	docker build \
		--build-arg VITE_API_BASE_URL=$(BACKEND_URL) \
		-t opstrack-web:$(or $(TAG),latest) \
		web/

build-prod: build-prod-backend build-prod-web ## Build both production images
