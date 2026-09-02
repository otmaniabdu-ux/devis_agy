# Code Quality — Référence

## Complexité

- Cyclomatique : max 10 par fonction, idéal < 5
- Cognitive : max 15 par fonction
- Nesting : max 3 niveaux d'indentation

## Duplication

- DRY : pas de blocs > 6 lignes identiques
- Pas de copy-paste entre fichiers
- Extraire les constantes magiques

## Nommage

- Variables : nom = valeur (pas `data`, `tmp`, `x`)
- Fonctions : verbe + objet + contexte (`calculateOrderTotal`)
- Classes : nom = responsabilité
- Booléens : préfixe `is`, `has`, `should`

## Abstractions

- Pas d'abstraction prématurée
- Pas de Factory pour créer 2 objets
- Pas d'interface avec une seule implémentation (sauf test)
- Principe YAGNI : "You Aren't Gonna Need It"

## Gestion d'erreurs

- Pas de `catch (e) { console.log(e) }` silencieux
- Pas de `throw "string"`
- Erreurs typées / custom errors
- Fail fast : valider les inputs en entrée

## Commentaires

- Le code doit se commenter lui-même
- Commentaires = "pourquoi", pas "quoi"
- Pas de code commenté mort
