#!/usr/bin/env bash
set -euo pipefail

RISK_URL="${RISK_URL:-http://localhost:4006/api/v1/risk/events}"

echo "🌱 Seeding risk-analysis-service via HTTP ($RISK_URL)..."

post_event() {
  curl -sf -X POST "$RISK_URL" \
    -H "Content-Type: application/json" \
    -d "$1" > /dev/null
}

# Critical users
post_event '{"userId":"user-admin-001","area":"security","processType":"access_control","severity":"critical"}'
post_event '{"userId":"user-admin-001","area":"security","processType":"access_control","severity":"high"}'
post_event '{"userId":"user-compliance-002","area":"finance","processType":"invoice_approval","severity":"high"}'
post_event '{"userId":"user-compliance-002","area":"finance","processType":"invoice_approval","severity":"medium"}'
post_event '{"userId":"user-compliance-002","area":"finance","processType":"data_export","severity":"high"}'

# High risk users
post_event '{"userId":"user-auditor-003","area":"hr","processType":"access_review","severity":"high"}'
post_event '{"userId":"user-auditor-003","area":"security","processType":"log_access","severity":"medium"}'
post_event '{"userId":"user-gestor-004","area":"finance","processType":"contract_approval","severity":"high"}'
post_event '{"userId":"user-gestor-004","area":"finance","processType":"contract_approval","severity":"critical"}'
post_event '{"userId":"user-ext-009","area":"hr","processType":"data_export","severity":"critical"}'
post_event '{"userId":"user-ext-009","area":"hr","processType":"data_export","severity":"high"}'

# Medium risk users
post_event '{"userId":"user-dev-005","area":"security","processType":"deployment","severity":"medium"}'
post_event '{"userId":"user-dev-005","area":"security","processType":"deployment","severity":"low"}'
post_event '{"userId":"user-dev-006","area":"security","processType":"access_control","severity":"medium"}'
post_event '{"userId":"user-analyst-007","area":"finance","processType":"reporting","severity":"low"}'
post_event '{"userId":"user-analyst-007","area":"finance","processType":"reporting","severity":"low"}'
post_event '{"userId":"user-support-008","area":"hr","processType":"user_management","severity":"medium"}'

# Areas
post_event '{"userId":"user-admin-001","area":"security","processType":"access_control","severity":"critical"}'
post_event '{"userId":"user-compliance-002","area":"finance","processType":"invoice_approval","severity":"high"}'
post_event '{"userId":"user-auditor-003","area":"hr","processType":"access_review","severity":"medium"}'
post_event '{"userId":"user-gestor-004","area":"compliance","processType":"policy_review","severity":"high"}'
post_event '{"userId":"user-dev-005","area":"ti","processType":"deployment","severity":"low"}'
post_event '{"userId":"user-dev-006","area":"ti","processType":"access_control","severity":"medium"}'

# Processes
post_event '{"userId":"user-admin-001","area":"security","processType":"access_control","severity":"critical"}'
post_event '{"userId":"user-compliance-002","area":"finance","processType":"invoice_approval","severity":"high"}'
post_event '{"userId":"user-auditor-003","area":"hr","processType":"access_review","severity":"medium"}'
post_event '{"userId":"user-gestor-004","area":"finance","processType":"contract_approval","severity":"critical"}'
post_event '{"userId":"user-dev-005","area":"security","processType":"deployment","severity":"low"}'
post_event '{"userId":"user-support-008","area":"hr","processType":"user_management","severity":"medium"}'
post_event '{"userId":"user-analyst-007","area":"finance","processType":"data_export","severity":"high"}'
post_event '{"userId":"user-ext-009","area":"hr","processType":"policy_review","severity":"critical"}'

echo "  ✓ 30 risk events ingested"
