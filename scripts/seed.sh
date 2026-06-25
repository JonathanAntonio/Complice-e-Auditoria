#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export $(grep -v '^#' "$ROOT/.env" | xargs)

run_seed() {
  local pkg="$1"
  local dir="$ROOT/packages/$pkg"
  echo ""
  echo "━━━ $pkg ━━━"
  cd "$dir"
  node_modules/.bin/prisma generate --schema=prisma/schema.prisma 2>&1 | grep -E "Generated|Error"
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then echo "❌ prisma generate falhou em $pkg"; exit 1; fi
  node_modules/.bin/ts-node-dev --transpile-only --no-notify prisma/seed.ts
}

echo "╔══════════════════════════════╗"
echo "║   Seed — Complice e Auditoria║"
echo "╚══════════════════════════════╝"

run_seed "identity-service"
run_seed "compliance-service"
run_seed "audit-service"
run_seed "notification-service"

echo ""
echo "━━━ risk-analysis-service (HTTP) ━━━"
bash "$ROOT/scripts/seed-risk.sh"

echo ""
echo "✅ Seed concluído."
echo ""
echo "Usuários criados:"
echo "  admin@demo.com       → administrador  (todas as permissões)"
echo "  compliance@demo.com  → compliance_officer"
echo "  auditor@demo.com     → auditor_interno"
echo "  gestor@demo.com      → gestor"
echo "  viewer@demo.com      → visualizador"
echo "  Senha: Senha@123!"
