# SOLID — Référence

## S — Single Responsibility Principle
- Une classe / module / fonction = une raison de changer
- Vérifier : "Est-ce que cette classe gère à la fois du parsing ET de la persistence ?"

## O — Open/Closed Principle
- Ouvert à l'extension, fermé à la modification
- Vérifier : "Dois-je modifier le code existant pour ajouter un cas ?"

## L — Liskov Substitution Principle
- Classe fille substituable à la classe mère sans altérer la correction
- Vérifier : "Est-ce que l'override change le contrat ?"

## I — Interface Segregation Principle
- Pas d'interface "fourre-tout"
- Vérifier : "Est-ce que l'implémenteur est forcé de définir des méthodes inutiles ?"

## D — Dependency Inversion Principle
- Dépendre d'abstractions, pas de concretions
- Vérifier : "Est-ce que le module de haut niveau dépend d'un module de bas niveau ?"

## Checklist rapide

- [ ] Pas de God Class (>300 lignes ou >10 méthodes publiques)
- [ ] Pas de switch/case géants sur des types
- [ ] Les dépendances externes sont injectées
- [ ] Les mocks en tests sont faciles à créer (signe d'abstraction)
