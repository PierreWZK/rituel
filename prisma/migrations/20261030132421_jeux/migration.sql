-- CreateEnum
CREATE TYPE "Categorie" AS ENUM ('MOTS', 'GEO', 'CHIFFRES', 'CULTURE', 'AUTRES');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlCle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" "Categorie" NOT NULL,
    "langue" TEXT NOT NULL,
    "renouvellement" TEXT NOT NULL DEFAULT 'à minuit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Game_urlCle_key" ON "Game"("urlCle");

-- CreateIndex
CREATE INDEX "Game_categorie_idx" ON "Game"("categorie");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
