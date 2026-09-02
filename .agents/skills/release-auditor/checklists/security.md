# Checklist — Security Audit

## Secrets
- [ ] Aucune clé en dur dans le code source
- [ ] Aucun secret dans les logs
- [ ] `.env.*` dans `.gitignore`
- [ ] Variables d'environnement validées au startup

## Injection
- [ ] Requêtes DB paramétrées
- [ ] Pas d'`eval` / `exec` avec input user
- [ ] Path traversal protégé
- [ ] XSS : output encodé

## Auth
- [ ] JWT signé et vérifié
- [ ] Sessions sécurisées
- [ ] Rate limiting auth
- [ ] Pas de données sensibles en clair dans JWT

## Permissions
- [ ] RBAC vérifié sur chaque endpoint sensible
- [ ] Pas de `admin=true` hardcodé
- [ ] Vérification des permissions côté serveur

## Dépendances
- [ ] `npm audit` / équivalent sans critical/high
- [ ] Pas de dépendances obsolètes critiques
- [ ] Pas de fork non maintenu
