ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER DEFAULT 0;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "blocked_until" TIMESTAMP(3);

UPDATE "users"
SET "is_active" = true
WHERE "is_active" IS NULL;

UPDATE "users"
SET "failed_login_attempts" = 0
WHERE "failed_login_attempts" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "is_active" SET NOT NULL;

ALTER TABLE "users"
ALTER COLUMN "failed_login_attempts" SET NOT NULL;
