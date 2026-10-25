-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "libraryId" TEXT;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "corpusId" TEXT;

-- CreateTable
CREATE TABLE "LibraryExercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "impact" TEXT NOT NULL,
    "bodyAreas" TEXT[],
    "goals" TEXT[],
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramEnrollment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawText" TEXT,
    "energy" INTEGER NOT NULL,
    "soreness" INTEGER NOT NULL,
    "sleep" INTEGER,
    "painAreas" TEXT[],
    "focus" TEXT[],
    "minutes" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEnrollment_profileId_programId_key" ON "ProgramEnrollment"("profileId", "programId");

-- CreateIndex
CREATE INDEX "CheckIn_profileId_date_idx" ON "CheckIn"("profileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Program_corpusId_key" ON "Program"("corpusId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "LibraryExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

