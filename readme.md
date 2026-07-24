# 🕌 El Mouhssinoune Tours — OmraVIP Quotes

> **Système de Gestion & Générateur de Devis Sur-Mesure & VIP pour Séjours d'Omra**  
> *Application locale 100% hors-ligne — El Mouhssinoune Tours (المحسنون للسياحة)*

![Version](https://img.shields.io/badge/version-0.2.0-gold.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.11-indigo.svg)
![SQLite](https://img.shields.io/badge/SQLite-Local-green.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg)

---

## 📋 Table des Matières

- [À propos](#-à-propos)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Moteur Financier Multi-Devises](#-moteur-financier-multi-devises)
- [Génération PDF Professionnelle & Compatible Tauri](#-génération-pdf-professionnelle--compatible-tauri)
- [Stack Technique](#-stack-technique)
- [Installation & Démarrage](#-installation--démarrage)
- [Arborescence du Projet](#-arborescence-du-projet)
- [Scripts Disponibles](#-scripts-disponibles)
- [Licence & Crédits](#-licence--crédits)

---

## 🌟 À Propos

**OmraVIP Quotes** est une solution informatique sur-mesure développée pour l'agence de voyages **El Mouhssinoune Tours** (المحسنون للسياحة). Elle permet aux agents et responsables de tarification de composer rapidement des packages d'Omra personnalisés (Vols Aller/Retour, Hébergements à Makkah et Médine, Transferts VIP, Train Haramain, Visites & Services libres) et de calculer instantanément le prix de vente exact en Dinars Algériens (**DZD**), tout en générant un devis PDF élégant et conforme à l'image de marque VIP.

L'application fonctionne **100% en local et hors-ligne**, garantissant la confidentialité des données et une réactivité optimale sous navigateur web ou en application desktop native avec **Tauri v2**.

---

## ✨ Fonctionnalités Principales

### 📊 1. Tableau de Bord (Dashboard)
- Suivi analytique global en temps réel : Chiffre d'affaires total, marge brute réalisée, nombre de devis créés, devis acceptés, taux de conversion.
- Liste et raccourcis d'accès rapide aux derniers devis récents.

### 📝 2. Assistant de Création de Devis Multi-Étapes (Wizard)
- **Étape 1 : Client & Dates** — Sélection du client (particulier ou entreprise), saisie des dates de voyage.
- **Étape 2 : Passagers** — Ajout des passagers par tranche d'âge (*Adultes, Enfants avec lit, Enfants sans lit, Bébés*) et coordonnées de passeport.
- **Étape 3 : Vols (Aller / Retour)** — Saisie complète du billet d'avion avec détails distincts pour le vol Aller (Origine, Destination, Date/Heure, Classe) et le vol Retour (Origine, Destination, Date/Heure, Classe), partageant la même compagnie aérienne.
- **Étape 4 : Hébergement** — Choix des hôtels à **Makkah** et **Médine** (type de chambre, formule repas : demi-pension, pension complète, vue Kaaba/Haram/City, durée en nuitées).
- **Étape 5 : Transferts** — Choix des véhicules terrestres VIP (GMC Yukon, Mercedes Classe E, Bus VIP privé) et trajets.
- **Étape 6 : Train Haramain & Prestations VIP** — Billets de train à grande vitesse avec date et heure précise, ainsi que services personnalisés (*Ziyarate, Salons VIP, Fast-Track, Bagagerie, Zamzam*).
- **Étape 7 : Financier & Validation** — Frais ONPO (5 000 DZD/passager par défaut, non commissionables), application de la marge agence (en % ou montant fixe DZD), calcul instantané du coût net et du prix de vente, attribution du numéro unique `DEVIS-YYYY-MM-NNN`.

### 📄 3. Génération & Export PDF Natif (Compatible Tauri)
- Export PDF instantané basé sur un chargement Blob (`fetch` + URL Blob + déclencheur `download`), garantissant un fonctionnement parfait dans le navigateur et dans la fenêtre desktop **Tauri**.
- Deux modes de vue PDF disponibles :
  - **Vue Client** : Titre "Récapitulatif des Prix", colonne "Prestation", intitulé "Billet", "Hébergement Makkah", "Hébergement Médine", vue des chambres et horaire des trains.
  - **Vue Interne / Agence** : Document complet avec décomposition du coût net d'achat, de la marge agence et des prix de vente ligne par ligne.

### 👥 4. Gestion des Clients & Catalogues
- **Répertoire Clients** : Fiches clients avec coordonnées, historique des devis et alerte d'expiration de passeport (< 6 mois).
- **Catalogues Hôtels & Compagnies** : Base de données des hôtels partenaires et des compagnies aériennes.

---

## 💰 Moteur Financier Multi-Devises

Pour garantir une précision comptable absolue :
1. **Zéro Erreur d'Arrondi Float** : Tous les calculs financiers reposent sur la bibliothèque `decimal.js` avec une précision de 28 chiffres et un arrondi réglementaire `ROUND_HALF_UP`.
2. **Verrouillage des Taux de Change** : Lors de la création d'un devis, les taux de change du jour sont copiés et verrouillés dans le devis.
3. **Gestion des Frais Non Commissionables (ONPO)** : Les frais d'organisation ONPO (5 000 DZD/passager) sont exemptés de marge agence (`prixVente = coûtNet`).

---

## 🖨️ Génération PDF Professionnelle

Le moteur PDF s'appuie sur `@react-pdf/renderer` et utilise :
- **Typographie Officielle embarquée** : *DejaVu Serif* pour les en-têtes élégants et *DejaVu Sans* pour le corps de texte.
- **Watermark Discret** : Filigrane avec le logo de l'agence El Mouhssinoune Tours.
- **Layout Compact 1 Page** : Mise en page condensée et haut de gamme.

---

## 🛠️ Stack Technique

- **Frontend & App Framework** : [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Design & Interface** : [Tailwind CSS v4](https://tailwindcss.com/), Composants [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Base de Données & ORM** : [SQLite](https://www.sqlite.org/) (`db/custom.db`), [Prisma ORM 6](https://www.prisma.io/)
- **Moteur Financier** : [Decimal.js](https://mikemcl.github.io/decimal.js/)
- **Génération PDF** : [@react-pdf/renderer](https://react-pdf.org/)
- **Application Desktop Native** : [Tauri v2](https://v2.tauri.app/) (Fenêtre native ultra-rapide en Rust)
- **Environnement d'exécution** : [Bun](https://bun.sh/) (ou Node.js)
- **Serveur Web / Reverse Proxy** : [Caddy](https://caddyserver.com/) (Port 81)

---

## 🚀 Installation & Démarrage

### Prérequis
- [Bun](https://bun.sh/) (recommandé) ou Node.js (v18+)

### 1. Installation des dépendances
```bash
bun install
```

### 2. Configuration de la base de données
Initialisez le schéma SQLite et générez le client Prisma :
```bash
bun run db:push
bun run db:generate
```

### 3. Lancement du serveur de développement web
```bash
bun run dev
```
L'application sera disponible sur `http://localhost:3000`.

### 4. Lancement en mode Application Desktop (Tauri)
```bash
bunx @tauri-apps/cli dev
```

---

## 📜 Scripts Disponibles

Dans le fichier `package.json` :

| Commande | Action |
| :--- | :--- |
| `bun run dev` | Lance l'application Next.js en mode développement sur le port 3000. |
| `bun run build` | Compile l'application pour la production (bundle standalone). |
| `bun run start` | Démarre le serveur de production standalone avec Bun. |
| `bun run lint` | Exécute l'analyseur de code ESLint. |
| `bun run db:push` | Synchronise le schéma Prisma directement avec SQLite. |
| `bun run db:generate` | Régénère le client Prisma TypeScript. |

---

## 🏢 Licence & Crédits

Droits réservés © **El Mouhssinoune Tours** (المحسنون للسياحة).  
Conçu et développé pour la gestion professionnelle des devis d'Omra VIP.
