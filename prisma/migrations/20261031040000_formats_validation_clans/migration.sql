-- CreateEnum
CREATE TYPE "Format" AS ENUM ('ESSAIS', 'SCORE', 'TEMPS', 'FAIT', 'AUTRE');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "format" "Format" NOT NULL DEFAULT 'ESSAIS',
ADD COLUMN     "formatAutre" TEXT,
ADD COLUMN     "formatMax" INTEGER,
ADD COLUMN     "valide" BOOLEAN NOT NULL DEFAULT true;

-- Les jeux déjà dans l'annuaire restent visibles ; seuls les nouveaux attendent la validation.
ALTER TABLE "Game" ALTER COLUMN "valide" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "valeur" INTEGER;

-- CreateTable
CREATE TABLE "ClanGame" (
    "clanId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "ClanGame_pkey" PRIMARY KEY ("clanId","gameId")
);

-- AddForeignKey
ALTER TABLE "ClanGame" ADD CONSTRAINT "ClanGame_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanGame" ADD CONSTRAINT "ClanGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

