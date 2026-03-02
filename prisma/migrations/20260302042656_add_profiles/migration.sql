-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- Insert default profile for existing data
INSERT INTO "Profile" ("id", "name") VALUES ('default-profile', 'Default');

-- AlterTable: add column as nullable first
ALTER TABLE "WorkoutSession" ADD COLUMN "profileId" TEXT;

-- Assign existing sessions to default profile
UPDATE "WorkoutSession" SET "profileId" = 'default-profile' WHERE "profileId" IS NULL;

-- Make the column required
ALTER TABLE "WorkoutSession" ALTER COLUMN "profileId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
