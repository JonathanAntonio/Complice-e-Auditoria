ALTER TABLE "roles"
ALTER COLUMN "is_system" SET DEFAULT false;

-- Keep at most one primary role per user before creating the partial unique index.
WITH ranked_primary_roles AS (
  SELECT
    "user_id",
    "role_id",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id"
      ORDER BY "assigned_at" DESC, "role_id" ASC
    ) AS row_num
  FROM "user_roles"
  WHERE "is_primary" = true
)
UPDATE "user_roles" ur
SET "is_primary" = false
FROM ranked_primary_roles rpr
WHERE ur."user_id" = rpr."user_id"
  AND ur."role_id" = rpr."role_id"
  AND rpr.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_primary_role_per_user_key"
ON "user_roles"("user_id")
WHERE "is_primary" = true;
