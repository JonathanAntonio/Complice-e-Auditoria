/*
  Warnings:

  - The primary key for the `compliance_retention_runs` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "compliance_retention_runs" DROP CONSTRAINT "compliance_retention_runs_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "compliance_retention_runs_pkey" PRIMARY KEY ("id");
