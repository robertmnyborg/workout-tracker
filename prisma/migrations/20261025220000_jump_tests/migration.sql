ALTER TABLE "Profile" ADD COLUMN "jumpBlockStart" TIMESTAMP(3);

CREATE TABLE "JumpTest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "standing" DOUBLE PRECISION,
    "approach" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JumpTest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JumpTest_profileId_date_idx" ON "JumpTest"("profileId", "date");

ALTER TABLE "JumpTest" ADD CONSTRAINT "JumpTest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
