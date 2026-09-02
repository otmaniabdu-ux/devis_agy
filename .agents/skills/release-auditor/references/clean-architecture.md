# Clean Architecture — Référence

## Dependency Rule

Les dépendances vont **toujours vers l'intérieur** :

```
Frameworks / UI / External APIs
        ↓
    Adapters / Infrastructure
        ↓
    Application / Use Cases
        ↓
      Domain (Entities)
```

## Ce que le Domaine ne doit PAS connaître

- ❌ UI (React, Vue, Tauri, CLI)
- ❌ Base de données (EF Core, SQLAlchemy, Prisma)
- ❌ HTTP / API externe
- ❌ Frameworks spécifiques
- ❌ SQLite, Redis, MessageQueue

## Frontières à vérifier

1. **Pas de `import` infrastructure dans le domaine**
2. **Les use cases ne dépendent que du domaine**
3. **Les adapters implémentent des interfaces définies dans le domaine/application**
4. **La composition root (main/index) est le seul endroit où tout est câblé**

## Anti-patterns à détecter

- Domain qui importe `axios`, `fetch`, `prisma`, `react`
- Use case qui connaît le format JSON de l'API
- Entity qui contient des décorateurs ORM
- Repository interface définie dans l'infrastructure

## Règle d'or

> L'organisation des dossiers n'est pas la Clean Architecture.  
> Ce qui compte, c'est la direction des dépendances.
