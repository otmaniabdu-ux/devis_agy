#!/bin/bash
set -euo pipefail

echo "🧪 Exécution des tests..."

# Node.js
if [ -f "package.json" ]; then
    echo "→ Tests Node.js..."
    if npm run test --if-present 2>/dev/null; then
        echo "  ✅ Tests Node.js passés"
    else
        echo "  ❌ Tests Node.js échoués"
        exit 1
    fi
fi

# Python
if [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "requirements.txt" ]; then
    echo "→ Tests Python..."
    if command -v pytest &> /dev/null; then
        if pytest -q; then
            echo "  ✅ Tests Python passés"
        else
            echo "  ❌ Tests Python échoués"
            exit 1
        fi
    else
        echo "  ⚠️ pytest non trouvé"
    fi
fi

# Rust
if [ -f "Cargo.toml" ]; then
    echo "→ Tests Rust..."
    if cargo test --quiet; then
        echo "  ✅ Tests Rust passés"
    else
        echo "  ❌ Tests Rust échoués"
        exit 1
    fi
fi

# Go
if [ -f "go.mod" ]; then
    echo "→ Tests Go..."
    if go test ./...; then
        echo "  ✅ Tests Go passés"
    else
        echo "  ❌ Tests Go échoués"
        exit 1
    fi
fi

echo "✅ Tous les tests sont verts."
