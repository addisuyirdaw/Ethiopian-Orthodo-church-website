-- Kale Awadi 4th Edition: one active council officer per role per parish.
-- Prisma schema cannot express partial unique indexes; applied at migration layer.
CREATE UNIQUE INDEX IF NOT EXISTS "sebeka_gubae_active_role_unique"
  ON "sebeka_gubae_seats" ("institution_id", "role")
  WHERE "is_active" = true;
