#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${ROOT_DIR}/out/evidencias-operacionais/${TS}"

mkdir -p "${OUT_DIR}"

write_header() {
  local file="$1"
  local title="$2"
  {
    echo "=== ${title} ==="
    echo "generated_at_utc=${TS}"
    echo
  } >> "${file}"
}

run_capture() {
  local file="$1"
  local title="$2"
  shift 2
  write_header "${file}" "${title}"
  {
    echo "+ $*"
    "$@"
  } >> "${file}" 2>&1 || {
    {
      echo
      echo "[WARN] command failed: $*"
    } >> "${file}"
  }
  echo >> "${file}"
}

SUMMARY_FILE="${OUT_DIR}/summary.txt"
touch "${SUMMARY_FILE}"
write_header "${SUMMARY_FILE}" "Operational Evidence Summary"
{
  echo "output_dir=${OUT_DIR}"
  echo "hostname=$(hostname)"
  echo "user=$(whoami)"
  echo "pwd=${ROOT_DIR}"
  echo
} >> "${SUMMARY_FILE}"

# RN-102
RN102_FILE="${OUT_DIR}/rn102_fail_closed.txt"
touch "${RN102_FILE}"
run_capture "${RN102_FILE}" "AUDIT_FAIL_CLOSED in local env files" rg -n "^AUDIT_FAIL_CLOSED=" "${ROOT_DIR}/.env.production.example"
run_capture "${RN102_FILE}" "Services with explicit fail-closed wiring" rg -n "failClosed: auditFailClosed|AUDIT_FAIL_CLOSED|assertAvailable\\(|Audit unavailable|Stopping .*service" "${ROOT_DIR}/packages" -S

# RNF04
RNF04_FILE="${OUT_DIR}/rnf04_backup.txt"
touch "${RNF04_FILE}"
run_capture "${RNF04_FILE}" "Backup scripts and scheduling templates" rg -n "backup-postgres|POSTGRES_BACKUP_RETENTION_DAYS|OnCalendar|0 2 \\* \\* \\*" "${ROOT_DIR}/scripts" "${ROOT_DIR}/deploy" -S
run_capture "${RNF04_FILE}" "Local backup artifacts" ls -lah "${ROOT_DIR}/backups/postgres"

# RNF15
RNF15_FILE="${OUT_DIR}/rnf15_alerting.txt"
touch "${RNF15_FILE}"
run_capture "${RNF15_FILE}" "Prometheus rules configured" rg -n "alert: ServiceDown|alert: Api5xxRatioHigh|alert: ApiLatencyP95High" "${ROOT_DIR}/monitoring/alerts.yml" -S
run_capture "${RNF15_FILE}" "Alertmanager routing configured" rg -n "receiver|webhook_configs|url:" "${ROOT_DIR}/monitoring/alertmanager.yml" -S

{
  echo "Generated files:"
  echo "- ${SUMMARY_FILE}"
  echo "- ${RN102_FILE}"
  echo "- ${RNF04_FILE}"
  echo "- ${RNF15_FILE}"
} >> "${SUMMARY_FILE}"

echo "Evidence bundle created at: ${OUT_DIR}"
