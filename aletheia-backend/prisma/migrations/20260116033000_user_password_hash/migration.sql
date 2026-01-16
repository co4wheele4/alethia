-- =========================================================
-- Add password hash field to users (nullable, backward-safe)
-- =========================================================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

