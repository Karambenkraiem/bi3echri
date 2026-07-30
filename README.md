# Bi3Echri — Gestion achat/vente d'articles

Application de gestion de stock, achats et ventes d'articles divers (PC, matériel de
bricolage, pièces informatiques, petit électroménager, etc.), avec suivi des marges et
tableau de bord d'aide à la décision.

- **Backend** : NestJS + Prisma + PostgreSQL (API REST, JWT, rôles admin/vendeur)
- **Frontend** : Next.js (App Router) + Tailwind CSS + Recharts, responsive et installable
  en PWA sur mobile
- **Base de données** : PostgreSQL
- **Dockerisé** : backend, frontend et PostgreSQL tournent chacun en conteneur, avec un
  compose dédié pour le développement et un autre pour la production

## Structure du projet

```
Bi3Echri/
├── docker-compose.yml       # Dev : postgres + adminer + backend + frontend (hot-reload)
├── docker-compose.prod.yml  # Prod : images buildées, pas de bind mount
├── .env.prod.example        # Variables requises pour docker-compose.prod.yml
├── backend/                 # API NestJS (Dockerfile multi-stage : dev / build / production)
└── frontend/                # App Next.js (Dockerfile multi-stage : dev / build / production)
```

## Prérequis

- Docker Desktop
- Node.js 20+ (uniquement si vous préférez lancer les apps en natif, sans Docker)

## Démarrage avec Docker (recommandé)

Tout le projet (PostgreSQL + backend + frontend) démarre en une seule commande :

```bash
docker compose up -d --build
```

- Frontend : http://localhost:3000
- Backend : http://localhost:3001/api
- Adminer (admin DB) : http://localhost:8080
- Postgres : `localhost:5432` (user/password/db : `bi3echri`/`bi3echri`/`bi3echri`)

Le backend applique automatiquement les migrations Prisma (`prisma migrate deploy`) à
chaque démarrage du conteneur. Pour peupler la base (catégories par défaut + compte
admin), lancez une seule fois :

```bash
docker compose exec backend npx prisma db seed
```

Compte admin créé par le seed : **admin@bi3echri.local** / **admin123** (à changer après
la première connexion). Le seed crée aussi un compte **demo.vendeur@bi3echri.local** /
**demo123**, utilisé par la liste d'accès rapide de la page de connexion quand le mode
démonstration est activé (`/settings`, admin).

### Réinitialiser toutes les données (sauf les comptes admin)

`backend/prisma/reset.ts` (script `npm run db:reset`) supprime **toutes** les données de
l'application — articles, photos, ventes, dépenses, historique Canaouite, fournisseurs,
catégories, réglages — ainsi que tous les comptes utilisateurs qui n'ont **pas** le rôle
ADMIN (et leurs avatars). Les comptes ADMIN sont préservés tels quels. Irréversible :
à utiliser uniquement quand on veut repartir d'une base propre en gardant l'accès admin.

```bash
docker compose exec backend npm run db:reset
docker compose exec backend npx prisma db seed   # repeuple catégories + Canaouite (7000 DT) + compte démo
```

Le code source de `backend/` et `frontend/` est monté en volume dans les conteneurs dev
(`target: dev` dans `docker-compose.yml`), donc les modifications sont prises en compte
sans reconstruire l'image — à une limitation près, voir **Notes techniques** plus bas.

Pour tout arrêter : `docker compose down` (les données Postgres persistent dans le volume
`postgres_data` ; ajoutez `-v` pour tout effacer).

## Déploiement en production

`docker-compose.prod.yml` build les images en mode production (Next.js en sortie
`standalone`, backend compilé et sans devDependencies) et ne fait aucun bind-mount.

```bash
cp .env.prod.example .env.prod
# éditer .env.prod avec de vraies valeurs (mot de passe DB, JWT_SECRET, domaines, etc.)

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Points importants :
- `NEXT_PUBLIC_API_URL` est **figé au moment du build** du frontend (variable publique
  Next.js, inlinée dans le bundle navigateur) — si l'URL de l'API change, il faut
  reconstruire l'image frontend.
- Postgres n'expose pas de port sur l'hôte par défaut en prod (accessible uniquement via
  le réseau interne Docker) ; décommentez la section `ports` dans
  `docker-compose.prod.yml` si un accès direct est nécessaire.
- Le seed n'est pas exécuté automatiquement en prod (il est idempotent, mais volontairement
  manuel) : `docker compose -f docker-compose.prod.yml exec backend npx prisma db seed`
  ne fonctionnera pas tel quel car l'image de production ne contient pas `ts-node`
  (devDependency) — pour seeder une base de prod, pointez `DATABASE_URL` vers elle depuis
  un environnement de dev (`backend/.env`) et lancez `npx prisma db seed` en local.

## Démarrage sans Docker (alternative native)

### Base de données

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
npm install
npx prisma migrate dev   # crée les tables
npx prisma db seed       # crée les catégories par défaut + un compte admin
npm run start:dev        # API sur http://localhost:3001/api
```

Variables d'environnement (`backend/.env`) :
- `DATABASE_URL` — connexion PostgreSQL
- `JWT_SECRET` — secret de signature des tokens (à changer en production)
- `JWT_EXPIRES_IN` — durée de validité du token (défaut `7d`)

### Frontend

```bash
cd frontend
npm install
npm run dev               # app sur http://localhost:3000
```

Variable d'environnement (`frontend/.env.local`) :
- `NEXT_PUBLIC_API_URL` — URL de l'API backend (défaut `http://localhost:3001/api`)

## Fonctionnalités

- **Authentification** par JWT, deux rôles : `ADMIN` (gestion des utilisateurs) et
  `VENDEUR` (gestion du stock et des ventes au quotidien) — les deux rôles peuvent créer
  et modifier articles et catégories ; suppression réservée à l'admin
- **Profil utilisateur** : chaque utilisateur modifie son propre nom/téléphone/bio, sa
  photo de profil, et son **mot de passe** (mot de passe actuel requis, confirmation du
  nouveau, message de succès) sur `/profile` ; l'admin clique sur un utilisateur dans
  `/users` pour accéder à sa **page de détail** (`/users/[id]`) — infos personnelles, et
  modification nom/email/rôle (sauf son propre rôle)
- **Stock** : ajout **et modification** d'un article avec catégorie, état (neuf/occasion),
  prix et date d'achat, fournisseur/source d'achat, jusqu'à **10 photos** par article
  (aperçu avant envoi, miniature dans la liste) — possibilité de créer une nouvelle
  catégorie à la volée directement depuis le formulaire d'ajout. La modification d'un
  article permet aussi de **supprimer une photo existante ou d'en ajouter d'autres**
  (dans la limite de 10 au total). Cliquer sur un article ouvre sa **page de détail**
  (`/articles/[id]`) : toutes les infos, galerie photo, caractéristiques, détails de la
  vente si l'article est vendu, et actions Vendre / Modifier / Supprimer / **Ajouter au
  stock** (réapprovisionnement : augmente la quantité, avec un coût optionnel qui diminue
  la Canaouite comme un nouvel achat).
- **Catégories hiérarchiques** : ex. Informatique > PC/Pièces/Accessoires, avec attributs
  spécifiques flexibles (marque, processeur, RAM... uniquement pour la sous-catégorie PC)
- **Fournisseurs** (`/fournisseurs`) : répertoire à deux catégories — **Souks/marchés**
  (juste un nom, ex. Sou9 Elkram, Sou9 Radès) et **Particuliers** (nom, téléphone, lieu
  de rendez-vous obligatoires). Gestion complète (ajout/modification/suppression) ouverte
  aux deux rôles. Le champ "Fournisseur / où acheté" du formulaire d'article est un menu
  déroulant listant ce répertoire (groupé par Souks/Particuliers) ; un bouton
  "+ Nouveau fournisseur" permet d'en créer un directement depuis le formulaire d'article
  s'il n'existe pas encore, sans quitter la modale (sélectionné automatiquement une fois
  créé). Le champ reste une chaîne libre en base (nom du fournisseur), pas une clé
  étrangère, donc une valeur historique non présente dans le répertoire (ancien texte
  libre ou fournisseur supprimé/renommé) reste visible dans la liste comme option isolée
  à l'édition, plutôt que d'être silencieusement effacée.
- **Canaouite (caisse)** (`/canaouite`) : solde cliquable depuis la barre de navigation,
  affichant l'historique complet des mouvements (achats, ventes, dépenses, ajustements,
  investissements) dans un tableau triable. Diminue automatiquement à l'achat d'un
  article et augmente à la vente. Un **vendeur** peut ajuster librement le solde (`POST
  /treasury/adjust`, + ou -) pour corriger un écart de caisse, et modifier/supprimer les
  ajustements. Un **admin** dispose d'un **privilège supérieur** : il peut à la fois
  **alimenter** la caisse (`POST /treasury/invest`, montant positif uniquement, pour
  enregistrer un investissement externe comme entrée) et faire un **ajustement libre**
  comme le vendeur (`POST /treasury/adjust`), et il peut modifier/supprimer n'importe quel
  mouvement d'ajustement ou d'alimentation (pas seulement les siens). Les mouvements liés
  à un achat/vente/Massrouf ne sont pas éditables directement ici (ils suivent le cycle de
  vie de l'article/la vente/le Massrouf correspondant).
- **Massrouf** (`/massrouf`) : n'importe quel utilisateur (admin ou vendeur) enregistre
  une dépense (montant + commentaire bref sur son usage), ce qui diminue la Canaouite
  d'autant. Cliquer sur une ligne ouvre le détail avec possibilité de **modifier** ou
  **supprimer** l'entrée (le mouvement de caisse lié est mis à jour ou supprimé en même
  temps, pour garder le solde cohérent). Tableau triable par colonne, filtrable par
  utilisateur.
- **Dernier prix prévu de vente** (optionnel, sur l'article) : champ indicatif
  renseigné à l'ajout/modification d'un article pour noter le prix de vente visé. Il
  préremplit le champ "Prix de vente" au moment de vendre l'article (reste modifiable),
  et n'a aucun effet sur la Canaouite tant que la vente n'est pas confirmée.
- **Vente** : marquer un article comme vendu avec prix de vente, acheteur (nom/contact)
  et canal d'annonce (Leboncoin, Vinted, Facebook Marketplace, eBay, autre) — la marge
  est calculée automatiquement (prix de vente − prix d'achat)
- **Historique des ventes** avec marge par transaction
- **Tableau de bord** (aide à la décision) :
  - Marge par catégorie (quelles catégories sont les plus rentables)
  - Chiffre d'affaires et marge dans le temps (tendance mensuelle)
  - Vitesse de rotation du stock par catégorie (délai moyen achat → vente)
  - Performance par canal d'annonce (où vendre en priorité)
- **PWA** : manifeste installable, responsive mobile-first
- **Thème clair/sombre** : bascule manuelle dans la barre de navigation (icône
  soleil/lune), préférence mémorisée par navigateur (`localStorage`), appliquée sans
  flash au chargement. Par défaut, suit la préférence système au premier lancement.
- **Page de connexion** : habillage sombre "tech" (dégradé, halos, grille en filigrane),
  inspiré d'une maquette fournie par l'utilisateur — recréé en CSS, pas d'image externe
  utilisée.
- **Mode démonstration** (`/settings`, admin) : interrupteur global, **désactivé par
  défaut** (y compris après un rebuild Docker, puisque persisté en base). Quand activé,
  la page de connexion affiche une liste d'accès rapide (comptes Admin et Vendeur de
  démonstration, connexion en un clic).
- **Tri et filtres** : Stock, Utilisateurs et Massrouf ont des colonnes triables (cliquer
  l'en-tête, cliquer à nouveau pour inverser l'ordre). Stock filtrable aussi par état
  (neuf/occasion) ; Massrouf filtrable par utilisateur.
- **Devise** : tous les montants (stock, ventes, tableau de bord) sont affichés en **DT**
  (dinar tunisien, 3 décimales), au lieu de l'euro utilisé initialement.

## Vérifications effectuées

- Backend : build TypeScript propre, migration + seed appliqués, testé de bout en bout
  via API (login, création d'article, vente, calcul de marge, endpoints analytics,
  contrôle d'accès par rôle admin/vendeur) — tous les résultats sont corrects.
- Fournisseurs : validation testée (un Particulier sans téléphone est rejeté en 400, un
  Souk n'a besoin que d'un nom).
- Réapprovisionnement (`/articles/:id/restock`) : testé — la quantité augmente et le coût
  optionnel est bien déduit de la Canaouite comme un achat.
- Canaouite/Massrouf : testé de bout en bout avec un compte admin et un compte vendeur —
  admin et vendeur peuvent tous deux créer/modifier/supprimer un Massrouf, faire un
  ajustement libre (+ ou -) et modifier/supprimer un mouvement d'ajustement ; seul
  l'admin peut alimenter la caisse (montant positif, bloqué à 403/400 pour le vendeur) ;
  solde recalculé correctement après achat/vente/dépense/ajustement/investissement.
- Profil : mise à jour nom/téléphone/bio et upload de photo de profil testés via API.
- Frontend : build de production (`next build`) sans erreur TypeScript, pages
  server-rendues vérifiées (login, dashboard, manifest PWA).
- Docker : `docker compose up -d --build` testé à partir de zéro (`docker compose down`
  puis rebuild complet) — les 4 conteneurs démarrent sains, l'API et le frontend
  répondent correctement via leurs ports respectifs.
- **Non vérifié visuellement** : cet environnement ne dispose pas d'outil de navigateur
  automatisé, donc le rendu réel des graphiques, la mise en page mobile et le flux de
  connexion n'ont pas été testés à l'œil dans un navigateur. À vérifier manuellement
  avant mise en production.

## Notes techniques

- **Photos** : stockées sur disque dans `backend/uploads/articles/<id>/` (servi via
  `/uploads/...` à la racine de l'API, hors préfixe `/api`), pas en base. En dev, ce
  dossier vit directement dans `backend/uploads` grâce au bind-mount (ignoré par git) ; en
  prod, un volume nommé `uploads_data_prod` le rend persistant. Ajout et suppression de
  photos sont possibles aussi bien à la création qu'à la modification d'un article. Les
  photos de profil suivent le même principe dans `backend/uploads/avatars/<userId>/`.
- Bug trouvé et corrigé pendant les tests : après suppression d'une photo suivie d'un
  nouvel ajout, deux photos pouvaient recevoir le même `order` (calculé à partir du
  nombre de photos restantes plutôt que de l'ordre maximum existant) — corrigé dans
  `ArticlesService.addPhotos`.
- **Canaouite** : implémentée comme un registre de mouvements (`CashMovement`) — achat,
  vente, dépense (Massrouf), ajustement manuel (vendeur) et investissement (admin) —
  plutôt qu'un simple compteur, pour garder un historique auditable et calculer le solde
  par somme (`GET /treasury/movements`). Le solde initial de 7000 DT est inséré par le
  seed ; si vous mettez à jour une base existante, relancez `npx prisma db seed` (ou
  `docker compose exec backend npx prisma db seed`) une fois après la migration pour
  l'initialiser. Modifier/supprimer un Massrouf met à jour ou supprime le mouvement de
  caisse lié — ce n'est donc pas un registre strictement immuable, la correction d'erreur
  de saisie primant ici sur l'inaltérabilité totale de l'historique.
- Un utilisateur ayant déjà de l'activité (article créé, vente, mouvement de caisse...) ne
  peut pas être supprimé (contrainte de clé étrangère) — l'API renvoie une erreur 400
  explicite plutôt qu'un crash.
- Les binaires Prisma/adminer peuvent nécessiter plusieurs tentatives de téléchargement
  selon la stabilité du réseau (des coupures TLS intermittentes ont été observées lors du
  développement sur cette machine).
- Aucun composant shadcn/ui n'a été généré : l'interface utilise des primitives Tailwind
  maison (`components/ui`) pour limiter les dépendances réseau supplémentaires — le rendu
  reste simple mais cohérent.
- **Après un `npx prisma migrate dev` en local (hors Docker)**, le conteneur `backend` dev
  garde un client Prisma généré au moment du build dans un volume anonyme
  (`node_modules`) — un simple `docker compose up -d --build backend` ne suffit pas
  toujours à le rafraîchir. Si des erreurs TypeScript mentionnent des propriétés Prisma
  manquantes après un changement de schéma, relancer avec
  `docker compose up -d --build --renew-anon-volumes backend frontend`.
- **Hot-reload en conteneur** : le code est monté en bind-mount dans les conteneurs dev et
  le polling de fichiers est activé (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`,
  `watchOptions` dans `backend/tsconfig.json`) pour contourner la limitation classique de
  Docker Desktop sur Windows (les évènements inotify ne traversent pas toujours le
  bind-mount hôte → conteneur Linux). Dans certaines configurations Docker Desktop
  (notamment sans backend WSL2), le rechargement automatique peut malgré tout rester peu
  fiable. Si une modification n'apparaît pas après quelques secondes :
  `docker compose restart backend` (ou `frontend`). Pour un confort de développement
  maximal au quotidien, l'alternative native (`npm run start:dev` / `npm run dev` en
  dehors de Docker) reste la plus réactive ; `docker compose up -d --build` est la
  référence pour vérifier que le projet complet tourne correctement de bout en bout.
