# CLAUDE.md — El Mouhssinoune Tours — Omra & Hadj VIP Quotes

Directives pour Claude Code. La référence complète et contraignante est **@agents.md** (même dépôt) — les règles ci-dessous sont le résumé opérationnel.

## Commandes

```bash
bun run dev          # Dev web sur http://localhost:3000 (login : agent / Agence@2026 par défaut)
bun run build        # next build + copie des assets standalone (obligatoire, voir ci-dessous)
bun run start        # Serveur de production (standalone)
bun run test         # 70 tests unitaires Vitest — doit rester vert
bun run test:e2e     # 7 tests E2E Playwright (login automatique + storageState)
bun run lint         # ESLint — 0 erreur obligatoire
bunx tsc --noEmit    # Typage strict — 0 erreur
bun scripts/seed-user.ts            # Crée le compte agent (MOT_DE_PASSE=... pour personnaliser)
bun run db:push && bun run db:generate   # Schéma Prisma → SQLite db/custom.db
```

## Règles critiques (voir agents.md pour le détail)

1. **Monnaies** : jamais de `number` JS — `String` décimale + `Decimal.js` (`ROUND_HALF_UP`, 2 décimales). Taux verrouillés dans chaque `Devis`.
2. **Auth API obligatoire** : chaque handler de route (sauf `/api/auth/login` et `/api/health`) commence par `const agent = await requireAgent(req); if (agent instanceof NextResponse) return agent;` (`src/lib/api-auth.ts`). Le proxy `src/proxy.ts` renvoie déjà 401 sans cookie — ne pas élargir `PUBLIC_API_ROUTES`.
3. **Validation Zod** sur tout body POST/PUT (`src/lib/validation/`) → `400` avec détails ; accepter les `null` venant de la base (`nullish` → « ne pas modifier »).
4. **Écritures atomiques** : `db.$transaction` + passage de `tx` aux Use Cases (`RecalculerDevisUseCase.execute(id, tx)`).
5. **PII** : les endpoints de liste n'exposent que les champs affichés (`select`) ; passeports/adresses/notes réservés au détail.
6. **Zéro `any`** ; `catch (error: unknown)` + `getErrorMessage()` ; tests Vitest pour tout nouveau Use Case / algorithme financier.
7. **Build standalone** : `output: 'standalone'` ne sert pas `.next/static`, `public/` ni les DLL sharp (`node_modules/@img`) — `bun run build` exécute automatiquement `scripts/copy-standalone-assets.ts`, ne pas le retirer.
8. **Next.js 16** : le fichier de sécurité est `src/proxy.ts` (ex-`middleware.ts`, runtime Node.js). Lire `node_modules/next/dist/docs/` avant tout code Next.
9. **Ne jamais** recalculer les taux d'un devis existant avec les taux globaux ; ne pas toucher à `PricingEngine.ts` sans couverture de test.

## Pièges connus

- Après `db:push` (nouveau modèle Prisma) : `bun run db:generate` puis redémarrer le serveur.
- Si l'app reste sur « Initialisation de l'application… » : les assets standalone manquent → relancer `bun run build`.
- L'export JPEG échoue en 500 hors build complet : les DLL libvips doivent être dans `.next/standalone/node_modules/@img`.
- Le dev-server Turbopack sous Bun/Windows peut se figer après de nombreuses compilations à froid — le build de production est stable (c'est le mode sidecar Tauri).
