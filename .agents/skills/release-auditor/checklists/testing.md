# Checklist — Test & Verification

## Build
- [ ] Build passe en local
- [ ] Build passe en CI
- [ ] Pas de warning critique

## Unit Tests
- [ ] Couverture > 70% global
- [ ] Couverture 100% domaine
- [ ] Tests isolés, pas de dépendances externes
- [ ] Noms explicites

## Integration Tests
- [ ] DB réelle ou testcontainer
- [ ] API réelle mockée si externe
- [ ] Scénarios d'erreur testés

## E2E / Smoke
- [ ] Parcours critique couvert
- [ ] Healthcheck testé
- [ ] Temps d'exécution acceptable

## Static Analysis
- [ ] Linter : 0 erreur
- [ ] Type checker : 0 erreur
- [ ] Formatter appliqué
