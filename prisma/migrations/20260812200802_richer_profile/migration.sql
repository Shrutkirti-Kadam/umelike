-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "interestedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxDistanceKm" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prompt1" TEXT,
ADD COLUMN     "prompt2" TEXT,
ADD COLUMN     "prompt3" TEXT,
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "relationshipIntent" TEXT;
