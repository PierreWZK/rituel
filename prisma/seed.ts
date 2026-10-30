// Jeux présents au lancement. Rejouable : chaque jeu est retrouvé par la clé de son adresse.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { cleUrl, slugifier, type CleCategorie } from "../src/lib/jeux.ts";

type Jeu = { nom: string; url: string; description: string; categorie: CleCategorie; langue: "fr" | "en" };

const JEUX: Jeu[] = [
  // Jeu maison
  { nom: "L'intrus du jour", url: "https://rituel.projectp.fr/intrus", categorie: "AUTRES", langue: "fr",
    description: "Quatre jeux de l'annuaire, un seul n'est pas de la même catégorie. Le jeu du jour de Rituel." },
  // Jeux du jour du défi 30 jours, 30 projets
  { nom: "Sursaut du jour", url: "https://sursaut.projectp.fr/", categorie: "AUTRES", langue: "fr",
    description: "Quatre épreuves de réflexes, les mêmes pour tout le monde, et votre profil du jour à partager." },
  { nom: "Partition du jour", url: "https://fugue.projectp.fr/", categorie: "CULTURE", langue: "fr",
    description: "Un runner musical : 32 mesures, trois vies, la même partition pour tous." },
  { nom: "Plus ou moins HN", url: "https://depeche.projectp.fr/", categorie: "CULTURE", langue: "fr",
    description: "Deux articles de Hacker News, lequel a eu le plus de points hier ?" },
  { nom: "Compte du tapis", url: "https://binktime.projectp.fr/", categorie: "CHIFFRES", langue: "fr",
    description: "Un tapis de jetons s'affiche quelques secondes : retrouvez son total en quatre essais." },
  { nom: "Teinte du jour", url: "https://craftly.projectp.fr/", categorie: "AUTRES", langue: "fr",
    description: "Retrouvez la couleur du jour, code HEX à l'appui, en cinq essais." },
  // Mots
  { nom: "Wordle", url: "https://www.nytimes.com/games/wordle/index.html", categorie: "MOTS", langue: "en",
    description: "Le classique : un mot de cinq lettres en six essais." },
  { nom: "Connections", url: "https://www.nytimes.com/games/connections", categorie: "MOTS", langue: "en",
    description: "Seize mots à ranger en quatre groupes de quatre." },
  { nom: "Sutom", url: "https://sutom.nocle.fr/", categorie: "MOTS", langue: "fr",
    description: "Le mot du jour en français, première lettre donnée, six essais." },
  { nom: "Le Mot", url: "https://wordle.louan.me/", categorie: "MOTS", langue: "fr",
    description: "Wordle en français : cinq lettres, six essais." },
  { nom: "Cémantix", url: "https://cemantix.certitudes.org/", categorie: "MOTS", langue: "fr",
    description: "Trouvez le mot secret en vous rapprochant de son sens." },
  { nom: "Pédantix", url: "https://cemantix.certitudes.org/pedantix", categorie: "CULTURE", langue: "fr",
    description: "Retrouvez la page Wikipédia cachée, mot après mot." },
  // Géo
  { nom: "Worldle", url: "https://worldle.teuteuf.fr/", categorie: "GEO", langue: "fr",
    description: "Reconnaissez un pays à sa silhouette, en six essais." },
  { nom: "Globle", url: "https://globle-game.com/", categorie: "GEO", langue: "en",
    description: "Trouvez le pays mystère : le globe se colore selon la distance." },
  { nom: "Travle", url: "https://travle.earth/", categorie: "GEO", langue: "en",
    description: "Reliez deux pays par le plus court chemin de frontières." },
  // Chiffres
  { nom: "Nerdle", url: "https://nerdlegame.com/", categorie: "CHIFFRES", langue: "en",
    description: "Wordle avec des calculs : trouvez l'égalité en six essais." },
  { nom: "Mathler", url: "https://www.mathler.com/", categorie: "CHIFFRES", langue: "en",
    description: "Trouvez l'opération qui donne le résultat du jour." },
  // Culture
  { nom: "Framed", url: "https://framed.wtf/", categorie: "CULTURE", langue: "en",
    description: "Devinez le film à partir de six images." },
  { nom: "Loldle", url: "https://loldle.net/", categorie: "CULTURE", langue: "en",
    description: "Le champion League of Legends du jour, indice après indice." },
  { nom: "Bandle", url: "https://bandle.app/", categorie: "CULTURE", langue: "en",
    description: "Reconnaissez la chanson, un instrument ajouté à chaque essai." },
];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

for (const jeu of JEUX) {
  const urlCle = cleUrl(jeu.url);
  if (!urlCle) throw new Error(`Adresse invalide : ${jeu.url}`);
  await prisma.game.upsert({
    where: { urlCle },
    update: { ...jeu },
    create: { ...jeu, urlCle, slug: slugifier(jeu.nom) },
  });
}

console.log(`${JEUX.length} jeux en place.`);
await prisma.$disconnect();
