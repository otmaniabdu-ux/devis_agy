# Testing — Référence

## Pyramide des tests

```
      /\
     /  \     E2E (peu, lents, coûteux)
    /____\
   /      \   Integration (moyen)
  /________\
 /          \ Unit (beaucoup, rapides, isolés)
/____________\
```

## Critères de qualité des tests

- [ ] Chaque test a une seule raison d'échouer
- [ ] Nom du test décrit le comportement attendu : `should_return_404_when_user_not_found`
- [ ] Pas de logique conditionnelle dans les tests
- [ ] Pas de dépendances externes non mockées en unitaire
- [ ] Tests d'intégration testent les vraies dépendances (DB, API)
- [ ] Tests E2E couvrent les parcours critiques (happy path + erreurs)

## Couverture

- Minimum 70% de couverture de branches
- 100% sur le domaine / business logic
- Un fichier non testé doit être justifié

## Smoke tests

- [ ] L'application démarre
- [ ] Healthcheck répond 200
- [ ] Une requête critique fonctionne

## Static Analysis

- [ ] Linter : 0 erreur
- [ ] Type checker : 0 erreur
- [ ] Formatter : appliqué uniformément
