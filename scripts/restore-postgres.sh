#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-lframework-postgres}"
BACKUP_DIR="${POSTGRES_BACKUP_DIR:-./backups/postgres}"
PGUSER="${POSTGRES_USER:-lframework}"
BACKUP_FILE="${1:-}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Container '$CONTAINER_NAME' is not running." >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  BACKUP_FILE="$(ls -1t "$BACKUP_DIR"/postgres_*.sql.gz 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found. Provide a file path or ensure backups exist in $BACKUP_DIR." >&2
  exit 1
fi

echo "Restoring PostgreSQL from $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$PGUSER" postgres

echo "Restore completed from: $BACKUP_FILE"
