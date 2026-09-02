# Checklist — Dead Code / Cleanup

## Fichiers
- [ ] Pas de fichiers orphelins (vérifier routing dynamique)
- [ ] Pas de composants jamais importés
- [ ] Pas de stories inutilisées

## Code
- [ ] Pas d'imports inutilisés
- [ ] Pas de fonctions exportées mais jamais utilisées
- [ ] Pas de variables / paramètres inutilisés
- [ ] Pas de code commenté > 2 lignes

## Debug
- [ ] Pas de `console.log` en production
- [ ] Pas de `debugger`
- [ ] Pas de routes `/debug`, `/test`

## Dépendances
- [ ] Pas de packages jamais importés
- [ ] Pas de devDependencies en production

## Duplication
- [ ] Pas de blocs > 6 lignes identiques
- [ ] Pas de fonctions quasi-identiques
