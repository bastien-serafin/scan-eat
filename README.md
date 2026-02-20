# Scan Eat MVP

MVP full-stack: menu digital + commande via QR signé, avec dashboard établissement en temps réel.

## Stack

- Backend: NestJS + Prisma + PostgreSQL + Socket.IO
- Front: Next.js (client + `/admin`) + Tailwind + PWA légère
- Auth établissement: email/password + JWT
- Paiement: simulé par défaut, drapeau Stripe (`STRIPE_ENABLED`) prévu

## Monorepo

- `apps/api`: API NestJS, Prisma, seed, WebSocket
- `apps/web`: application Next.js (client mobile-first + admin)
- `docker-compose.yml`: PostgreSQL local

## Prérequis

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Installation

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Lancer le MVP

```bash
npm run dev
```

- Front: `http://localhost:3000`
- API: `http://localhost:4000`

## Générer un lien QR signé (24h)

Après le seed, récupérez un `tableId` depuis les logs, puis:

```bash
node apps/api/scripts/generate-qr-link.mjs --slug=le-bistrot-demo --table=<TABLE_ID>
```

Exemple de sortie:

`http://localhost:3000/e/le-bistrot-demo?t=...&exp=...&sig=...`

## Comptes et données seed

- Admin: `admin@scan-eat.local` / `admin1234`
- 1 établissement (`le-bistrot-demo`)
- 3 catégories
- 15 produits
- Options: retrait ingrédients + cuisson (produits viande)

## Fonctionnalités MVP

### Client

- Accès sans login via URL QR signée (HMAC + expiration 24h)
- Menu par catégories
- Personnalisation produit (retraits, cuisson)
- Panier + validation commande
- Suivi statut commande en temps réel (`NOUVELLE`, `EN_PREPA`, `PRETE`, `SERVIE`, `ANNULEE`)

### Établissement

- Login email/password
- Board commandes en temps réel
- Tri visuel par statut
- Mise à jour statut + marquage `seen`

## Endpoints principaux

- `POST /admin/auth/login`
- `GET /public/establishments/:slug/menu?t=&exp=&sig=`
- `POST /public/establishments/:slug/orders`
- `GET /public/orders/:orderId`
- `GET /admin/orders`
- `PATCH /admin/orders/:orderId/status`
- WebSocket namespace: `/realtime`
  - events: `order_created`, `order_status_updated`

## Tests / Qualité

```bash
npm run lint
npm run test
npm run test:e2e
```

Inclus:

- Tests API (unitaires + e2e HTTP happy path)
- 2 flows e2e Playwright happy path:
  - client: menu -> panier -> commande
  - admin: login -> board commandes

## Déploiement (simple)

1. Créer une base PostgreSQL managée.
2. Déployer `apps/api` (Render/Fly/railway/etc.) avec variables:
   - `DATABASE_URL`, `JWT_SECRET`, `QR_SECRET`, `PORT`
3. Exécuter `prisma migrate deploy` puis `prisma db seed`.
4. Déployer `apps/web` (Vercel/Netlify) avec:
   - `NEXT_PUBLIC_API_URL`
5. Activer CORS côté API pour le domaine front.

## Évolutions futures

- Multi-établissements réel + sélection établissement par utilisateur
- Rôles/permissions (`OWNER`, `MANAGER`, `KITCHEN`, `BAR`)
- Stripe Checkout/PaymentIntent réel + webhooks
- Impression cuisine/bar (imprimantes réseau)
- Historique, filtres avancés, analytics
- Offline/PWA avancée (cache menu + retry commandes)
- SLA sécurité: rotation secrets, audit logs, brute-force protection renforcée
