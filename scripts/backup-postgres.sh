#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-lframework-postgres}"
BACKUP_DIR="${POSTGRES_BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${POSTGRES_BACKUP_RETENTION_DAYS:-30}"
PGUSER="${POSTGRES_USER:-lframework}"

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Container '$CONTAINER_NAME' is not running." >&2
  exit 1
fi

echo "Creating PostgreSQL backup at $OUTPUT_FILE"
docker exec "$CONTAINER_NAME" pg_dumpall -U "$PGUSER" | gzip > "$OUTPUT_FILE"

echo "Pruning backups older than ${RETENTION_DAYS} days in $BACKUP_DIR"
find "$BACKUP_DIR" -type f -name 'postgres_*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete || true

echo "Backup completed: $OUTPUT_FILE"
