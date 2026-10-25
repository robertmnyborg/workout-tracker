-- Chat coach: standing goal per profile, outside activity and override per check-in. Additive only.
ALTER TABLE "Profile" ADD COLUMN "goal" TEXT;
ALTER TABLE "Profile" ADD COLUMN "goalFocus" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CheckIn" ADD COLUMN "outsideActivity" JSONB;
ALTER TABLE "CheckIn" ADD COLUMN "override" BOOLEAN NOT NULL DEFAULT false;
