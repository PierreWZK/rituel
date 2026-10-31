# Rituel · Tous vos jeux du jour, entre amis

> Jour 18 du défi **30 jours, 30 projets** · Next.js · TypeScript · PostgreSQL · **https://rituel.projectp.fr**

![Rituel, la page d'accueil](docs/preview.png)

Wordle, Sutom, Framed, Worldle… les jeux quotidiens se comptent par dizaines. **Rituel** les réunit dans un annuaire que la communauté enrichit, transforme vos favoris en **routine du jour** à cocher, et vous laisse créer un **clan** pour comparer vos résultats avec vos amis.

📄 Les règles détaillées sont dans le [cahier des charges](CAHIER_DES_CHARGES.md).

## Au programme

- **Comptes** : un pseudo et un mot de passe suffisent ; l'e-mail est facultatif (connexion par lien, mot de passe oublié).
- **Annuaire** de jeux journaliers : recherche, catégories (mots, géo, chiffres, culture…), langue, heure de renouvellement.
- **Proposer un jeu** (e-mail validé requis) : l'administrateur reçoit un e-mail et l'accepte ou le refuse sur `/admin`.
- **Ma routine** : on épingle ses jeux, on les coche au fil de la journée, série 🔥.
- **Résultats** : on colle le texte de partage (`Wordle 1 234 3/6`) ou on saisit son score selon le format du jeu (essais, score sur N, temps, fait / pas fait). Tout est converti en points sur 100.
- **Clans** : invitation par lien ou code, jeux du clan ajoutés à la routine de chaque membre, classement du jour jeu par jeu et classement général, fil des résultats.
- **Classements publics** : jeu par jeu chaque jour, et un général (moyenne lissée des parties, à partir de 5 parties). Les joueurs qui l'ont choisi dans leur profil, et les clans à la moyenne de leurs membres.
- **Jeu du jour maison**, « L'intrus du jour », présent dans l'annuaire et compté dans les classements.

## Lancer en local

Rien à installer pour la base : `prisma dev` lance un PostgreSQL local.

```bash
npm install
npx prisma dev               # dans un terminal à part : affiche DATABASE_URL et SHADOW_DATABASE_URL
cp .env.example .env         # y coller les deux adresses, et un AUTH_SECRET (npx auth secret)
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

En local, sans `EMAIL_SERVER`, les e-mails (lien de connexion, confirmation d'adresse, proposition de jeu) s'affichent dans le terminal de `npm run dev`.

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
| `AUTH_URL` | `https://rituel.projectp.fr` : sans elle, derrière Coolify, les liens des e-mails pointent vers `localhost` |
| `EMAIL_SERVER` | le SMTP : `smtp://utilisateur:motdepasse@smtp.exemple.fr:587`, ou `smtps://…:465` sur le port 465 |
| `EMAIL_FROM` | `Rituel <rituel@projectp.fr>` |
| `ADMIN_EMAILS` | les administrateurs (valident les jeux, reçoivent les propositions), séparés par des virgules ; leur compte doit avoir cette adresse validée |

4. **Jeux de lancement** : après le premier déploiement, dans le terminal du conteneur, `npx prisma db seed` (une seule fois : relancé, il remettrait les jeux retirés par un administrateur).

## Stack

Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · Auth.js (lien magique) · Nodemailer · Coolify.

## Avant de déclarer le projet terminé

> Rappel pour Claude : à faire sur chaque projet, sans que je le redemande (détail dans les sections 9 et 10 du cahier des charges).

- **Indexation** : `robots.txt`, `sitemap.xml`, balise canonical, données structurées JSON-LD (`WebApplication` rattachée à ProjectP) et lien « 30 jours, 30 projets » vers https://projectp.fr/ dans le pied de page. Vérifier en ligne, puis me rappeler de soumettre `https://rituel.projectp.fr/sitemap.xml` dans Google Search Console.
- **Aperçu du lien** : image Open Graph stylisée 1200 × 630 aux couleurs du projet et balises `og:*` / `twitter:card`, vérifiées en ligne.
- **Vitrine** : la mise à jour de `30days30projects` (README et `projects.js`) se fait **après ma validation**.
