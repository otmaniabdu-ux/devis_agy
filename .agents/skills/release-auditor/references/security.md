# Security Audit — Référence

## Checkpoints obligatoires

### 1. Secrets & Credentials
- [ ] Pas de clés API en dur dans le code
- [ ] Pas de `.env` commité
- [ ] Pas de `console.log` de tokens / passwords
- [ ] Variables d'environnement validées au startup

### 2. Injection
- [ ] SQL/NoSQL : requêtes paramétrées uniquement
- [ ] Command injection : pas de `exec` / `eval` avec input utilisateur
- [ ] Path traversal : input sanitizé avant `fs.readFile`
- [ ] XSS : output encodé si rendu HTML

### 3. Authentification & Autorisation
- [ ] JWT : vérification de signature, expiration, `aud`/`iss`
- [ ] Pas de données sensibles dans le payload JWT
- [ ] RBAC / ABAC correctement implémenté
- [ ] Rate limiting sur les endpoints auth

### 4. Données
- [ ] PII chiffrée au repos
- [ ] HTTPS en production
- [ ] Headers de sécurité (HSTS, CSP, X-Frame-Options)
- [ ] CORS restrictif

### 5. Dépendances
- [ ] `npm audit` / `pip-audit` / `cargo audit` sans critical/high
- [ ] Pas de dépendances obsolètes non maintenues
- [ ] Pas de typo-squatting détecté

## Outils recommandés
- Semgrep, CodeQL, Trivy, Snyk, OWASP Dependency-Check
