# 🕋 El Mouhssinoune Tours — Omra & Hadj VIP Quotes

> **Système de Gestion Financière & Générateur de Devis/Programmes Sur-Mesure pour Séjours d'Omra & Hadj VIP**  
> *Application Web & Desktop Native — El Mouhssinoune Tours (المحسنون للسياحة)*

![Version](https://img.shields.io/badge/version-0.4.0-gold.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)
![React](https://img.shields.io/badge/React-19.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.19-indigo.svg)
![SQLite](https://img.shields.io/badge/SQLite-Local_100%25_Hors--Ligne-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2_Desktop-blue.svg)
![Design](https://img.shields.io/badge/Design-Liquid_Glass_VIP-d97706.svg)

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Module Spécial Hadj VIP](#-module-spécial-hadj-vip)
- [Catalogues Intégrés (118 Hôtels & 25 Compagnies)](#-catalogues-intégrés-118-hôtels--25-compagnies)
- [Moteur Financier Multi-Devises Strict](#-moteur-financier-multi-devises-strict)
- [Exports PDF Professionnels (3 Variantes)](#-exports-pdf-professionnels-3-variantes)
- [Stack Technique](#-stack-technique)
- [Installation & Démarrage](#-installation--démarrage)
- [Arborescence du Projet](#-arborescence-du-projet)
- [Scripts Disponibles](#-scripts-disponibles)
- [Licence & Crédits](#-licence--crédits)

---

## 🌟 À Propos

**El Mouhssinoune Tours — Omra & Hadj VIP Quotes** (`devis-agy`) est une solution logicielle métier complète conçue pour l'agence de voyages **El Mouhssinoune Tours** (المحسنون للسياحة). 

Elle permet aux agents et responsables de tarification de concevoir rapidement des séjours de pèlerinage VIP et sur-mesure (Billets d'avion A/R, Hébergements de luxe à Makkah et Médine, Transferts privés, Train rapide Haramain, Camps VIP Mina/Arafat, Transport Mashair et Prestations personnalisées) avec un calcul financier d'une précision absolue en Dinars Algériens (**DZD**) et l'exportation instantanée de devis et programmes de voyage en PDF de haute qualité.

L'application fonctionne en mode **100% autonome et hors-ligne** grâce à sa base de données locale **SQLite** (`db/custom.db`), disponible aussi bien dans le navigateur qu'en application de bureau native via **Tauri v2**.

---

## ✨ Fonctionnalités Principales

### 📊 1. Tableau de Bord Analytique (Dashboard)
- Indicateurs clés en temps réel : Chiffre d'affaires total TTC, Marge nette réalisée, Devis émis, Devis validés, Taux de transformation.
- Liste interactive des devis récents avec accès direct aux exports PDF et à l'édition.

### 📝 2. Assistant de Création de Devis (Wizard Intuitif)
- **Étape 1 : Passagers** — Catégorisation par tranche d'âge (*Adultes, Enfants avec lit, Enfants sans lit, Bébés*) et gestion des alertes d'expiration de passeport (< 6 mois).
- **Étape 2 : Billets d'avion** — Saisie complète du billet Aller/Retour avec champs distincts pour le vol Aller et le vol Retour (Origine, Destination, Date/Heure, Classe Éco/Affaires/Première).
- **Étape 3 : Hébergements** — Sélection parmi 118 hôtels à Makkah et Médine (Formules repas, Type de chambre, Vue Kaaba/Haram/Ville, calcul automatique du nombre de nuitées).
- **Étape 4 : Transferts & Train Haramain** — Flotte de véhicules VIP (GMC Yukon, Mercedes Classe E, Bus VIP) et réservations de train à grande vitesse avec horaires précis.
- **Étape 5 : Hadj VIP** — Module dédié aux camps de luxe Mina/Arafat et aux circuits internes de transport du Mashair.
- **Étape 6 : Prestations VIP & Visites** — Services sur-mesure (*Ziyarate privées avec Moutawif, Salons VIP aéroport, Fast-Track, Prise en charge bagages, Eau Zamzam*).
- **Étape 7 : Paramétrage Financier & ONPO** — Saisie libre des frais ONPO (5 000 DZD/passager par défaut, non commissionables), choix du type de marge (% ou montant fixe DZD), verrouillage des taux de change (SAR, USD, EUR) et numérotation automatique atomique `DEVIS-YYYY-MM-NNN`.

---

## 🏕️ Module Spécial Hadj VIP

L'application intègre des fonctionnalités dédiées au grand pèlerinage VIP :
- **Camps & Tentes VIP (Mina / Arafat)** : Gestion des *Maktabs VIP A* avec literie améliorée (*Sofa-beds climatisés*), formules de restauration buffet 24/7, sanitaires privés et tarification distincte par adulte et par enfant en SAR.
- **Transport Mashair** : Prise en charge des déplacements internes durant les jours du Hajj (La Mecque ↔ Mina ↔ Arafat ↔ Muzdalifah) en bus exécutifs ou SUV avec tarification au forfait véhicule ou par pèlerin.

---

## 🏨 Catalogues Intégrés (118 Hôtels & 25 Compagnies)

### 🕋 Catalogue des Hôtels Booking.com (118 Hôtels Réels)
Grille tarifaire complète en SAR pour les chambres Single, Double, Triple et Quadruple, noms officiels en arabe et distances métriques au Haram :

| Ville | 5 Étoiles (5★) | 4 Étoiles (4★) | 3 Étoiles (3★) | Total par Ville |
| :--- | :---: | :---: | :---: | :---: |
| **La Mecque (Makkah)** | 24 hôtels *(Fairmont, Raffles, Dar Al Tawhid, Swissôtel, Jabal Omar...)* | 20 hôtels *(Mövenpick Hajar, Hilton Suites, Makarem Ajyad, Voco...)* | 20 hôtels *(Le Méridien, Al Safwa Orchid, Elaf Al Mashaer...)* | **64 hôtels** |
| **Médine (Al Madinah)** | 17 hôtels *(The Oberoi, Dar Al Taqwa, Dar Al Iman, Sofitel Shahd, Mövenpick...)* | 15 hôtels *(Taiba Front, Makarem Burj, Elaf Taiba, Saja...)* | 22 hôtels *(Al Rawda Royal, Bosphorus, Golden Tulip, Emaar...)* | **54 hôtels** |
| **Total Général** | **41 hôtels** | **35 hôtels** | **42 hôtels** | **118 hôtels** |

### ✈️ 25 Compagnies Aériennes Partenaires
Catalogue complet des compagnies opérant au départ de l'Algérie (Alger, Oran, Constantine, Annaba, etc.) et en transit Hajj/Omra :
*Air Algérie, Saudia, Flynas, Flyadeal, Tassili Airlines, Turkish Airlines, Qatar Airways, Emirates, EgyptAir, Royal Jordanian, Tunisair, Flydubai, Air Arabia, Gulf Air, Oman Air, Kuwait Airways, Jazeera Airways, Nouvelair, Air Cairo, Nesma Airlines, Middle East Airlines (MEA), ITA Airways, Royal Air Maroc, Pegasus Airlines.*

---

## 💰 Moteur Financier Multi-Devises Strict

- **Précision 28 Décimales** : Aucun calcul monétaire n'utilise les `number` natifs de JavaScript. Toutes les opérations s'appuient sur `decimal.js` avec la méthode d'arrondi comptable `ROUND_HALF_UP`.
- **Verrouillage Historique des Devises** : Les taux de change du jour (`SAR`, `USD`, `EUR` vers `DZD`) sont copiés et scellés dans chaque devis créé.
- **Gestion des Frais Non Commissionables (ONPO)** : Les frais ONPO sont obligatoirement répercutés à prix coûtant sans marge agence (`pvLigne = montantDzd`). La marge (en % ou fixe) s'applique exclusivement aux prestations commissionables.

---

## 🖨️ Exports PDF Professionnels (3 Variantes)

Génération serveur optimisée via `@react-pdf/renderer` avec polices embarquées (*DejaVu Sans / DejaVu Serif*) et téléchargement Blob sécurisé (`downloadPdf`) compatible WebView2 / Tauri :

1. **📄 Variante Client** : Devis détaillé avec description complète des prestations, des vols et des hébergements, avec prix de vente TTC par poste et montant total en DZD.
2. **📑 Variante Interne / Agence** : Décomposition financière exhaustive affichant les devises sources d'achat, les coûts nets, le montant de la marge agence et le taux de rentabilité.
3. **📋 Variante Programme (Sans Prix)** : Document d'itinéraire complet reprenant l'ensemble du voyage (hôtels, vols, transferts, horaires de train, services Hadj et VIP) **sans afficher aucun prix ni total** (idéal pour le partage avec les pèlerins).

---

## 🛠️ Stack Technique

- **Framework & UI** : [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) (Thème Liquid Glass Noir/Or), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/), [Sonner](https://sonner.emilkowal.ski/).
- **Langage** : [TypeScript 5.9](https://www.typescriptlang.org/) (Mode strict).
- **Base de Données & ORM** : [SQLite](https://www.sqlite.org/) (Local 100% hors-ligne `db/custom.db`), [Prisma ORM 6](https://www.prisma.io/).
- **Moteur Financier** : [Decimal.js](https://mikemcl.github.io/decimal.js/).
- **Génération PDF** : [@react-pdf/renderer](https://react-pdf.org/).
- **Application Desktop Native** : [Tauri v2](https://v2.tauri.app/) (Fenêtre native de bureau).
- **Runtime** : [Bun](https://bun.sh/) (avec support fallback Node.js).

---

## 🚀 Installation & Démarrage

### Prérequis
- [Bun](https://bun.sh/) (fortement recommandé) ou Node.js (v18+)

### 1. Installation des dépendances
```bash
bun install
```

### 2. Initialisation de la base SQLite locale
```bash
bun run db:push
bun run db:generate
```

### 3. Peupler les catalogues (118 Hôtels & 25 Compagnies)
```bash
bun scripts/populate-hotels-booking.ts
```

### 4. Lancement du serveur Web de développement
```bash
bun run dev
```
Accédez à l'application sur : **`http://localhost:3000`**

### 5. Lancement en Mode Desktop Natif (Tauri v2)
```bash
bun x tauri dev
```

---

## 📜 Scripts Disponibles

Dans le fichier `package.json` :

| Commande | Action |
| :--- | :--- |
| `bun run dev` | Lance l'application web Next.js en mode développement sur le port 3000. |
| `bun run build` | Compile l'application pour la production. |
| `bun run start` | Démarre le serveur en mode production. |
| `bun scripts/populate-hotels-booking.ts` | Met à jour le catalogue avec les 118 hôtels et 25 compagnies aériennes. |
| `bun scripts/seed-cloud.ts` | Réinitialise la base SQLite locale avec les paramètres, taux et devis de démonstration. |
| `bun run db:push` | Synchronise le schéma Prisma avec le fichier SQLite `db/custom.db`. |
| `bun run db:generate` | Régénère le client TypeScript Prisma. |

---

## 🏢 Licence & Crédits

Droits réservés © **El Mouhssinoune Tours** (المحسنون للسياحة).  
Conçu et développé pour la gestion et la tarification professionnelle de séjours d'Omra & Hadj VIP sur-mesure.
