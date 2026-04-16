CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "occurred_at_utc" TIMESTAMP(3) NOT NULL,
  "recorded_at_utc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor_id" TEXT,
  "actor_type" TEXT,
  "source_service" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "audit_logs_event_id_key" ON "audit_logs"("event_id");
CREATE INDEX IF NOT EXISTS "audit_logs_occurred_at_utc_idx" ON "audit_logs"("occurred_at_utc");
CREATE INDEX IF NOT EXISTS "audit_logs_event_type_idx" ON "audit_logs"("event_type");
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs"("severity");
