CREATE TABLE IF NOT EXISTS "audit_retention_runs" (
  "id" UUID PRIMARY KEY,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "finished_at" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "retention_days" INTEGER NOT NULL,
  "cutoff_at" TIMESTAMP(3) NOT NULL,
  "scanned_count" INTEGER NOT NULL DEFAULT 0,
  "eligible_count" INTEGER NOT NULL DEFAULT 0,
  "monitor_only_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT
);
