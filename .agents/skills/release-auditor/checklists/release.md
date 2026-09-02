# Checklist — Final Verification & Release

## Rebuild
- [ ] Clean build réussi
- [ ] Pas de warning nouveau
- [ ] Tailles de bundle raisonnables

## Retest
- [ ] Tous les tests passent
- [ ] Pas de flaky test
- [ ] Couverture maintenue ou améliorée

## Re-audit
- [ ] Aucun nouveau blocker introduit
- [ ] Architecture toujours respectée
- [ ] Sécurité non régressée

## Git
- [ ] `git diff` relu
- [ ] Commits atomiques et message clair
- [ ] Pas de fichiers non intentionnels

## Documentation
- [ ] CHANGELOG mis à jour
- [ ] README à jour si nouvelle commande / config
- [ ] Migrations documentées

## Verdict
- [ ] 🟢 READY : tout est vert
- [ ] 🟡 CONDITIONAL : warnings documentés et acceptés
- [ ] 🔴 BLOCKED : blocker non résolu
