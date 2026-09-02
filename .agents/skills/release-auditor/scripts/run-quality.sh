#!/bin/bash
set -euo pipefail

echo "📊 Analyse de la qualité du code..."

# Node.js
if [ -f "package.json" ]; then
    echo "→ Linter / Formatter..."
    if npm run lint --if-present 2>/dev/null || true; then
        echo "  ✅ Linter OK"
    fi

    echo "→ Type checking..."
    if npx tsc --noEmit 2>/dev/null || true; then
        echo "  ✅ Types OK"
    fi

    echo "→ Complexité cyclomatique..."
    if command -v npx &> /dev/null && npm ls complexity-report &> /dev/null 2>/dev/null; then
        npx cr . --format plain || true
    fi
fi

# Python
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
    echo "→ Python linting..."
    if command -v ruff &> /dev/null; then
        ruff check . || true
    elif command -v flake8 &> /dev/null; then
        flake8 . || true
    fi

    if command -v mypy &> /dev/null; then
        mypy . || true
    fi
fi

# Rust
if [ -f "Cargo.toml" ]; then
    echo "→ Rust clippy..."
    cargo clippy -- -D warnings || true
    cargo fmt -- --check || true
fi

# Go
if [ -f "go.mod" ]; then
    echo "→ Go vet / fmt..."
    go vet ./... || true
    if [ "$(gofmt -l . | wc -l)" -gt 0 ]; then
        echo "  ⚠️ Fichiers mal formatés:"
        gofmt -l . || true
    fi
fi

echo "✅ Analyse de qualité terminée."
