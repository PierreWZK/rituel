-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "essais" INTEGER,
ADD COLUMN     "essaisMax" INTEGER,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reussi" BOOLEAN;
