-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classementPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

