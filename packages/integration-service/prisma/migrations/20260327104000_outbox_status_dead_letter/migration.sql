DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OutboxStatus') THEN
    CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'processing', 'published', 'dead_letter');
  END IF;
END
$$;

ALTER TABLE "outbox"
  ADD COLUMN IF NOT EXISTS "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "exhausted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "outbox_status_idx" ON "outbox"("status");
