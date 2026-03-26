-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "authorization_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_primary_role_per_user_key" ON "user_roles"("user_id") WHERE "is_primary" = true;

-- Backfill user_roles from current users.role values before dropping the legacy column.
INSERT INTO "roles" ("id", "code", "name", "is_system", "created_at", "updated_at")
VALUES
    ('role-administrador', 'administrador', 'Administrador', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role-compliance-officer', 'compliance_officer', 'Compliance Officer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role-auditor-interno', 'auditor_interno', 'Auditor Interno', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role-auditor-externo', 'auditor_externo', 'Auditor Externo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role-gestor', 'gestor', 'Gestor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role-visualizador', 'visualizador', 'Visualizador', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

DO $$
DECLARE
    unmapped_roles TEXT;
BEGIN
    SELECT string_agg(DISTINCT COALESCE(NULLIF(u."role", ''), 'visualizador'), ', ' ORDER BY COALESCE(NULLIF(u."role", ''), 'visualizador'))
    INTO unmapped_roles
    FROM "users" u
    LEFT JOIN "roles" r ON r."code" = COALESCE(NULLIF(u."role", ''), 'visualizador')
    WHERE r."id" IS NULL;

    IF unmapped_roles IS NOT NULL THEN
        RAISE EXCEPTION 'Unmapped legacy roles found in users.role: %', unmapped_roles;
    END IF;
END $$;

INSERT INTO "user_roles" ("user_id", "role_id", "is_primary", "assigned_at")
SELECT
    u."id",
    r."id",
    true,
    CURRENT_TIMESTAMP
FROM "users" u
LEFT JOIN "roles" r ON r."code" = COALESCE(NULLIF(u."role", ''), 'visualizador')
ON CONFLICT ("user_id", "role_id") DO NOTHING;

ALTER TABLE "users" DROP COLUMN "role";

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent deletion of built-in/system roles.
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."is_system" = true THEN
        RAISE EXCEPTION 'Cannot delete system role: %', OLD."code";
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_system_roles
BEFORE DELETE ON "roles"
FOR EACH ROW
EXECUTE FUNCTION prevent_system_role_deletion();
