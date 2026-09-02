# Dead Code Cleanup — Référence

## Règle d'or

> Ne jamais supprimer quelque chose uniquement parce que l'agent ne trouve pas de référence.

## Catégories à inspecter

### 1. Fichiers orphelins
- Non importés par aucun autre fichier
- Vérifier : routing dynamique, DI container, reflection, glob imports

### 2. Composants / fonctions inutilisés
- Exporté mais jamais importé
- Vérifier : usage dans tests, stories, documentation

### 3. Imports inutilisés
- `import` déclaré mais non utilisé
- Facilement détectable par le linter

### 4. Dépendances inutilisées
- Listées dans `package.json` / `requirements.txt` mais jamais importées
- Vérifier : usage dans scripts, config, CLI

### 5. Code commenté
- Blocs de code en commentaire > 2 lignes
- À supprimer (Git garde l'historique)

### 6. Debug code
- `console.log`, `debugger`, `print()` en production
- Routes de debug, endpoints `/test`, `/debug`

### 7. Duplication
- Fonctions identiques ou quasi-identiques
- Extraire ou supprimer

### 8. Variables / paramètres inutilisés
- Paramètre de fonction jamais utilisé
- Variable assignée mais jamais lue

## Procédure de suppression

1. Identifier le code suspect
2. Chercher dans TOUT le projet (grep, IDE)
3. Vérifier les usages dynamiques
4. Vérifier les tests qui pourraient l'utiliser indirectement
5. **Créer un commit séparé** pour la suppression
6. Relancer les tests
7. Si échec → revert immédiatement
