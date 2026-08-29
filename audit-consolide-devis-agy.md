# Rapport consolidé — Audit `devis_agy` & Plan d'action pour agent IA

**Projet audité :** `devis_agy` (gestion de devis Omra/Hadj VIP) — El Mouhssinoune Tours
**Dépôt :** `github.com/otmaniabdu-ux/devis_agy`, branche `main`
**Date de consolidation :** 29 août 2026
**Sources fusionnées :** 3 audits indépendants (4 documents)

| # | Document source | Auteur | Portée |
|---|---|---|---|
| S1 | `Rapport_Architecture_Clean_Devis-Agy.pdf` | Z.ai Audit Engineering | Clean Architecture / SOLID |
| S2 | `Rapport_Audit_Securite_Devis-Agy.pdf` | Z.ai Audit Engineering | Sécurité OWASP / CVSS |
| S3 | `AUDIT_ARCHITECTURE_SECURITE.md` | Audit non attribué | Architecture + sécurité combinées, très détaillé (79 sections) |
| S4 | `Rapport_d_audit___.md` | Manus AI | Architecture + sécurité combinées, synthétique |

Les rapports S1/S2 sont les versions PDF de `rapport-clean-architecture-devis-agy.md` et `rapport-securite-devis-agy.md` — ils sont traités comme une seule source pour éviter les doublons.

**Objectif de ce document :** remplacer les 4 rapports par un seul document de référence, dédupliqué, et transformer leurs recommandations en un **plan d'action exécutable par un agent IA de codage** (Antigravity CLI ou équivalent), sur le modèle déjà utilisé pour `caisse_agy` V2 (spec + `AGENTS.md`).

---

## Partie 1 — Synthèse exécutive consolidée

### 1.1 Verdict convergent

Les trois audits, menés indépendamment avec des méthodologies différentes, **convergent sur le même diagnostic** :

- **La base technique et le noyau métier sont sains.** `decimal.js` pour l'argent, verrouillage des taux de change, cache PDF avec LRU/sémaphore, modèle Prisma relationnel cohérent, stack moderne (Next.js 16, Prisma 6, Tauri v2). Aucun des 3 audits ne remet en cause ces choix.
- **L'architecture n'est pas en couches.** Aucune séparation Domain/Application/Infrastructure/Presentation. La logique métier (`calculDevis.ts`, `devisPayload.ts`) importe directement Prisma — violation du principe d'inversion de dépendance (DIP) confirmée par S1, S3 et S4.
- **La sécurité applicative est absente**, pas seulement insuffisante : 0 authentification, 0 autorisation, 0 middleware, endpoint `/api/seed` destructif accessible en `GET` sans protection, PII (passeports) versionnées dans Git. Ce point est qualifié de **CRITIQUE** par les 3 audits sans exception.
- **Consensus stratégique : refactoring progressif, pas de réécriture complète.** Contrairement à `caisse_agy`, où la rigidité architecturale justifiait une V2 from scratch, les 3 auditeurs de `devis_agy` recommandent explicitement de **conserver** le code existant et de le faire évoluer par phases, car le domaine métier (calcul financier, PDF, catalogues) est déjà correctement isolé et fonctionnel. S3 est le plus explicite : *« Je recommande de conserver le projet et de le refactorer progressivement plutôt que de le réécrire entièrement. »*

### 1.2 Scores consolidés

| Axe | S1 (Clean Arch) | S3 | Consolidé |
|---|---:|---:|---|
| Score Clean Architecture | 25/100 | 3/10 (≈30/100) | **~27/100 — CRITIQUE** |
| Score sécurité (risque) | 8.5/10 exposition | 1-2/10 auth/API sécu | **CRITIQUE — non déployable en l'état** |
| Potentiel après refactoring | — | 9/10 | **Bon — le socle le justifie** |
| Effort de remédiation estimé | 3-4 mois-homme | non chiffré | **3-4 mois, avec un sprint sécurité de 1 semaine en urgence** |

### 1.3 Verdict de mise en production

**Consensus unanime des 4 documents : l'application ne doit pas être exposée à Internet ni utilisée en accès multi-utilisateur distant dans son état actuel.** Deux conditions bloquantes reviennent dans les 4 rapports :

1. Fermer toutes les API derrière authentification + autorisation.
2. Retirer/désactiver `/api/seed` et purger les données personnelles versionnées dans Git.

---

## Partie 2 — Constats consolidés par domaine (dédupliqués)

Chaque constat indique quels rapports le confirment, pour traçabilité. `S1/S2` = paire Z.ai (architecture/sécurité), `S3` = audit détaillé 79 sections, `S4` = Manus AI.

### 2.1 Authentification et autorisation — **CRITIQUE** (S1,S2,S3,S4 — unanimité)

Aucune route API (`devis`, `clients`, `parametres`, `catalogues`, `pdf`, `seed`) ne vérifie l'identité de l'appelant. Aucun `middleware.ts`, aucun import `next-auth`/`@supabase/auth`/`clerk`/`jsonwebtoken`. `DELETE /api/clients/[id]` déclenche une suppression en cascade (client → devis → passagers → vols → hébergements…) accessible à quiconque connaît un `id`.

**Fichiers :** `src/app/api/devis/route.ts`, `src/app/api/devis/[id]/route.ts`, `src/app/api/clients/**`, `src/app/api/parametres/route.ts`, `src/app/api/pdf/[id]/route.ts`.

### 2.2 Endpoint `/api/seed` destructif — **CRITIQUE** (S1,S2,S3,S4)

`GET` et `POST /api/seed` effacent 13 tables puis repeuplent avec des données de démo. Le fait d'accepter `GET` le rend déclenchable par une simple balise `<img src="/api/seed">` (CSRF trivial, sans JS). `src/app/page.tsx` (lignes 32-46) **déclenche automatiquement** ce seed côté client si `GET /api/devis` renvoie une liste vide — donc une base vidée par erreur se re-remplit automatiquement à la prochaine visite, écrasant un état légitime.

**Fichiers :** `src/app/api/seed/route.ts` (280 lignes), `src/app/page.tsx:31-46`.

### 2.3 Données personnelles versionnées dans Git — **CRITIQUE** (S2,S3,S4)

`db/custom.db` (212 Ko, données réelles : 9 passeports, 5 clients avec téléphone/email, paramètres agence avec RC/IF/ART) et `upload/DEVIS-2026-09-002_client.pdf` (devis réel nominatif) sont trackés par Git malgré un `.gitignore` correct — ils ont été ajoutés avant les règles d'exclusion. Le fichier a été modifié dans au moins 11 commits : **un simple `git rm` ne suffit pas**, l'historique reste contaminé.

### 2.4 Exposition de PII dans les réponses API/PDF — **ÉLEVÉ** (S1,S2,S3,S4)

Les endpoints liste/détail renvoient systématiquement `client` + `passagers` (avec numéros de passeport complets) sans projection minimale. Le PDF interne et le PDF client ne sont pas différenciés.

### 2.5 Validation serveur / mass assignment — **ÉLEVÉ** (S1,S2,S3,S4)

Zod est installé (v4.4.3) mais **zéro import** dans le code (`grep -rn "from 'zod'" src/` → 0 résultat, confirmé par S1 et S2 indépendamment). Tous les handlers consomment `body: any` directement. `devisPayload.ts` applique des coercitions défensives dangereuses : `String(body.tauxSarDzd ?? '0')`, `safeDate()` qui remplace une date invalide par `new Date()` (date du jour) au lieu de rejeter la requête.

**Fichier le plus dense :** `src/lib/devisPayload.ts` — 39 occurrences de `any` sur 269 lignes (14,5 %).

### 2.6 Taux de change modifiables côté client — **ÉLEVÉ** (S1,S3)

`resolveTaux` accepte les taux envoyés dans le body au lieu de les lire uniquement côté serveur au moment de la création. Un devis en cours peut voir ses taux verrouillés modifiés via `PUT`, cassant l'intégrité financière du document (violation directe du principe métier « taux verrouillés à la création »).

### 2.7 Mutations non atomiques — **ÉLEVÉ** (S1,S2,S3,S4)

Le `PUT /api/devis/[id]` supprime puis recrée 8 collections enfants (passagers, segmentsVol, hébergements, transferts, trainsHaramain, prestationsVip, campsMashair, transportsMashair) **sans `db.$transaction()`**. Une exception en cours de séquence laisse un devis partiellement vide, ce qui casse silencieusement le calcul financier et la génération PDF ultérieure.

### 2.8 Configuration de sécurité et infra — **MOYEN à ÉLEVÉ** (S2,S3,S4)

- `next.config.ts` : aucun `headers()`, pas de CSP/HSTS/X-Frame-Options/`poweredByHeader: false`.
- Tauri : `"csp": null` dans `tauri.conf.json` — aucune Content-Security-Policy dans le WebView desktop.
- `Caddyfile` : paramètre de requête public `XTransformPort` utilisé pour choisir le port du reverse-proxy local → **SSRF** exploitable pour scanner/atteindre des services internes (Redis, PostgreSQL, SSH…).
- `tsconfig.json` : `strict: true` mais `noImplicitAny: false` (contredit `strict`) ; `next.config.ts` : `ignoreBuildErrors: true` et `reactStrictMode: false`.
- ESLint : 15+ règles critiques désactivées (`no-explicit-any`, `no-unused-vars`, `react-hooks/exhaustive-deps`…) — le lint passe toujours, quelle que soit la qualité du code.
- `robots.txt` autorise l'indexation complète, risque d'indexation de `/api/seed` par les moteurs de recherche.

### 2.9 Absence d'architecture en couches — **STRUCTUREL** (S1,S3,S4 — unanimité)

Aucun dossier `domain/`, `application/`, `infrastructure/`. `calculDevis.ts` (322 lignes) mélange lecture Prisma, calcul métier (200+ lignes) et persistance des totaux dans une seule fonction. Aucun pattern Repository (0 fichier `*Repository.ts`), aucune couche UseCase. `NouveauDevisView.tsx` (482 lignes) cumule chargement API, état du wizard, mapping DTO/UI et sauvegarde — un « god component ».

**Dépendances installées mais jamais utilisées** (signal de dette, S1) : `zustand` (0 import), `@tanstack/react-query` (0 import — chaque vue fait son propre `fetch` dans un `useEffect`, sans cache), `@tanstack/react-table` (0 import).

### 2.10 Absence totale de tests — **STRUCTUREL** (S1,S3)

0 fichier `*.test.*`/`*.spec.*`, aucun framework de test installé, aucun script `test` dans `package.json`. Conséquence directe : **aucune refactorisation ne peut être validée sans risque de régression silencieuse.**

### 2.11 Conformité RGPD / Loi 18-07 (Algérie) — **CONFORMITÉ** (S2)

Traitement de données de catégorie sensible (Art. 9 RGPD : contexte religieux implicite Omra/Hadj) sans base légale documentée, sans registre des traitements, sans DPO désigné, sans procédure d'effacement (le droit à l'oubli n'efface ni les PDF générés, ni les logs, ni l'historique Git).

### 2.12 Dépendances / supply chain — **À CONFIRMER** (S2,S4)

`bun audit` non exécutable dans l'environnement d'analyse (Bun absent) ; `npm audit` a échoué (cache inaccessible). S2 rapporte, via l'historique de commit du dépôt, une réduction de 73 à 36 vulnérabilités non traitées — **chiffre non vérifié indépendamment**, à confirmer en CI avant toute action corrective.

---

## Partie 3 — Matrice de risque consolidée

| ID | Constat | Sévérité | Sources |
|---|---|---|---|
| R-01 | API sans authn/authz | Critique | S1,S2,S3,S4 |
| R-02 | `/api/seed` destructif + auto-seed | Critique | S1,S2,S3,S4 |
| R-03 | PII/passeports versionnés dans Git | Critique | S2,S3,S4 |
| R-04 | PII exposées sans minimisation (API/PDF) | Élevé | S1,S2,S3,S4 |
| R-05 | Validation serveur absente (Zod non utilisé) | Élevé | S1,S2,S3,S4 |
| R-06 | Taux de change modifiables côté client | Élevé | S1,S3 |
| R-07 | Mutations multi-tables non transactionnelles | Élevé | S1,S2,S3,S4 |
| R-08 | CSP Tauri désactivée (`null`) | Élevé | S2,S3,S4 |
| R-09 | SSRF via `Caddyfile` (`XTransformPort`) | Élevé | S2,S3 |
| R-10 | Headers de sécurité HTTP absents | Moyen/Élevé | S2,S3,S4 |
| R-11 | TS/ESLint affaiblis (`ignoreBuildErrors`, `noImplicitAny: false`) | Moyen | S1,S2,S3 |
| R-12 | Architecture en couches absente | Structurel | S1,S3,S4 |
| R-13 | 0 test automatisé | Structurel | S1,S3 |
| R-14 | RGPD / Loi 18-07 non traitées | Conformité | S2 |
| R-15 | Dépendances non auditées de façon fiable | À confirmer | S2,S4 |

---

## Partie 4 — Plan d'action pour l'agent IA

### 4.1 Comment utiliser ce document

Ce plan est écrit pour être exécuté par un agent de codage (Antigravity CLI ou équivalent), phase par phase. Chaque phase est **une unité de livraison indépendante** avec un objectif, une checklist, les fichiers concernés et des critères d'acceptation vérifiables. Recommandation opérationnelle, cohérente avec ta pratique sur `caisse_agy` :

1. Copier la section **4.2 (règles non négociables)** dans un `AGENTS.md` à la racine de `devis_agy`, pour injection persistante dans le contexte de l'agent.
2. Traiter les phases dans l'ordre — **la Phase 0 est bloquante** et doit être livrée avant tout autre développement fonctionnel, y compris avant de commencer le refactoring architectural.
3. Une branche Git dédiée par phase, avec revue avant merge sur `main`.
4. Aucune phase de refactoring (2 et suivantes) ne démarre sans que la Phase 1 (tests de base + Zod sur une route pilote) soit posée — sans filet de tests, une refactorisation est un pari, pas une ingénierie.

### 4.2 Règles d'architecture et de sécurité non négociables (à copier dans `AGENTS.md`)

```text
ARCHITECTURE RULES — devis_agy

1. Le domaine (domain/) n'importe jamais Prisma, Next.js, React ni le système de fichiers.
2. L'application (application/) ne dépend que du domaine et de ports (interfaces).
3. L'infrastructure implémente les ports définis par l'application — jamais l'inverse.
4. La présentation (routes API, composants) appelle des use cases — jamais Prisma directement.
5. Aucune règle métier dans un composant React.
6. Aucune règle métier dans un route handler Next.js.
7. Tout calcul monétaire passe par Money/Decimal — jamais de float ni de string non typé.
8. Toute entrée externe (body, query, params) est validée par un schéma Zod avant usage.
9. Toute opération destructive (delete, seed, purge) exige une autorisation vérifiée côté serveur.
10. Les PDF internes (avec passeports) et les PDF clients sont deux projections distinctes et protégées séparément.
11. Les taux de change verrouillés sur un devis sont immuables après création — jamais réécrits depuis un PUT.
12. Toute mutation multi-tables sur un agrégat (Devis) est encapsulée dans db.$transaction().
13. Toute mutation sensible (suppression, changement de statut, modification financière) génère un événement d'audit.
14. Aucun endpoint de seed ou de diagnostic destructif n'existe en production.
15. Aucune donnée personnelle réelle (PII, passeport) n'est committée dans Git — dev/test utilisent des données fictives.
16. `ignoreBuildErrors` et `noImplicitAny: false` sont interdits en configuration.
17. Chaque route API migrée doit être accompagnée d'au moins un test d'intégration (succès + refus non autorisé).
```

### 4.3 Phase 0 — Sécurisation d'urgence (bloquante, avant tout autre développement)

**Objectif :** rendre l'application non exploitable par un attaquant non authentifié, sans attendre le refactoring architectural. Effort estimé : ~1 semaine-homme (aligné sur les 3 audits).

**Tâches :**

- [ ] Supprimer `/api/seed` du build de production, ou le protéger par un guard `NODE_ENV !== 'production'` + authentification admin forte + méthode `POST` uniquement (jamais `GET`).
- [ ] Retirer la logique d'auto-seed de `src/app/page.tsx:31-46`.
- [ ] Ajouter un `middleware.ts` à la racine qui bloque toutes les routes `/api/**` tant que l'authentification n'est pas branchée (fail-closed par défaut, pas fail-open).
- [ ] Retirer `db/custom.db` et `upload/*.pdf` du suivi Git (`git rm --cached`), vérifier que `.gitignore` les couvre bien, committer.
- [ ] **Planifier séparément** (hors urgence immédiate, action destructive à valider avec toi avant exécution) : purge de l'historique Git via `git filter-repo` pour les fichiers listés ci-dessus, suivie d'un `push --force-with-lease` coordonné et de l'invalidation des clones existants.
- [ ] Réécrire le `Caddyfile` pour supprimer le matcher `XTransformPort` (SSRF).
- [ ] Ajouter `"csp"` non-null dans `src-tauri/tauri.conf.json` (ex. `default-src 'self'; script-src 'self'; connect-src 'self' ipc: http://ipc.localhost`).
- [ ] Ajouter `headers()` dans `next.config.ts` : CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `poweredByHeader: false`.
- [ ] Retirer `ignoreBuildErrors: true`, remettre `reactStrictMode: true`.
- [ ] Corriger `tsconfig.json` : `noImplicitAny: true`.
- [ ] Mettre `robots.txt` en `Disallow: /`.

**Critères d'acceptation :** aucune route API ne répond en dehors d'un contexte authentifié ; `/api/seed` n'est plus atteignable en production ; `git log --all -- db/custom.db` documenté avec un plan de purge validé ; build de production échoue si une erreur TypeScript existe.

### 4.4 Phase 1 — Filet de sécurité : tests + validation sur route pilote

**Objectif :** poser les fondations testables avant de toucher à l'architecture.

**Tâches :**

- [ ] Installer Vitest (unitaire/intégration) et Playwright (e2e), scripts `test`/`test:e2e` dans `package.json`.
- [ ] Écrire les premiers tests sur `src/lib/money.ts` (le module le plus critique et le plus isolé).
- [ ] Choisir **une route pilote** (`/api/clients`, la plus simple du domaine) et la migrer complètement vers un schéma Zod + Repository + UseCase minimal — ce sera le modèle reproductible pour les 12 autres routes.
- [ ] Ajouter React Query Provider dans `layout.tsx` (sans migrer toutes les vues immédiatement).

**Critères d'acceptation :** `bun test` exécute au moins 10 tests verts ; `/api/clients` rejette un payload invalide avec une erreur 400 structurée ; le pattern est documenté dans un court ADR pour servir de référence aux phases suivantes.

### 4.5 Phase 2 — Intégrité des données et transactions

**Objectif :** rendre les mutations financières atomiques et fiables avant d'étendre la surface fonctionnelle.

**Tâches :**

- [ ] Encapsuler `PUT /api/devis/[id]` (delete + recreate des 8 collections enfants + recalcul) dans `db.$transaction()`.
- [ ] Verrouiller les taux de change : `resolveTaux` ignore toute valeur envoyée par le client pour un devis existant ; les taux ne sont lus/fixés que côté serveur à la création.
- [ ] Ajouter validation Zod sur toutes les routes `devis` (montants non négatifs, taux strictement positifs, dates cohérentes, enums fermés pour statut/devise/catégorie).
- [ ] Ajouter un contrôle d'optimistic locking (`updatedAt` attendu en entrée du `PUT`) pour éviter les écrasements concurrents.

**Critères d'acceptation :** un test d'intégration simule une erreur au milieu du `PUT` et vérifie que l'état reste cohérent (rollback complet) ; un test vérifie qu'un taux envoyé dans le body d'un `PUT` sur un devis existant est ignoré.

### 4.6 Phase 3 — Extraction du domaine (Clean Architecture progressive)

**Objectif :** créer l'arborescence cible sans réécrire l'UI, en commençant par les modules les plus réutilisables.

Arborescence cible (consensus S1/S3) :

```text
src/
  domain/
    quote/ {Quote.ts, QuoteCalculator.ts, QuoteRules.ts, QuoteRepository.ts (port), value-objects/}
    client/ {Client.ts, ClientRepository.ts (port)}
    shared/ {Money.ts, Currency.ts, DomainError.ts}
  application/
    quotes/ {CreateQuoteUseCase.ts, UpdateQuoteUseCase.ts, GetQuoteUseCase.ts,
             DeleteQuoteUseCase.ts, CalculateQuoteUseCase.ts, GenerateQuotePdfUseCase.ts, dto.ts}
    clients/ {CreateClientUseCase.ts, UpdateClientUseCase.ts}
    ports/ {Clock.ts, UnitOfWork.ts}
  infrastructure/
    prisma/ {PrismaClient.ts, PrismaQuoteRepository.ts, PrismaClientRepository.ts,
             PrismaUnitOfWork.ts, mappers/}
    pdf/ {PdfQuoteRenderer.ts}
  presentation/
    http/ {api/devis/, api/clients/, middleware.ts, errors.ts}
    validation/ {quoteSchemas.ts}
```

**Tâches :**

- [ ] Créer les Value Objects `Money`, `Currency`, `DevisStatus`, `PassengerCategory` avec invariants encapsulés (remplacer les `string` libres du schéma Prisma par des enums applicatifs contrôlés en amont).
- [ ] Extraire `DevisCalculator` (fonction pure, testable sans DB) depuis `calculDevis.ts` — aucune référence à `db` dans ce module.
- [ ] Définir les interfaces `QuoteRepository`, `ClientRepository` dans `application/ports`.
- [ ] Implémenter `PrismaQuoteRepository`, `PrismaClientRepository` dans `infrastructure/prisma`.
- [ ] Injecter une horloge (`Clock`) pour rendre déterministes les tests de numérotation de devis.

**Critères d'acceptation :** un test d'architecture automatisé échoue si un fichier sous `src/domain/` importe `@prisma/client`, `next/server` ou `src/lib/db` (règle testée, pas seulement documentée).

### 4.7 Phase 4 — Use Cases + migration des routes API

**Objectif :** vider les route handlers de toute logique métier.

**Tâches :**

- [ ] Créer `CreateDevisUseCase`, `UpdateDevisUseCase`, `GetDevisUseCase`, `ListDevisUseCase`, `DeleteDevisUseCase`, `CalculateDevisUseCase`, `GenerateDevisPdfUseCase`, `UpdateParametersUseCase`.
- [ ] Migrer les 13 routes API une par une vers le pattern : parsing → validation Zod → appel use case → mapping HTTP (10 lignes max par handler).
- [ ] Séparer les projections de réponse : liste (sans passagers/passeports), détail (autorisé uniquement), PDF client (sans données internes) vs PDF interne (protégé, accès restreint).

**Critères d'acceptation :** aucun `import { db }` restant dans `src/app/api/**` ; chaque route dispose d'un test qui vérifie le refus d'un appel non autorisé (401/403) et le refus d'un payload invalide (400).

### 4.8 Phase 5 — Sécurité applicative complète

**Objectif :** authentification, autorisation par rôle, traçabilité.

**Tâches :**

- [ ] Implémenter l'authentification serveur (session/JWT via un fournisseur fiable — évaluer NextAuth ou Supabase Auth selon la stratégie d'hébergement retenue).
- [ ] RBAC minimal : rôles `admin`, `agent`, `lecture`, vérifiés côté serveur sur chaque use case (jamais seulement côté UI).
- [ ] Ajouter une table `AuditEvent` + middleware qui journalise les mutations sensibles (suppression, changement de statut, modification de taux, génération PDF interne).
- [ ] Rate limiting par IP/utilisateur sur les endpoints coûteux (PDF, création, futur seed protégé).
- [ ] Cookies `HttpOnly`, `Secure`, `SameSite=Strict` ; vérification `Origin`/`Referer` sur les mutations.

**Critères d'acceptation :** une tentative d'accès sans session valide sur une route mutante retourne 401 systématiquement, vérifié par test automatisé sur les 13 routes.

### 4.9 Phase 6 — Couverture de tests

**Objectif :** 70 % de couverture Domain/Application, 50 % API, parcours e2e critiques.

**Tâches :**

- [ ] Tests unitaires Domain : nuitées, seuil d'alerte passeport, conversion devise, marge pourcentage/fixe, cas zéro passager.
- [ ] Tests d'intégration Application : création atomique, rollback sur échec, autorisations par rôle.
- [ ] Tests API : payload invalide, ressource inconnue, réponses sans champs internes.
- [ ] 3 parcours Playwright critiques : création de devis, génération PDF, suppression en cascade.

### 4.10 Phase 7 — Durcissement desktop (Tauri) et infra

**Tâches :**

- [ ] Vérifier que les `capabilities` Tauri restent minimales (`core:default` uniquement, pas d'accès filesystem/shell superflu).
- [ ] Documenter et verrouiller le flux `Tauri → serveur d'application local → SQLite`.
- [ ] Politique de sauvegarde chiffrée + test de restauration.
- [ ] `identifier` Tauri à remplacer (actuellement un placeholder par défaut `com.tauri.dev`).

### 4.11 Phase 8 — Conformité RGPD / Loi 18-07

**Tâches (à traiter en parallèle, pas bloquantes pour le code, mais à ne pas oublier) :**

- [ ] Politique de rétention des données avec purge automatique.
- [ ] Procédure d'effacement complète (DB + PDF générés + logs) sur suppression d'un client.
- [ ] Désignation d'un référent protection des données pour l'agence.
- [ ] Mention d'information aux clients sur le traitement de leurs données (passeport, contexte religieux).

---

## Partie 5 — Prompt de kickoff suggéré pour l'agent IA

```text
Contexte : tu interviens sur devis_agy, une application Next.js 16 / React 19 / Prisma 6 / SQLite /
Tauri v2 de gestion de devis Omra-Hadj VIP pour l'agence El Mouhssinoune Tours. Un audit consolidé
(fichier audit-consolide-devis-agy.md) a identifié des vulnérabilités critiques (absence totale
d'authentification, endpoint /api/seed destructif, PII versionnées dans Git) et une dette
architecturale significative (absence de couches Domain/Application/Infrastructure).

Règle absolue : commence uniquement par la Phase 0 (sécurisation d'urgence) du plan d'action,
section 4.3. Ne touche à aucune fonctionnalité métier tant que cette phase n'est pas validée.
Chaque tâche cochée doit être accompagnée d'un test ou d'une preuve vérifiable (commande exécutée,
diff de config). Pour toute action destructive sur l'historique Git (purge de db/custom.db),
arrête-toi et demande confirmation explicite avant d'exécuter — ne l'automatise pas.

Respecte les règles d'architecture non négociables listées en section 4.2 pour toute Phase >= 3.
Livre chaque phase sur une branche dédiée avec un résumé des critères d'acceptation vérifiés.
```

---

## Annexe — Convergence des 4 documents sources

Les 4 rapports ont été produits par des méthodologies et des outils différents (Z.ai Audit Engineering pour S1/S2, un auditeur non attribué pour S3, Manus AI pour S4), sans coordination entre eux. Le fait que les 4 documents convergent indépendamment sur les mêmes constats critiques (auth absente, `/api/seed` destructif, PII dans Git, absence de couches) est un signal fort de fiabilité de ces constats — ce ne sont pas des artefacts d'un seul outil ou d'un biais de méthode. Les divergences mineures observées (score exact, formulation des phases) relèvent de la présentation, pas du fond.
