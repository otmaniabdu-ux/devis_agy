# PROMPT AGENT — OmraVIP Quotes
## App de bureau locale pour la création et gestion des devis VIP Omra/Hadj
### El Mouhssinouen Tours (المحسنون للسياحة)

> **Usage de ce document** : à copier intégralement dans le prompt initial de Claude Code / OpenCode / Aider / Continue, à la racine du dossier de projet. Les sous-agents référencés en section 9 doivent être placés dans `.claude/agents/`. Le schéma SQL référencé en section 4 doit être placé dans `database/schema.sql` et copié vers `src-tauri/src/db/schema.sql`.

---

## 0. Contexte & Objectif

Tu développes une application de bureau **100% locale et hors-ligne**, pour l'agence de voyages **El Mouhssinouen Tours**, spécialisée dans le Hajj et la Omra VIP. L'application sert à créer, calculer et éditer des **devis VIP** pour les pèlerins, avec génération de PDF bilingue (français/arabe).

Aucune donnée ne doit transiter par un serveur externe. Tout est stocké dans un fichier SQLite local, sur la machine de l'utilisateur.

L'utilisateur (Abderrahmen) n'est pas développeur : il pilote le projet via des agents IA. Chaque livrable doit être **complet, fonctionnel et testé**, jamais un fragment à compléter manuellement.

---

## 1. Stack technique imposée (non-négociable)

| Couche | Techno | Détail |
|---|---|---|
| Shell applicatif | **Tauri 2.x** | Build Windows en priorité (l'utilisateur est sur PC), pas de dépendance serveur |
| Frontend | **Vue.js 3** (Composition API) + **TypeScript** + Vite | Formulaires dynamiques multi-étapes |
| État global | **Pinia** | Un store par domaine (devis, clients, catalogues, devises) |
| Backend | **Rust** (édition 2021+) | Toute la logique métier et les calculs vivent ici, jamais côté JS |
| Base de données | **SQLite** via `rusqlite` (mode bundled) | Fichier unique, embarqué avec l'app |
| Calcul monétaire | `rust_decimal::Decimal` | **JAMAIS `f32`/`f64`** pour un montant, un taux, ou un pourcentage |
| Dates | `chrono` (NaiveDate) | Jamais de calcul de date via flottant (`julianday` interdit) |
| Génération PDF | **Typst**, intégré comme bibliothèque Rust (crate `typst`) | Voir section 7 — justification technique |
| i18n | `vue-i18n` | `fr.json` / `ar.json`, bascule RTL automatique côté UI |

---

## 2. Règles non-négociables (héritées de la charte agence)

### Règles financières
- Toute valeur monétaire (prix, taux de change, marge, coût) est stockée en base comme **chaîne décimale TEXT** (ex. `"125430.50"`), jamais en `REAL`.
- Tout calcul utilise `rust_decimal::Decimal`, avec arrondi `RoundingStrategy::MidpointAwayFromZero` (équivalent de `ROUND_HALF_UP`).
- Les taux de change (SAR→DZD, USD→DZD, EUR→DZD) sont **verrouillés à la création du devis** et stockés dans la ligne `devis` — ils ne doivent jamais être recalculés a posteriori avec un taux différent.
- Devise de référence pour l'affichage final au client : **DZD**. Les devises d'achat possibles : SAR, USD, EUR, DZD.
- Numérotation des devis : format **`DEVIS-YYYY-MM-NNN`** (ex. `DEVIS-2026-07-014`), séquence par mois, gérée via la table `compteurs_numerotation`.

### Règles de marque
- Couleurs strictes : Rouge `#CC1A1A`, Bleu Nuit `#0A1628`, Or `#C4A152` (+ Bleu Royal `#1B3A6B`, Blanc Ivoire `#F7F5F0` en secondaire).
- Typographie : **Playfair Display** (titres FR), **Lato** (corps FR), **Amiri** (arabe).
- Nom de l'agence en arabe : **المحسنون** — jamais une autre orthographe.
- Interface (labels, code, commentaires) : **français**. Les PDF générés pour le client sont **bilingues français/arabe**.

### Règle de qualité
- Après chaque module touchant à l'argent, exécuter un grep de contrôle : `grep -rn "f32\|f64" src-tauri/src/` ne doit renvoyer **aucun résultat** dans les fichiers de calcul ou de modèle financier.

---

## 3. Arborescence du projet à générer

```
omravip-quotes/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/                  # Points d'entrée IPC exposés au frontend
│   │   │   ├── mod.rs
│   │   │   ├── devis.rs               # CRUD devis + recalcul des totaux
│   │   │   ├── clients.rs
│   │   │   ├── passagers.rs
│   │   │   ├── vols.rs
│   │   │   ├── hebergements.rs
│   │   │   ├── transferts.rs
│   │   │   ├── prestations_vip.rs
│   │   │   ├── catalogues.rs
│   │   │   ├── devises.rs
│   │   │   ├── pdf.rs
│   │   │   └── parametres.rs
│   │   ├── models/                    # Structs Rust + (dé)sérialisation
│   │   │   ├── mod.rs
│   │   │   ├── devis.rs
│   │   │   ├── passager.rs
│   │   │   ├── segment_vol.rs
│   │   │   ├── hebergement.rs
│   │   │   ├── transfert.rs
│   │   │   ├── prestation_vip.rs
│   │   │   └── devise.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs
│   │   │   ├── schema.sql             # copié depuis /database/schema.sql
│   │   │   └── migrations/
│   │   ├── services/                  # Logique métier pure, testable unitairement
│   │   │   ├── calcul_prix.rs         # Coût net, marge, prix de vente
│   │   │   ├── conversion_devises.rs
│   │   │   ├── calcul_nuitees.rs
│   │   │   ├── alerte_passeport.rs
│   │   │   ├── numerotation.rs
│   │   │   └── generation_pdf.rs
│   │   └── utils/
│   │       └── decimal_helpers.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                                # Frontend Vue
│   ├── main.ts
│   ├── App.vue
│   ├── router/index.ts
│   ├── stores/
│   │   ├── devisStore.ts
│   │   ├── clientStore.ts
│   │   ├── catalogueStore.ts
│   │   └── devisesStore.ts
│   ├── views/
│   │   ├── DashboardView.vue
│   │   ├── NouveauDevisView.vue
│   │   ├── ListeDevisView.vue
│   │   ├── ClientsView.vue
│   │   ├── CatalogueHotelsView.vue
│   │   ├── CatalogueVolsView.vue
│   │   ├── ParametresView.vue
│   │   └── MargeDashboardView.vue      # vue interne, jamais exportée en PDF client
│   ├── components/
│   │   ├── devis/
│   │   │   ├── FormulairePassagers.vue
│   │   │   ├── FormulaireVols.vue
│   │   │   ├── FormulaireHebergement.vue
│   │   │   ├── FormulaireTransferts.vue
│   │   │   ├── FormulairePrestationsVIP.vue
│   │   │   ├── FormulaireFinancier.vue
│   │   │   ├── RecapitulatifDevis.vue
│   │   │   └── AlertePasseport.vue
│   │   ├── ui/                         # boutons, inputs, cartes réutilisables
│   │   └── layout/
│   ├── types/devis.types.ts
│   ├── composables/
│   │   ├── useCalculNuitees.ts
│   │   ├── useConversionDevises.ts
│   │   └── useValidationPasseport.ts
│   ├── locales/
│   │   ├── fr.json
│   │   └── ar.json
│   └── assets/
│       ├── fonts/                      # PlayfairDisplay, Lato, Amiri (fichiers .ttf/.otf)
│       ├── logo/
│       └── styles/variables.css        # variables CSS = charte graphique
│
├── templates/
│   └── devis_pdf.typ                   # template Typst du devis (client + interne)
│
├── database/
│   └── schema.sql                      # source de vérité du schéma (fourni, voir kit)
│
├── .claude/
│   └── agents/                         # sous-agents (fournis, voir kit)
│       ├── rust-backend-tauri.md
│       ├── vue-frontend.md
│       ├── database-sqlite.md
│       ├── pdf-generator.md
│       └── qa-financier.md
│
├── docs/
│   └── REGLES_METIER.md
├── package.json
└── README.md
```

---

## 4. Modèle de données

Le schéma SQLite complet est fourni dans `database/schema.sql` (fichier séparé du kit). Il couvre les tables suivantes : `parametres_agence`, `clients`, `devis`, `passagers`, `segments_vol`, `hebergements`, `transferts`, `train_haramain`, `prestations_vip`, `catalogue_hotels`, `catalogue_compagnies`, `compteurs_numerotation`.

**Instruction à l'agent** : copier ce fichier tel quel comme source de vérité du schéma. Ne pas le réinventer. Toute évolution ultérieure passe par une migration numérotée dans `src-tauri/src/db/migrations/`.

---

## 5. Spécifications fonctionnelles détaillées

### A. Voyageurs et administratif
- Saisie des passagers segmentée en 4 catégories : `adulte`, `enfant_avec_lit` (2-11 ans), `enfant_sans_lit` (2-11 ans), `bebe` (< 2 ans).
- Dates globales du dossier : départ / retour.
- **Alerte passeport** : pour chaque passager, si `date_expiration_passeport < date_retour + 6 mois`, afficher un badge d'alerte visuel (rouge) dans le formulaire ET dans la liste des devis. Le calcul se fait côté Rust avec `chrono`, jamais côté JS uniquement (le JS peut afficher, mais la valeur canonique vient du backend).
- Visa : sélection parmi `omra_standard`, `touristique`, `hadj`.
- Assurance médicale : coût saisi par passager (peut varier par âge), devise au choix (SAR par défaut).

### B. Transport
- **Plan de vol multi-segments** : liste ordonnée de segments (ex. Alger→Médine, Djeddah→Alger), chacun avec compagnie, classe, date, et **prix par tranche d'âge** (adulte / enfant / bébé), dans la devise d'achat.
- **Transferts terrestres VIP** : 4 transferts obligatoires + jusqu'à 2 optionnels, chacun avec trajet et type de véhicule (`GMC_Yukon`, `Mercedes_Classe_E`, `Bus_VIP_prive`).
- **Train Haramain** : trajets inter-villes (ex. Makkah-Médine), classe `economique` ou `business`.

### C. Hébergement
- Sélection hôtel (Makkah et/ou Médine), type de chambre (`single` à `quadruple`), formule de repas, vue (`Kaaba`, `Haram`, `City`).
- **Calcul automatique des nuitées** : `nb_nuitees = date_checkout - date_checkin` en jours entiers, calculé côté Rust via `chrono::NaiveDate` (différence de dates entières, jamais via flottant).

### D. Prestations exclusives VIP
- Ziyarates privées : option guide (Moutawif) dédié + véhicule privé.
- Logistique sol : Lounge VIP, Fast-Track, prise en charge bagages, eau Zamzam.
- Modélisées comme lignes libres dans `prestations_vip` (type + description + prix).

### E. Cœur financier
- Taux de change du jour saisis à la création du devis (SAR, USD, EUR → DZD) et **verrouillés** dans la ligne `devis`.
- Conversion automatique de chaque ligne (vol, hôtel, transfert, prestation) vers DZD pour le calcul du coût net total.
- Marge agence : `pourcentage` ou `montant_fixe`, appliquée sur le coût net total.
- **Deux vues du même devis** :
  - **Vue client** (PDF + écran) : uniquement le prix de vente final, poste par poste, sans coût net ni marge.
  - **Vue interne** (dashboard, jamais exportée au client) : coût net, marge en montant et en %, prix de vente, par devis et agrégé sur une période.

---

## 6. Moteur de calcul — formules de référence

```
# Conversion (Decimal, jamais float)
montant_dzd = montant_devise_source * taux_verrouille_pour_cette_devise

# Coût net total du devis
cout_net_total = Σ (montant_dzd de chaque ligne : vols, hébergements, transferts,
                     train, prestations VIP, visa/assurance)

# Marge
si marge_type == "pourcentage":
    prix_vente_total = cout_net_total * (1 + marge_valeur / 100)
si marge_type == "montant_fixe":
    prix_vente_total = cout_net_total + marge_valeur

marge_montant_total = prix_vente_total - cout_net_total

# Nuitées (entier, via chrono, jamais julianday flottant)
nb_nuitees = (date_checkout - date_checkin).num_days()

# Alerte passeport
seuil = date_retour + 6 mois (chrono::Months)
alerte_passeport = date_expiration_passeport < seuil

# Numérotation
cle_mensuelle = "DEVIS-{YYYY}-{MM}"
dernier_numero = SELECT dernier_numero FROM compteurs_numerotation WHERE cle = cle_mensuelle
nouveau_numero = dernier_numero + 1
numero_devis = "{cle_mensuelle}-{nouveau_numero:03}"
```

**Point d'attention pour l'agent** : ces calculs doivent vivre exclusivement dans `src-tauri/src/services/`, être couverts par des tests unitaires Rust (`#[cfg(test)]`), et ne jamais être dupliqués en JavaScript (le frontend affiche uniquement ce que le backend renvoie).

---

## 7. Génération PDF bilingue — choix technique

**Bibliothèque retenue : [Typst](https://typst.app/)**, intégrée directement comme **crate Rust** (`typst` + `typst-pdf`) dans le backend Tauri — pas de binaire externe à bundler, pas de serveur, 100% offline.

Justification :
- Typst est écrit en Rust : intégration native dans `src-tauri`, cohérent avec le reste de la stack.
- Support natif du bidirectionnel : `#set text(dir: rtl)` pour les blocs arabes, avec sélection de police par script (`#set text(font: ("Playfair Display", "Amiri"))`), ce qui permet de mélanger proprement français (LTR) et arabe (RTL) dans le même document.
- Compilation très rapide (documents complexes en millisecondes), adaptée à une génération à la volée depuis l'interface.
- Pas de dépendance à un moteur externe historiquement fragile pour l'arabe (l'ancienne approche par binaire externe type wkhtmltopdf est aujourd'hui peu maintenue).

**Instructions à l'agent (subagent `pdf-generator`)** :
1. Créer un template `templates/devis_pdf.typ` paramétrable (variables injectées depuis Rust : données du devis, logo, couleurs de marque).
2. Police arabe : **Amiri** (déjà utilisée dans la charte). Police française : **Playfair Display** pour les titres, **Lato** pour le corps. Embarquer les fichiers de police dans le binaire (`assets/fonts/`) pour un rendu identique sur toute machine, sans dépendre des polices installées sur le poste de l'utilisateur.
3. Générer **deux variantes** du même devis :
   - `devis_client.pdf` : prix de vente uniquement, mise en page premium (couleurs de marque, logo vectoriel).
   - `devis_interne.pdf` : ajoute coût net, marge €/%, à usage strictement interne.
4. Valider le rendu RTL sur un cas réel contenant du texte arabe et français mélangés (ex. nom d'hôtel en français, mention religieuse en arabe) avant de considérer le module terminé.

---

## 8. Interface — règles UI/UX

- Formulaire de devis en **étapes** (wizard) : Passagers → Vols → Hébergement → Transferts/Train → Prestations VIP → Financier → Récapitulatif.
- Champs monétaires : toujours affichés avec 2 décimales, jamais de `parseFloat` côté frontend pour un calcul qui compte (affichage uniquement, la valeur canonique vient de Rust).
- Badge d'alerte passeport visible dès la liste des devis, pas seulement dans le détail.
- Dashboard marge (`MargeDashboardView.vue`) protégé visuellement (section clairement identifiée « Usage interne ») et **jamais accessible depuis un export PDF client**.
- Respect strict de la palette et de la typographie définies en section 2.

---

## 9. Sous-agents à utiliser

Placer les 5 fichiers suivants dans `.claude/agents/` (fournis dans le kit, prêts à l'emploi) :

| Sous-agent | Rôle | Déclenché pour |
|---|---|---|
| `rust-backend-tauri` | Commands Tauri, modèles Rust, services de calcul, SQLite via rusqlite | Toute la logique métier et les commandes IPC |
| `vue-frontend` | Composants Vue 3, stores Pinia, i18n, formulaires | Toute l'interface utilisateur |
| `database-sqlite` | Schéma, migrations, requêtes | Évolutions de la base de données |
| `pdf-generator` | Template Typst, rendu bilingue RTL, deux variantes de PDF | Le module de génération de devis PDF |
| `qa-financier` | Audit flottants, tests calculs, cohérence numérotation/dates | Contrôle qualité après chaque phase touchant à l'argent |

**Mode d'emploi** : pour chaque phase du plan (section 10), déléguer explicitement au sous-agent concerné plutôt que de tout traiter dans le contexte principal. Le sous-agent `qa-financier` doit systématiquement être invoqué en fin de phase 2, 3, 4, 6 et 9.

---

## 10. Plan de développement en phases

| Phase | Objectif | Livrables | Compétences requises | Sous-agent |
|---|---|---|---|---|
| **0** | Bootstrap projet | `tauri init`, structure de dossiers complète, dépendances (Cargo.toml, package.json), config Tauri | Scaffolding Tauri/Vite, config Cargo | rust-backend-tauri |
| **1** | Base de données | `schema.sql` intégré, `connection.rs`, pool de connexion, migrations init | SQL, rusqlite, gestion de fichiers SQLite embarqués | database-sqlite |
| **2** | Modèles & CRUD de base | Structs Rust pour toutes les entités, commands CRUD (clients, devis, passagers) | Rust (serde, structs), design d'API IPC Tauri | rust-backend-tauri → qa-financier |
| **3** | Moteur de calcul | `calcul_prix.rs`, `conversion_devises.rs`, `calcul_nuitees.rs`, `numerotation.rs`, tests unitaires | rust_decimal, chrono, tests Rust | rust-backend-tauri → qa-financier |
| **4** | Alertes & validations | `alerte_passeport.rs`, validations de cohérence des dates | chrono, logique métier pèlerinage | rust-backend-tauri → qa-financier |
| **5** | Frontend — formulaires | Wizard multi-étapes complet (A→E), stores Pinia, composables | Vue 3, TypeScript, Pinia, UX formulaire | vue-frontend |
| **6** | Génération PDF | Template Typst, intégration crate `typst`, 2 variantes (client/interne) | Typst, RTL/bidi, typographie | pdf-generator → qa-financier |
| **7** | Dashboard marge interne | `MargeDashboardView.vue`, agrégats par période | Vue 3, agrégation de données, séparation des accès | vue-frontend |
| **8** | Catalogues réutilisables | CRUD hôtels/compagnies, pré-remplissage dans les formulaires | Rust + Vue, ergonomie de saisie répétée | rust-backend-tauri + vue-frontend |
| **9** | QA finale & packaging | Suite de tests complète, grep flottants global, build `.msi`/`.exe` | Tests d'intégration, `tauri build`, empaquetage Windows | qa-financier → rust-backend-tauri |

**Règle d'exécution** : ne pas passer à la phase N+1 tant que la checklist de validation de la phase N (section 11) n'est pas entièrement cochée.

---

## 11. Critères de validation (Definition of Done)

Une phase n'est considérée terminée que si :

- [ ] `grep -rn "f32\|f64" src-tauri/src/` ne renvoie aucun résultat dans le code de calcul/modèle financier
- [ ] Tous les montants stockés et transmis entre Rust et Vue sont des chaînes (`String`), jamais des `number` JS pour un calcul qui compte
- [ ] Les taux de change d'un devis existant ne changent jamais rétroactivement
- [ ] Le format `DEVIS-YYYY-MM-NNN` est respecté et testé sur un changement de mois (ex. passage 2026-07 → 2026-08 réinitialise la séquence)
- [ ] L'alerte passeport se déclenche correctement sur un cas limite (exactement 6 mois, 6 mois - 1 jour, 6 mois + 1 jour)
- [ ] Le calcul de nuitées est correct sur un changement de mois et une année bissextile
- [ ] Le PDF client ne contient à aucun moment une donnée de coût net ou de marge
- [ ] Le rendu arabe (RTL) et français (LTR) mélangés dans un même PDF est visuellement correct (pas de glyphes inversés, pas de « tofu »)
- [ ] La charte graphique (couleurs, polices) est respectée à l'identique entre écran et PDF
- [ ] L'application fonctionne sans connexion internet, base SQLite comprise

---

## 12. Instructions d'utilisation de ce kit

1. Créer un dossier de projet vide, ex. `omravip-quotes/`.
2. Copier ce fichier (`PROMPT_AGENT_OmraVIP.md`) à la racine.
3. Copier `database/schema.sql` dans un sous-dossier `database/`.
4. Copier les 5 fichiers de `.claude/agents/` dans `omravip-quotes/.claude/agents/`.
5. Ouvrir un terminal dans ce dossier, lancer Claude Code (ou OpenCode), et donner comme première instruction :
   > « Lis intégralement `PROMPT_AGENT_OmraVIP.md` et `database/schema.sql`, puis exécute la Phase 0 du plan de développement. Ne passe pas à la phase suivante sans validation explicite. »
6. Valider phase par phase avant de continuer (l'agent doit s'arrêter et présenter un résumé + la checklist section 11 cochée avant de poursuivre).

---

*Document de kit de projet — El Mouhssinouen Tours — À utiliser tel quel comme prompt d'amorçage pour l'agent de développement.*
