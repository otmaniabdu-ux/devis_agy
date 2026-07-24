# AGENT.MD — Guide & Directives pour l'Agent AI (El Mouhssinoune Tours — OmraVIP Quotes)

Ce document définit l'architecture, les conventions, les règles de développement inviolables et la structure métier de l'application **El Mouhssinoune Tours — OmraVIP Quotes**. Tout agent AI ou développeur intervenant sur ce projet **MUST** respecter strictement ces instructions.

---

## 1. Vue d'Ensemble & Mission

L'application **El Mouhssinoune Tours — OmraVIP Quotes** (`devis-agy`) est une solution web locale et autonome (100% hors-ligne) conçue pour la création, le calcul financier précis, la gestion et la génération de devis PDF professionnels pour des séjours d'Omra VIP et sur-mesure.

- **Client Cible / Marque** : El Mouhssinoune Tours (المحسنون للسياحة) - Agence de Voyages & Tourisme.
- **Monnaie Principale de Vente** : Dinar Algérien (**DZD**).
- **Devises Source d'Achat** : Ryal Saoudien (**SAR**), Dollar Américain (**USD**), Euro (**EUR**).

---

## 2. Stack Technique & Architecture

- **Framework Web** : Next.js 16 (App Router) + React 19.
- **Langage** : TypeScript strict.
- **Styling** : Tailwind CSS v4 + Radix UI + Lucide React + Framer Motion + `sonner` (toasts).
- **ORMs & Base de Données** : Prisma 6 + SQLite (`file:./db/custom.db`).
- **Calcul Financier** : `decimal.js` (Précision 28 décimales, arrondi `ROUND_HALF_UP`).
- **Génération PDF** : `@react-pdf/renderer` avec polices embarquées DejaVu Sans & DejaVu Serif.
- **Runtime / Executable** : Bun (supporté avec scripts fallback Node/npm).
- **Application Desktop Native** : Tauri v2 (pour un mode fenêtre native et ergonomie logicielle de bureau).
- **Reverse Proxy / Server** : Caddy (configuration port 81).
- **Scripts d'Automatisation** : Dossier `.zscripts/` (`dev.sh`, `build.sh`, `start.sh`).

---

## 3. Règles Inviolables & Conventions de Code

### A. Calculs Financiers Stricts (`src/lib/money.ts` & `src/lib/calculDevis.ts`)
1. **ZÉRO `number` JS pour les montants monétaires** : Tous les prix, sous-totaux, coûts nets, marges et taux de change sont stockés sous forme de `String` (decimal TEXT) et manipulés exclusivement avec l'objet `Decimal` de `decimal.js`.
2. **Arrondi Standard** : Utilisation de `Decimal.ROUND_HALF_UP` à 2 décimales pour l'affichage (`round2`, `formatMoney`).
3. **Verrouillage des Taux de Change** : Lors de la création d'un devis (`Devis`), les taux de change actuels (`tauxSarDzd`, `tauxUsdDzd`, `tauxEurDzd`) sont copiés dans le record `Devis`. Ils ne doivent **jamais** être recalculés avec les taux globaux postérieurs pour préserver l'historique financier exact.

### B. Numérotation des Devis
- Format strict : `DEVIS-YYYY-MM-NNN` (ex: `DEVIS-2026-07-001`).
- La fonction `attribuerNumeroDevis` dans `src/lib/calculDevis.ts` gère l'incrémentation atomique avec la table `CompteurNumerotation` et effectue des boucles de sécurité anti-collision.

### C. Gestion des Passagers et Tarification Vol / Train / Visa
- Les passagers sont catégorisés : `adulte`, `enfant_avec_lit`, `enfant_sans_lit`, `bebe`.
- **Vols** : Saisie unifiée sous forme de billet "Aller/Retour" global pour plus de rapidité de tarification.
- Le Visa et l'Assurance Médicale s'appliquent à tous les passagers de la réservation.
- La marge agence peut être appliquée en **pourcentage** (`pourcentage`) ou en **montant fixe DZD** (`montant_fixe`).

---

## 4. Schéma de Base de Données (Prisma)

Le schéma se trouve dans `prisma/schema.prisma`. Voici les modèles clés :

| Modèle | Description |
| :--- | :--- |
| `ParametresAgence` | Configuration singleton de l'agence (Noms FR/AR, coordonnées, couleurs de marque, logo). |
| `TauxChange` | Taux de change globaux par défaut (SAR, USD, EUR en DZD). |
| `CompteurNumerotation` | Clé mensuelle (`DEVIS-YYYY-MM`) pour l'attribution atomique des numéros. |
| `Client` | Fiche client (particulier ou société, coordonnées). |
| `Devis` | En-tête du devis avec dates, taux de change verrouillés, type de visa, marge, totaux DZD. |
| `Passager` | Passager rattaché au devis avec catégorie d'âge et infos passeport. |
| `SegmentVol` | Segment aérien avec compagnies, villes départ/arrivée et tarifs par tranche. |
| `Hebergement` | Séjour hôtel (Makkah / Médine), type de chambre, formule repas, prix nuitée. |
| `Transfert` | Transfert terrestre (GMC Yukon, Bus VIP, etc.) et trajet. |
| `TrainHaramain` | Trajet en train à grande vitesse Haramain (Économique / Business). |
| `PrestationVIP` | Services sur-mesure (Ziyarate, Lounge VIP, Fast-Track, Zamzam, etc.). |
| `CatalogueHotel` | Catalogue d'hôtels préenregistrés avec tarifs indicatifs SAR. |
| `CatalogueCompagnie` | Catalogue des compagnies aériennes partenaires (Air Algérie, Saudia, etc.). |

---

## 5. Structure de l'Arborescence (`src/`)

```
src/
├── app/
│   ├── api/                # Endpoints Next.js API (devis, clients, catalogues, parametres, pdf, seed)
│   ├── globals.css         # Thème Tailwind v4 & Variables CSS (brand-rouge, brand-or, etc.)
│   ├── layout.tsx          # Layout racine avec polices et métadonnées
│   └── page.tsx            # Navigation globale SPA (Tableau de bord, Devis, Clients, Catalogues, Settings)
├── components/
│   ├── devis/              # Assistant création devis (7 étapes : Passagers, Vols, Hebergement, etc.)
│   ├── ui/                 # Composants UI Radix/Shadcn (Button, Dialog, Input, Select, Table, Card, etc.)
│   └── views/              # Vues principales de l'application (DashboardView, ListeDevisView, etc.)
└── lib/
    ├── business.ts         # Métier Omra (libellés, calcul des nuitées, catégories)
    ├── calculDevis.ts      # Moteur financier complet & recalculs décimaux
    ├── db.ts               # Instance Prisma Client singleton
    ├── money.ts            # Utilitaires financiers strict Decimal.js
    └── pdfDocument.tsx     # Template PDF React-PDF professionnel 1 page compacte
```

---

## 6. Endpoints API Principaux

- `GET /api/devis` : Liste tous les devis avec relations (Client, Passagers, etc.).
- `POST /api/devis` : Crée un nouveau devis complet.
- `GET /api/devis/[id]` : Récupère un devis spécifique par ID.
- `PUT /api/devis/[id]` : Met à jour un devis.
- `DELETE /api/devis/[id]` : Supprime un devis.
- `GET /api/pdf/[id]?mode=client|interne` : Génère et renvoie le flux PDF du devis.
- `GET /POST /api/seed` : Initialise la base de données avec les données de démonstration OmraVIP.
- `GET /PUT /api/parametres` : Récupère/Met à jour les paramètres de l'agence et les taux de change.
- `GET /POST /PUT /DELETE /api/clients` : Gestion du répertoire client.
- `GET /POST /PUT /DELETE /api/catalogues` : Gestion des hôtels et compagnies aériennes.

---

## 7. Commandes de Développement & Scripts

```bash
# Lancement en mode développement web
bun run dev

# Lancement en mode Desktop (Fenêtre Native Tauri v2)
bun run tauri dev

# Génération et synchronisation de la base SQLite avec Prisma
bun run db:push
bun run db:generate

# Build pour la production web
bun run build

# Démarrage du serveur standalone en production
bun run start
```

### Scripts Shell Automatisés (`.zscripts/`)
- `.zscripts/dev.sh` : Lance l'environnement de dev local.
- `.zscripts/build.sh` : Prépare l'application autonome Next.js standalone.
- `.zscripts/start.sh` : Démarre le serveur de production.

---

## 8. Directives aux Agents de Développement

1. **Ne modifiez jamais la précision financière** : Conservez toujours le pattern `D(valeur)` et le retour `String` pour les montants.
2. **Testez le PDF après toute modification des modèles** : Vérifiez que `pdfDocument.tsx` gère correctement tous les champs optionnels ou nouvelles propriétés.
3. **Respectez l'esthétique de la marque** : Les couleurs de marque sont `#CC1A1A` (Rouge royal/bordeaux), `#C4A152` (Or métallisé) et `#0A1628` (Bleu nuit d'Orient).
