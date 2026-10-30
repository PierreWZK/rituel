# Jour 18/30 — Rituel, tous vos jeux du jour, entre amis

> Stack : **Next.js**, **TypeScript**, **PostgreSQL** (Prisma) · hébergement **Coolify**, sous-domaine `rituel.projectp.fr`.
> Durée visée : **3 h** pour le MVP.

Ce document est notre contrat : on le suit étape par étape, et toute décision qui s'en écarte est d'abord notée ici. Il s'ajuste au début de la journée.

## 1. L'idée

Wordle, Sutom, Framed, Worldle… les jeux quotidiens se comptent par dizaines et chacun vit dans son onglet. **Rituel** les réunit : un **annuaire** de jeux journaliers, une **routine du jour** à cocher, et des **clans** pour comparer ses résultats avec ses amis. On colle le texte de partage d'un jeu, Rituel en lit le score et le convertit en points comparables.

## 2. MVP — ce qui doit fonctionner à la fin

1. **Annuaire** des jeux journaliers : fiche (nom, lien, description, catégorie, langue, heure de renouvellement), recherche et filtres par catégorie et par langue. Une vingtaine de jeux au lancement, dont les jeux du jour des projets du défi.
2. **Jeu du jour maison, « L'intrus du jour »** : dans l'annuaire comme les autres jeux, et compté dans les classements.
3. **Comptes** : connexion par lien magique (pas de mot de passe), pseudo et série 🔥.
4. **Ma routine** : on épingle des jeux depuis leur fiche ; chaque jour, une liste à cocher avec la progression et le lien direct vers chaque jeu.
5. **Résultats** : on colle le texte de partage (ex. `Wordle 1 234 3/6`) et Rituel lit le score ; sinon, saisie manuelle (réussi ou raté, nombre d'essais). Un seul résultat par jeu et par jour.
6. **Clans** : créer un clan, inviter par lien ou code, quitter ; **classement** avec les onglets Jour / Semaine / Mois et les filtres Global / par jeu ; fil des résultats du jour.
7. En ligne sur Coolify, avec un README à jour et un aperçu de lien (Open Graph).

### Périmètre volontairement limité

- Rituel ne remplace pas les jeux : il renvoie vers eux et ne lit que le texte de partage.
- Scores déclaratifs : on fait confiance aux joueurs, pas de vérification auprès des jeux.
- Pas de messagerie ni de temps réel : le fil du clan se met à jour au rechargement.
- Pas de file de validation : un jeu proposé est publié tout de suite ; l'administrateur peut le retirer.

## 3. Cahier des charges fonctionnel

### Annuaire

- Catégories : mots, géographie, chiffres et logique, culture (ciné, musique, jeux vidéo), autres.
- Un jeu proposé en double (même lien) est refusé avec un renvoi vers la fiche existante.

### Jour et routine

- Journée calée sur l'**heure de Paris** ; un résultat ne peut être saisi que pour le jour en cours.
- Barre de progression de la routine (jeux faits sur jeux épinglés).
- **Série 🔥** : un seul compteur par joueur, les jours consécutifs avec au moins un résultat. Affiché sur la routine et dans les classements.

### Résultats et points

- Les jeux qui ont un lecteur affichent « Score lu » ; les autres passent par la saisie manuelle.
- **Points** pour comparer des jeux différents : 0 si raté, sinon de 10 (dernier essai) à 100 (premier essai), proportionnellement au nombre d'essais.

### Clans

- Un fondateur, des membres, un code d'invitation régénérable.
- Classement : onglets **Jour / Semaine / Mois** ; filtres **Global** et un filtre par jeu.
- Le fil des résultats affiche les derniers résultats du clan du jour.
- Le fondateur peut exclure un membre ; un clan vide est supprimé.
- Un joueur peut appartenir à plusieurs clans.

## 4. Cahier des charges technique

- Next.js (App Router), Server Actions pour les formulaires, Prisma sur PostgreSQL.
- Modèles `User`, `Game`, `Pin` (routine), `Result`, `Clan`, `ClanMember`.
- Contrainte d'unicité `(user, game, day)` sur `Result` ; points calculés à l'enregistrement.
- Lecteurs de partage dans `src/lib/parsers/`, un par jeu, testés avec de vrais textes de partage.
- Auth.js en lien magique, limite de tentatives sur la connexion.
- Charte appliquée par des variables CSS (couleurs, rayons, verre) : voir la section 8.
- Mise en ligne sur Coolify à chaque push sur la branche principale.

## 5. Critères de réussite

- [ ] Les textes de partage des jeux du lancement donnent le bon score.
- [ ] Impossible d'enregistrer deux résultats pour le même jeu le même jour.
- [ ] Le classement du clan change dès qu'un membre enregistre un résultat.
- [ ] La journée bascule à minuit, heure de Paris.
- [ ] Les maquettes de `docs/maquettes` sont reprises fidèlement (accueil, classement du clan, composants).

## 6. Hors MVP

Rien pour ce jour. Les idées (rappel du soir, badges, duel, PWA, statistiques) seront reprises après la mise en ligne, si tu le demandes.

## 7. Définition du « terminé »

Le MVP fonctionne, les critères de la section 5 sont cochés, le site est en ligne sur `rituel.projectp.fr`, le README a son lien et sa capture, et la carte du projet passe à « terminé » sur la vitrine.

## 8. Décisions et charte

### Décisions (30/10/2026)

- **Nom et stack** : Rituel, `rituel.projectp.fr`, Next.js + TypeScript, Prisma sur PostgreSQL, Auth.js en lien magique.
- **Jeu du jour** : « L'intrus du jour ». Quatre jeux du catalogue ; il faut trouver celui qui n'est pas de la même catégorie. Même tirage pour tous, selon la date ; une tentative par jour, série 🔥, résultat à partager.
- **Coupe ultra** : saisie manuelle, un seul compteur de série, pas de file de validation, pas de bonus.
- **Maquettes** : onglets Jour / Semaine / Mois et conversion en points conservés, comme dans la charte.
- **Liste de lancement** : à valider avant le premier déploiement.

### Charte graphique « Sobre, net, vert menthe » (V1)

Maquettes dans [`docs/maquettes`](docs/maquettes) : charte, composants, accueil, classement du clan.

- **Palette** : nuit `#08130F` (fond), forêt `#0F2A21` (surfaces), menthe `#5CE6B0` (accent, actions), menthe pâle `#BFF5DF` (survols, liens), menthe profonde `#0E7A55` (accent sur clair), ambre `#FFB454` (séries, flamme), brume `#EAF4EF` (texte), sauge `#9DB5AB` (texte secondaire).
- **Typographie** : Outfit 600 pour les titres, DM Sans 400/500 pour le texte et l'interface, DM Mono pour les scores et les codes.
- **Verre** : fond blanc 6 %, bordure 1 px blanc 14 %, flou 24 px, lueur haute blanc 8 % à l'intérieur, rayons 12 / 20 / 28 px. Le texte posé sur le verre garde un contraste d'au moins 4,5:1.
- **Logo** : cercle avec coche et mot « rituel » en Outfit.
- **Composants** : boutons (principal menthe, secondaire verre), étiquettes de catégorie, carte de jeu, ligne de routine, zone « Coller un résultat », onglets de période, ligne de classement.

## 9. Aperçu du lien (à faire sans me le redemander)

- Image Open Graph **1200 × 630** stylisée aux couleurs du projet : nom, accroche, technos et capture, générée avec `scripts/og/build-og.py` (ajouter le projet à la liste).
- Sur chaque page publique : `og:title`, `og:description`, `og:url`, `og:image` (adresse absolue), `og:image:width`, `og:image:height`, `og:image:alt` et `twitter:card` = `summary_large_image`.
- Vérifier en ligne que l'image répond en 200 et que les balises sont servies.

## 10. Indexation (à faire sans me le redemander)

- `robots.txt` : pages privées et routes techniques (API, JSON, admin, routine, paramètres) en `Disallow`, lien vers le sitemap.
- `sitemap.xml` : les pages publiques uniquement (accueil, annuaire, fiches des jeux).
- Balise `canonical` sur chaque page publique ; `noindex` sur les pages privées.
- Données structurées JSON-LD sur l'accueil : `WebApplication`, avec `isPartOf` ProjectP (https://projectp.fr/).
- Lien « 30 jours, 30 projets » vers https://projectp.fr/ dans le pied de page.
- Vérifier en ligne, puis me rappeler de soumettre `https://rituel.projectp.fr/sitemap.xml` dans Google Search Console.

## 11. Vitrine 30days30projects (avec ma validation)

Une fois le projet en ligne, **me demander mon accord**, puis seulement :

- `projects.js` : l'entrée du jour 18 passe à `status: 'done'`, avec `name: 'Rituel'`, `title`, `stack`, `url`, `repo`, `image` et `description` (le titre et la stack du Kanban sont à remplacer).
- `preview-days-images/day18_rituel.png` : la capture de l'accueil, en 1600 × 900.
- `README.md` : la ligne du jour 18 dans le tableau des 30 projets.
- Commit et push du dépôt `30days30projects`.
