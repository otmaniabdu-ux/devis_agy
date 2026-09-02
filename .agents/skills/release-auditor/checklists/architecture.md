# Checklist — Architecture Audit

## Structure du projet
- [ ] Organisation des dossiers cohérente avec l'architecture déclarée
- [ ] Pas de fichiers à la racine sans justification
- [ ] Pas de dossiers vides

## Clean Architecture
- [ ] Dependency Rule respectée (dépendances vers l'intérieur)
- [ ] Domaine indépendant des frameworks
- [ ] Adapters dans leur propre couche
- [ ] Composition root identifiable

## SOLID
- [ ] Pas de God Class
- [ ] Pas de violation LSP
- [ ] Interfaces cohérentes et petites
- [ ] Dépendances injectées

## Couches & Frontières
- [ ] Frontière claire entre Application et Infrastructure
- [ ] Pas de fuite de détails techniques dans le domaine
- [ ] Use cases atomiques et compréhensibles

## Modules
- [ ] Pas de modules trop superficiels (< 3 fichiers sans justification)
- [ ] Pas de modules trop profonds (> 5 niveaux)
- [ ] Cohésion forte à l'intérieur, couplage faible entre modules
