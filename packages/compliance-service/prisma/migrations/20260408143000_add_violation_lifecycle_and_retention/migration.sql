DO $$ BEGIN
  CREATE TYPE "ViolationStatus" AS ENUM ('aberta', 'em_analise', 'resolvida', 'dispensada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "items"
  ADD COLUMN IF NOT EXISTS "status" "ViolationStatus" NOT NULL DEFAULT 'aberta',
  ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dismissed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retention_until" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "items_status_idx" ON "items"("status");
CREATE INDEX IF NOT EXISTS "items_retention_until_idx" ON "items"("retention_until");

CREATE TABLE IF NOT EXISTS "compliance_retention_runs" (
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
