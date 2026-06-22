SHELL := /bin/bash
NGROK_AUTHTOKEN ?= 3CPFFE4q2RRHyNayNOLCm3Mp0tI_2fnYKa95PeDtoNEqgVZKH
NGROK_URL ?= rage-awhile-snowcap.ngrok-free.dev

.DEFAULT_GOAL := help

.PHONY: help install infra-up infra-wait infra-down migrate dev run stop kill-ports test lint build monitoring-up monitoring-down backup-db restore-db evidencias-operacionais sprint3-check

help:
	@echo "Targets disponíveis:"
	@echo "  Windows: use ./make.ps1 <target> ou make.cmd <target>"
	@echo "  make install     - instala dependências do monorepo"
	@echo "  make infra-up    - sobe Postgres, Redis, RabbitMQ e Nginx (gateway)"
	@echo "  make infra-wait  - aguarda infraestrutura ficar saudável (healthcheck)"
	@echo "  make infra-down  - derruba infraestrutura Docker"
	@echo "  make migrate     - executa migrações dos serviços"
	@echo "  make dev         - sobe identity, compliance, integration, audit, risk, reporting, notification, messaging, api-docs, bff e frontend"
	@echo "  make run         - instala deps, sobe infra e inicia todos os serviços"
	@echo "  make stop        - encerra todos os serviços Node do projeto"
	@echo "  make test        - roda testes"
	@echo "  make sprint3-check - sobe infra, aplica migrate do compliance-service e roda testes de compliance/notification"
	@echo "  make lint        - roda lint"
	@echo "  make build       - roda build de todos os pacotes"
	@echo "  make monitoring-up   - sobe Prometheus + Alertmanager"
	@echo "  make monitoring-down - derruba stack de monitoramento"
	@echo "  make backup-db       - executa backup do PostgreSQL"
	@echo "  make restore-db FILE=<arquivo.sql.gz> - restaura backup (ou mais recente)"
	@echo "  make evidencias-operacionais - gera bundle local de evidências RN-102/RNF04/RNF15"

install:
	pnpm install

infra-up:
	pnpm docker:up

infra-wait:
	@echo "Aguardando infraestrutura ficar healthy..."
	@for i in $$(seq 1 90); do \
		status="$$(docker ps --format '{{.Names}} {{.Status}}' | grep -E 'lframework-(postgres|redis|rabbitmq|nginx)' || true)"; \
		echo "$$status" | grep -qE 'lframework-postgres .*healthy' && \
		echo "$$status" | grep -qE 'lframework-redis .*healthy' && \
		echo "$$status" | grep -qE 'lframework-rabbitmq .*healthy' && \
		echo "$$status" | grep -qE 'lframework-nginx .*healthy' && \
		{ echo "Infra pronta."; exit 0; }; \
		sleep 1; \
	done; \
	echo "Timeout aguardando healthchecks da infra."; \
	docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -En 'lframework-(postgres|redis|rabbitmq|nginx)' || true; \
	exit 1

infra-down:
	pnpm docker:down

migrate:
	./packages/identity-service/node_modules/.bin/prisma migrate dev --name init --schema=./packages/identity-service/prisma/schema.prisma
	./packages/compliance-service/node_modules/.bin/prisma migrate dev --name init --schema=./packages/compliance-service/prisma/schema.prisma
	./packages/integration-service/node_modules/.bin/prisma migrate dev --name init --schema=./packages/integration-service/prisma/schema.prisma
	./packages/audit-service/node_modules/.bin/prisma migrate dev --name init --schema=./packages/audit-service/prisma/schema.prisma
	./packages/notification-service/node_modules/.bin/prisma migrate dev --name init --schema=./packages/notification-service/prisma/schema.prisma

stop:
	@echo "Encerrando serviços Node do projeto nas portas 4000-4011..."
	@lsof -ti :4000,4001,4002,4003,4004,4005,4006,4007,4008,4009,4010,4011 2>/dev/null | xargs kill -9 2>/dev/null || true
	@sleep 1
	@echo "Pronto."

kill-ports: stop

dev:
	pnpm dev

run: stop install infra-up infra-wait dev

test:
	pnpm test

sprint3-check: infra-up infra-wait
	@echo "Aplicando migrations do compliance-service..."
	@set -a; source .env; set +a; cd packages/compliance-service && pnpm exec prisma migrate deploy
	@echo "Aplicando migrations do notification-service..."
	@set -a; source .env; set +a; cd packages/notification-service && pnpm exec prisma migrate deploy
	@echo "Rodando testes do compliance-service..."
	pnpm --filter compliance-service test
	@echo "Rodando testes do notification-service..."
	pnpm --filter notification-service test

lint:
	pnpm lint

build:
	pnpm build

ngrok:
	@if [ -n "$(NGROK_URL)" ]; then \
		ngrok http 5173 --authtoken=$(NGROK_AUTHTOKEN) --url=$(NGROK_URL); \
	else \
		ngrok http 5173 --authtoken=$(NGROK_AUTHTOKEN); \
	fi


monitoring-up:
	docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d prometheus alertmanager

monitoring-down:
	docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down

backup-db:
	./scripts/backup-postgres.sh

restore-db:
	./scripts/restore-postgres.sh $(FILE)

evidencias-operacionais:
	./scripts/collect-operational-evidence.sh
