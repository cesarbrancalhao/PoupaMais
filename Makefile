.PHONY: help init dev prod install clean db db-purge

# Change this to "podman" if you use Podman instead of Docker
RUNTIME   := docker
DOCKER    := $(RUNTIME)
COMPOSE   := $(RUNTIME) compose

help:
	@echo "Available commands (using $(RUNTIME)):"
	@echo "  make init            - Install all dependencies and start all services"
	@echo "  make dev             - Run client & server in dev mode"
	@echo "  make prod            - Run client & server in prod mode"
	@echo "  make install         - Install client & server dependencies"
	@echo "  make clean           - Clean client & server builds"
	@echo "  make db              - Start the database"
	@echo "  make db-purge        - Purge the database (volumes included)"
	@echo ""
	@echo "To use Podman: make RUNTIME=podman <command>"
	@echo "Or change the RUNTIME variable at the top of this file"

init:
	@echo "Installing client & server dependencies..."
	@make install
	@make db
	@make dev

install:
	@echo "Installing client dependencies..."
	@cd client && npm install
	@echo "Installing server dependencies..."
	@cd server && npm install
	@echo "Installation complete!"

run:
	@make db
	@make dev

db:
	@echo "Starting database with $(RUNTIME)..."
	@cd server && $(COMPOSE) up -d postgres
	@until $(DOCKER) exec poupa_mais_db pg_isready -U postgres >/dev/null 2>&1; do \
		echo "Waiting for database to start..."; \
		sleep 2; \
	done; \
	echo "Database started successfully!"

dev:
	@echo "Starting client, server, and database..."
	@echo "Press Ctrl+C to stop all services"
	@trap 'kill 0' EXIT INT TERM; \
	(cd client && npm run dev) & \
	(cd server && npm run start:dev) & \
	wait

prod:
	@echo "Starting client & server in prod mode..."
	@echo "Press Ctrl+C to stop both services"
	@trap 'kill 0' EXIT INT TERM; \
	(cd client && npm run build) & \
	(cd server && npm run build) & \
	wait

clean:
	@echo "Cleaning builds..."
	@rm -rf client/.next
	@rm -rf server/dist
	@rm -rf server/coverage
	@cd server && $(COMPOSE) down
	@echo "Cleanup complete!"

db-purge:
	@echo "Purging database..."
	@cd server && $(COMPOSE) down -v
	@echo "Database purged successfully!"