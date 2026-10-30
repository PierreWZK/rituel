# Rituel · Tous vos jeux du jour, entre amis

> Jour 18 du défi **30 jours, 30 projets** · Next.js · TypeScript · PostgreSQL · **https://rituel.projectp.fr**

![Rituel, la page d'accueil](docs/preview.png)

Wordle, Sutom, Framed, Worldle… les jeux quotidiens se comptent par dizaines. **Rituel** les réunit dans un annuaire que la communauté enrichit, transforme vos favoris en **routine du jour** à cocher, et vous laisse créer un **clan** pour comparer vos résultats avec vos amis.

📄 Les règles détaillées sont dans le [cahier des charges](CAHIER_DES_CHARGES.md).

## Au programme

- **Annuaire** de jeux journaliers : recherche, catégories (mots, géo, chiffres, culture…), langue, heure de renouvellement.
- **Proposer un jeu** : n'importe quel compte peut en ajouter un, publié après validation.
- **Ma routine** : on épingle ses jeux, on les coche au fil de la journée, séries 🔥 par jeu et de routine complète.
- **Résultats** : on colle le texte de partage (`Wordle 1 234 3/6`), Rituel en lit le score et le convertit en points comparables d'un jeu à l'autre.
- **Clans** : invitation par lien ou code, classements du jour, de la semaine et du mois, global et par jeu, fil des résultats.
- **Jeu du jour maison**, présent dans l'annuaire et compté dans les classements.

## Lancer en local

Rien à installer pour la base : `prisma dev` lance un PostgreSQL local.

```bash
npm install
npx prisma dev               # dans un terminal à part : affiche DATABASE_URL et SHADOW_DATABASE_URL
cp .env.example .env         # y coller les deux adresses, et un AUTH_SECRET (npx auth secret)
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

En local, sans `EMAIL_SERVER`, le lien de connexion s'affiche dans le terminal de `npm run dev`.

```bash
npm test                     # tests unitaires (node --test)
```

## Mise en ligne

Rituel tourne sur un VPS géré avec **[Coolify](https://coolify.io)** : **https://rituel.projectp.fr**.

```
git push (main) ──► Coolify : nouvelle image (Dockerfile) ──► prisma migrate deploy ──► site à jour
```

1. **Base** : *+ New → Database → PostgreSQL*, noter l'URL interne.
2. **Application** : *+ New → Repository* → le dépôt GitHub, branche `main`, **Build Pack : Dockerfile**, port **3000**, domaine `https://rituel.projectp.fr` (DNS `A` de `rituel` vers le VPS), déploiement automatique à chaque push.
3. **Variables d'environnement** (jamais versionnées) :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | l'URL interne de l'étape 1 |
| `AUTH_SECRET` | une chaîne aléatoire (`openssl rand -base64 32`) |
| `EMAIL_SERVER` | le SMTP d'envoi des liens de connexion : `smtp://utilisateur:motdepasse@smtp.exemple.fr:587` |
| `EMAIL_FROM` | `Rituel <rituel@projectp.fr>` |
| `ADMIN_EMAILS` | les adresses autorisées à retirer un jeu, séparées par des virgules |

4. **Jeux de lancement** : après le premier déploiement, dans le terminal du conteneur, `npx prisma db seed` (une seule fois : relancé, il remettrait les jeux retirés par un administrateur).

## Stack

Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · Auth.js (lien magique) · Nodemailer · Coolify.

## Avant de déclarer le projet terminé

> Rappel pour Claude : à faire sur chaque projet, sans que je le redemande (détail dans les sections 9 et 10 du cahier des charges).

- **Indexation** : `robots.txt`, `sitemap.xml`, balise canonical, données structurées JSON-LD (`WebApplication` rattachée à ProjectP) et lien « 30 jours, 30 projets » vers https://projectp.fr/ dans le pied de page. Vérifier en ligne, puis me rappeler de soumettre `https://rituel.projectp.fr/sitemap.xml` dans Google Search Console.
- **Aperçu du lien** : image Open Graph stylisée 1200 × 630 aux couleurs du projet et balises `og:*` / `twitter:card`, vérifiées en ligne.
- **Vitrine** : la mise à jour de `30days30projects` (README et `projects.js`) se fait **après ma validation**.
