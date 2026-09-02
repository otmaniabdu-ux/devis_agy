#!/bin/bash
set -euo pipefail

echo "🔍 Détection du dead code..."

# Détection des imports inutilisés (TypeScript/JavaScript)
if [ -f "package.json" ]; then
    echo "→ Vérification des imports inutilisés (TS/JS)..."
    if command -v npx &> /dev/null && npx tsc --noEmit 2>/dev/null; then
        echo "  TypeScript OK"
    fi
    if command -v npx &> /dev/null && npm ls knip &> /dev/null; then
        npx knip --production || true
    else
        echo "  ⚠️ knip non installé. Installer avec: npm install -D knip"
    fi
fi

# Détection Python
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "→ Vérification Python..."
    if command -v vulture &> /dev/null; then
        vulture . --min-confidence 80 || true
    else
        echo "  ⚠️ vulture non installé. Installer avec: pip install vulture"
    fi
fi

# Fichiers potentiellement orphelins
echo "→ Recherche de fichiers potentiellement orphelins..."
find . -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/.next/*' \
    -not -name '*.md' \
    -not -name '*.json' \
    -not -name '*.yml' \
    -not -name '*.yaml' \
    -not -name '*.lock' \
    -not -name '.env*' \
    -not -name 'Dockerfile' \
    -not -name 'docker-compose*' \
    | while read -r file; do
        basename_file=$(basename "$file")
        # Vérifier si le fichier est référencé ailleurs
        if ! grep -r --include='*.*' -l "$basename_file" . \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=dist \
            --exclude-dir=build \
            --quiet 2>/dev/null; then
            echo "  ⚠️ Potentiellement orphelin: $file"
        fi
    done

echo "✅ Détection terminée. Vérifier manuellement les fichiers signalés."
