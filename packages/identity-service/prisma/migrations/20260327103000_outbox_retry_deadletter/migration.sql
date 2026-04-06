ALTER TABLE "outbox"
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_error" TEXT,
  ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "outbox_failed_at_idx" ON "outbox"("failed_at");
