ALTER TABLE "items"
  ADD COLUMN IF NOT EXISTS "dismissal_justification" TEXT,
  ADD COLUMN IF NOT EXISTS "dismissal_approved_by" TEXT;
