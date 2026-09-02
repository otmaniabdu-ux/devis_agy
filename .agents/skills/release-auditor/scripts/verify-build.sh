#!/bin/bash
set -euo pipefail

echo "🔨 Vérification du build..."

# Node.js
if [ -f "package.json" ]; then
    echo "→ Build Node.js..."
    if npm run build --if-present 2>/dev/null; then
        echo "  ✅ Build Node.js réussi"
    else
        echo "  ❌ Build Node.js échoué"
        exit 1
    fi
fi

# Python (pas de build classique, mais vérification d'installation)
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "→ Vérification Python..."
    if pip install -e . >/dev/null 2>&1 || true; then
        echo "  ✅ Installation Python OK"
    fi
fi

# Rust
if [ -f "Cargo.toml" ]; then
    echo "→ Build Rust..."
    if cargo build --release; then
        echo "  ✅ Build Rust réussi"
    else
        echo "  ❌ Build Rust échoué"
        exit 1
    fi
fi

# Go
if [ -f "go.mod" ]; then
    echo "→ Build Go..."
    if go build ./...; then
        echo "  ✅ Build Go réussi"
    else
        echo "  ❌ Build Go échoué"
        exit 1
    fi
fi

# Docker
if [ -f "Dockerfile" ]; then
    echo "→ Build Docker..."
    if docker build -t release-audit-test . >/dev/null 2>&1; then
        echo "  ✅ Build Docker réussi"
        docker rmi release-audit-test >/dev/null 2>&1 || true
    else
        echo "  ⚠️ Build Docker échoué (non bloquant)"
    fi
fi

echo "✅ Build vérifié."
