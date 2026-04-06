ALTER TABLE "outbox"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "outbox_updated_at_idx" ON "outbox"("updated_at");
