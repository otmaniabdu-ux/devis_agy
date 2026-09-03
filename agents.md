# AGENTS.MD — Guide & Directives pour l'Agent AI (El Mouhssinoune Tours — Omra & Hadj VIP Quotes)

Ce document définit l'architecture, les conventions, les règles de développement inviolables et la structure métier de l'application **El Mouhssinoune Tours — Omra & Hadj VIP Quotes**. Tout agent AI ou développeur intervenant sur ce projet **MUST** respecter strictement ces instructions.

---

## 1. Vue d'Ensemble & Mission

L'application **El Mouhssinoune Tours — Omra & Hadj VIP Quotes** (`devis-agy`) est une solution web et desktop complète conçue pour la création, le calcul financier précis, la gestion et la génération de devis/programmes PDF professionnels pour des séjours d'Omra et Hadj VIP sur-mesure.

- **Client Cible / Marque** : El Mouhssinoune Tours (المحسنون للسياحة) - Agence de Voyages & Tourisme.
- **Monnaie Principale de Vente** : Dinar Algérien (**DZD**).
- **Devises Source d'Achat** : Riyal Saoudien (**SAR**), Dollar Américain (**USD**), Euro (**EUR**).

---

## 2. Stack Technique & Architecture

- **Framework Web** : Next.js 16 (App Router) + React 19.
- **Langage** : TypeScript strict.
- **Styling** : Tailwind CSS v4 + Thème Liquid Glass (Noir Profond #1C1917 / Or #A16207) + Radix UI + Lucide React + Framer Motion + `sonner` (toasts).
- **ORMs & Base de Données** : Prisma 6 + SQLite local (`db/custom.db`, 100% hors-ligne, compatible Tauri).
- **Catalogue Hôtels** : 118 hôtels réels (3★, 4★, 5★) à Makkah (64) et Médine (54) extraits de Booking.com avec noms en Arabe, distances exactes au Haram et grille tarifaire complète en SAR (Single, Double, Triple, Quadruple).
- **Catalogue Compagnies** : 25 compagnies aériennes actives au départ de l'Algérie et en transit Hajj/Omra.
- **Calcul Financier** : `decimal.js` (Précision 28 décimales, arrondi `ROUND_HALF_UP`).
- **Génération PDF** : `@react-pdf/renderer` avec rendu serveur optimisé (`src/lib/pdfRenderer.ts`), polices embarquées (DejaVu / Helvetica) et téléchargement Blob (`downloadPdf`) compatible WebView2 / Tauri v2 (Variantes: `client`, `interne`, `programme` sans prix).
- **Runtime / Executable** : Bun (utilisé pour les scripts et comme moteur d'exécution local).
- **Application Desktop Native** : Tauri v2 (pour un mode fenêtre native). En production, un **Sidecar Bun** est embarqué pour faire tourner le serveur Next.js en tâche de fond, bindé exclusivement sur `127.0.0.1:14242`.
- **Tests** : Vitest (fichiers `*.test.ts` dans `src/domain/__tests__/`).
- **Scripts d'Automatisation** : `scripts/populate-hotels-booking.ts`, `scripts/seed-cloud.ts`, `scripts/build-tauri.ts`.

---

## 3. Règles Inviolables & Conventions de Code

### A. Calculs Financiers Stricts (`src/lib/money.ts` & `src/lib/calculDevis.ts`)
1. **ZÉRO `number` JS pour les montants monétaires** : Tous les prix, sous-totaux, coûts nets, marges et taux de change sont stockés sous forme de `String` (decimal TEXT) et manipulés exclusivement avec l'objet `Decimal` de `decimal.js`.
2. **Arrondi Standard** : Utilisation de `Decimal.ROUND_HALF_UP` à 2 décimales pour l'affichage (`round2`, `formatMoney`).
3. **Verrouillage des Taux de Change** : Lors de la création d'un devis (`Devis`), les taux de change actuels (`tauxSarDzd`, `tauxUsdDzd`, `tauxEurDzd`) sont copiés dans le record `Devis`. Ils ne doivent **jamais** être recalculés avec les taux globaux postérieurs pour préserver l'historique financier exact.
4. **Frais ONPO (Non Commissionables)** : Les frais ONPO (`fraisOnpoPrixUnit`, par défaut 5000 DZD par passager) sont toujours inclus dans le devis et ne subissent aucune marge agence (`pvLigne = montantDzd`). La marge (en % ou montant fixe) est répartie exclusivement sur les lignes de prestations commissionables.

### B. Numérotation des Devis
- Format strict : `DEVIS-YYYY-MM-NNN` (ex: `DEVIS-2026-08-001`).
- La fonction `attribuerNumeroDevis` dans `src/lib/calculDevis.ts` gère l'incrémentation atomique avec la table `CompteurNumerotation` et effectue des boucles de sécurité anti-collision.

### C. Gestion des Passagers et Tarification Vol / Train / Hadj / ONPO
- Les passagers sont catégorisés : `adulte`, `enfant_avec_lit`, `enfant_sans_lit`, `bebe`.
- **Vols / Billet** : Saisie complète du billet Aller/Retour avec champs distincts pour le vol Aller (`origine`, `destination`, `dateVol`, `classe`) et le vol Retour (`origineRetour`, `destinationRetour`, `dateVolRetour`, `classeRetour`), partageant la même compagnie et tarification globale.
- **Hadj VIP** : Gestion des camps tentes VIP à Mina/Arafat (`CampMashair`) et transport interne (`TransportMashair`).
- **Frais ONPO** : 5000 DZD/passager par défaut, modifiable librement (même à 0 DZD).

### D. Génération & Téléchargement PDF sous Tauri
- Les boutons d'exportation PDF utilisent la fonction `downloadPdf(devisId, variante, devisNumero)` de `src/lib/client-utils.ts`.
- Variantes disponibles :
  - `client` : Devis complet avec prix de vente TTC par prestation.
  - `interne` : Devis avec coûts nets, marge agence et devises sources.
  - `programme` : Programme de voyage complet **sans aucun prix** (idéal pour partage d'itinéraire).

### E. Typage Strict & Gestion des Erreurs
1. **ZÉRO `any` autorisé** : Les Use Cases (`DevisUseCases`, `CatalogueUseCases`, etc.) et les routeurs API doivent utiliser des types explicites (souvent inférés depuis Zod, ex: `CreateDevisInput`).
2. **Erreurs Typées** : Il est formellement interdit d'utiliser `catch (error: any)`. Utilisez `catch (error: unknown)` et passez l'erreur à la fonction utilitaire `getErrorMessage(error)` de `src/lib/errors.ts`.
3. **Tests Unitaires** : Tout nouveau Use Case ou algorithme financier (ex: `PricingEngine.ts`) doit être couvert par un test Vitest (`bun run test`).
4. **Qualité Automatisée** : `bun run lint` doit rester à **0 erreur** (obligatoire) ; les `console.error` des routes API sont tolérés (journalisation serveur). Le hook de sécurité serveur est `src/proxy.ts` (convention Next.js 16, ex-`middleware.ts`).

---

## 4. Schéma de Base de Données (Prisma)

Le schéma se trouve dans `prisma/schema.prisma`. Modèles clés :

| Modèle | Description |
| :--- | :--- |
| `ParametresAgence` | Configuration singleton de l'agence (Noms FR/AR, coordonnées, couleurs, logo). |
| `TauxChange` | Taux de change globaux par défaut (SAR, USD, EUR en DZD). |
| `CompteurNumerotation` | Clé mensuelle (`DEVIS-YYYY-MM`) pour l'attribution atomique des numéros. |
| `Client` | Fiche client (particulier ou société, coordonnées, alertes passeport). |
| `Devis` | En-tête du devis avec dates, taux de change verrouillés, type de visa, frais ONPO, marge, totaux DZD. |
| `Passager` | Passager rattaché au devis avec catégorie d'âge et infos passeport. |
| `SegmentVol` | Segment aérien avec origines/destinations Aller et Retour, dates, classes et tarifs par tranche. |
| `Hebergement` | Séjour hôtel (Makkah / Médine), type de chambre, formule repas, vue (Kaaba/Haram/City), nuitées. |
| `Transfert` | Transfert terrestre (GMC Yukon, Mercedes Classe E, Bus VIP) et trajet. |
| `TrainHaramain` | Trajet en train à grande vitesse Haramain (Économique / Business) avec date et heure. |
| `CampMashair` | Tentes et camps VIP Mina & Arafat avec formule repas et literie. |
| `TransportMashair` | Circuit interne transport Mashair (Bus Exécutif, SUV VIP). |
| `PrestationVIP` | Services sur-mesure (Ziyarate, Lounge VIP, Fast-Track, Zamzam, etc.). |
| `CatalogueHotel` | Catalogue des 118 hôtels Booking.com (3*, 4*, 5*) à Makkah et Médine avec tarifs SAR. |
| `CatalogueCompagnie` | Catalogue des 25 compagnies aériennes partenaires au départ de l'Algérie. |

---

## 5. Structure de l'Arborescence (`src/`)

```
src/
├── app/
│   ├── api/                # Endpoints Next.js API (devis, clients, catalogues, parametres, pdf, rgpd, seed)
│   ├── globals.css         # Thème Tailwind v4 Liquid Glass & Variables CSS
│   ├── layout.tsx          # Layout racine avec police Inter et métadonnées
│   ├── page.tsx            # Navigation SPA (Dashboard, Devis, Clients, Catalogues, Paramètres)
│   └── proxy.ts            # Proxy sécurité Next.js 16 (fail-closed localhost/Tauri, headers — ex-middleware.ts)
├── application/            # Couche Application (Use Cases, dépend de l'infrastructure)
│   ├── numerotation/       # NumerotationService (numérotation atomique DEVIS-YYYY-MM-NNN)
│   ├── audit/ catalogues/ clients/ devis/ parametres/ pdf/ rgpd/
├── domain/                 # Couche Domaine (pure, zéro dépendance framework/DB)
│   ├── PricingEngine.ts    # Moteur de calcul financier (ResultatCalculDevis, LigneCout)
│   └── __tests__/          # Tests Vitest du domaine
├── components/
│   ├── devis/              # Assistant création devis (Passagers, Vols, Hébergements, Transferts, Hadj, VIP, Financier, Récap)
│   ├── ui/                 # Composants UI Radix/Shadcn (Button, Dialog, Input, Select, Card, etc.)
│   └── views/              # Vues principales (DashboardView, ListeDevisView, CataloguesView, etc.)
├── store/
│   └── useDevisStore.ts    # État du wizard devis (Zustand) typé via src/types/devis-forms.ts
├── types/
│   └── devis-forms.ts      # Interfaces de formulaires UI (montants en strings décimales)
└── lib/
    ├── business.ts         # Métier Omra/Hadj (libellés, calcul des nuitées, vues d'hôtel, catégories)
    ├── calculDevis.ts      # Moteur financier complet Decimal.js, frais ONPO & recalculs
    ├── client-utils.ts     # Helper downloadPdf Blob compatible Tauri & utilitaires formatage
    ├── data/
    │   ├── airlines.ts       # Dataset des 25 compagnies aériennes Algérie/Omra/Hadj
    │   └── booking-hotels.ts # Dataset des 118 hôtels 3*, 4*, 5* de Booking.com
    ├── db.ts               # Instance Prisma Client singleton (SQLite local db/custom.db)
    ├── money.ts            # Utilitaires financiers strict Decimal.js
    ├── pdfDocument.tsx     # Template PDF React-PDF (variantes client, interne, programme)
    ├── pdfRenderer.ts      # Moteur d'encapsulation de rendu PDF serveur (sémaphore + cache LRU)
    └── validation/         # Schémas Zod (devisSchemas, clientSchemas, catalogueSchemas) + types de payload
```

---

## 6. Commandes Utiles & Scripts

```bash
# Lancement en mode développement web
bun run dev

# Lancement en mode Desktop (Fenêtre Native Tauri v2)
bun x tauri dev

# Lancer les tests unitaires
bun run test

# Vérification qualité (doit rester à 0 erreur)
bun run lint

# Vérification du typage strict
bunx tsc --noEmit

# Build Web pour la production
bun run build

# Préparer et Builder l'exécutable Desktop Tauri (Production)
bun run scripts/build-tauri.ts
bunx @tauri-apps/cli build

# Peupler la base avec les 118 hôtels et 25 compagnies
bun scripts/populate-hotels-booking.ts

# Réinitialiser toutes les tables avec les données de démonstration
bun scripts/seed-cloud.ts

# Synchronisation du schéma Prisma avec SQLite
bun run db:push
bun run db:generate
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
