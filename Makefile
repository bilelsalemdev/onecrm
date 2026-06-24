# ════════════════════════════════════════════════════════════════
# OneCRM — Makefile
# ════════════════════════════════════════════════════════════════
# The server only needs Docker + Docker Compose. Everything below is
# a thin wrapper around `docker compose`.
#
#   make deploy   → build images + start everything (first run)
#   make up/down  → start / stop
#   make logs     → follow logs
#   make seed     → load demo data into the running server
#
# Ports are overridable via .env (see .env.example):
#   WEB_PORT     (default 3000)  the app  — React SPA + /api proxy
#   SERVER_PORT  (default 3001)  the Bun API server (direct access)
# ════════════════════════════════════════════════════════════════

# Pull WEB_PORT / SERVER_PORT from .env (if present) for the URL echoes.
ifneq (,$(wildcard .env))
include .env
export
endif

WEB_PORT ?= 3000
SERVER_PORT ?= 3001

.DEFAULT_GOAL := help
.PHONY: help build up down restart rebuild deploy logs logs-web logs-server ps seed clean urls

help: ## Show this help
	@echo ""
	@echo "  OneCRM — available commands"
	@echo "  ─────────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: ## Build all Docker images
	docker compose build

up: ## Start all services (detached)
	docker compose up -d
	@$(MAKE) --no-print-directory urls

down: ## Stop and remove containers
	docker compose down

restart: ## Restart all services (no rebuild)
	docker compose restart

rebuild: ## Rebuild images and restart from scratch
	docker compose down
	docker compose build
	docker compose up -d
	@$(MAKE) --no-print-directory urls

deploy: ## First-time deploy — build images, start, wait for healthy
	docker compose build
	docker compose up -d
	@$(MAKE) --no-print-directory urls

logs: ## Follow logs for all services
	docker compose logs -f

logs-web: ## Follow web (nginx) logs
	docker compose logs -f web

logs-server: ## Follow server (Bun API) logs
	docker compose logs -f server

ps: ## Show container status
	docker compose ps

seed: ## Load demo data (services + kanban reviews) into the running server
	docker compose exec server bun /app/scripts/seed.ts

clean: ## Stop containers AND remove volumes (wipes stored services!)
	docker compose down -v
	@echo "  ✓ Cleaned — containers and the server-data volume were removed"

urls: ## Print the app URLs
	@echo ""
	@echo "  ✓ OneCRM is up"
	@echo "  ─────────────────────────────────────────"
	@echo "  App (web):   http://localhost:$(WEB_PORT)"
	@echo "  API server:  http://localhost:$(SERVER_PORT)/api/services"
	@echo ""
