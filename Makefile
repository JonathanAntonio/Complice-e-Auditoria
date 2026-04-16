SHELL := /bin/bash
NGROK_AUTHTOKEN ?= 3CPFFE4q2RRHyNayNOLCm3Mp0tI_2fnYKa95PeDtoNEqgVZKH
NGROK_URL ?= rage-awhile-snowcap.ngrok-free.dev

.DEFAULT_GOAL := help

.PHONY: help install infra-up infra-wait infra-down migrate dev run test lint build

help:
	@echo "Targets disponíveis:"
	@echo "  Windows: use ./make.ps1 <target> ou make.cmd <target>"
	@echo "  make install     - instala dependências do monorepo"
	@echo "  make infra-up    - sobe Postgres, Redis, RabbitMQ e Nginx (gateway)"
	@echo "  make infra-wait  - aguarda infraestrutura ficar saudável (healthcheck)"
	@echo "  make infra-down  - derruba infraestrutura Docker"
	@echo "  make migrate     - executa migrações dos serviços"
	@echo "  make dev         - sobe identity, compliance, integration, audit, risk, reporting, notification, api-docs, bff e frontend"
	@echo "  make run         - instala deps, sobe infra e inicia todos os serviços"
	@echo "  make test        - roda testes"
	@echo "  make lint        - roda lint"
	@echo "  make build       - roda build de todos os pacotes"

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

dev:
	pnpm dev

run: install infra-up infra-wait dev

test:
	pnpm test

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
