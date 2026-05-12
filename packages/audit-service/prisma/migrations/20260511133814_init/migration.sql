/*
  Warnings:

  - The primary key for the `audit_retention_runs` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "audit_retention_runs" DROP CONSTRAINT "audit_retention_runs_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "audit_retention_runs_pkey" PRIMARY KEY ("id");
