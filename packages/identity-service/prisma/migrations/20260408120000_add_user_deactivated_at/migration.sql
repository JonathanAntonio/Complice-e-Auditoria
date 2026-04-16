ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_deactivated_at_idx" ON "users"("deactivated_at");
