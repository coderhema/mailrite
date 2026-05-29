#!/bin/bash
# setup-coral.sh — Install Coral CLI and configure sources for MailRite
# Usage: ./scripts/setup-coral.sh
#
# This script:
#   1. Installs Coral CLI (if not already installed)
#   2. Adds LinkedIn and Gmail as Coral data sources
#   3. Verifies the setup with a test query

set -e

echo "🏴‍☠️  MailRite — Coral Setup"
echo "================================"
echo ""

# ─── Step 1: Install Coral CLI ────────────────────────────────────
if command -v coral &> /dev/null; then
    echo "✅ Coral CLI is already installed."
    coral --version
else
    echo "📦 Installing Coral CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install withcoral/tap/coral
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://raw.githubusercontent.com/withcoral/coral/main/install.sh | bash
    else
        echo "⚠️  Unsupported OS. Please install Coral manually:"
        echo "   https://withcoral.com/docs/install"
        exit 1
    fi
    echo "✅ Coral CLI installed."
fi

echo ""

# ─── Step 2: Add Data Sources ─────────────────────────────────────
echo "🔌 Adding data sources..."

echo "   Adding LinkedIn (needs LINKEDIN_ACCESS_TOKEN env var)..."
coral source add --file coral-sources/linkedin-source.yaml 2>/dev/null \
    && echo "   ✅ LinkedIn source added" \
    || echo "   ⚠️  LinkedIn source already exists or needs token — skipping"

echo "   Adding Google People (needs GMAIL_ACCESS_TOKEN env var)..."
coral source add --file coral-sources/gmail-people-source.yaml 2>/dev/null \
    && echo "   ✅ Google People source added" \
    || echo "   ⚠️  Google People source already exists or needs token — skipping"

echo "   Adding Gmail threads (needs GMAIL_ACCESS_TOKEN env var)..."
coral source add --file coral-sources/gmail-threads-source.yaml 2>/dev/null \
    && echo "   ✅ Gmail threads source added" \
    || echo "   ⚠️  Gmail threads source already exists or needs token — skipping"

echo ""

# ─── Step 3: Verify Setup ─────────────────────────────────────────
echo "🧪 Verifying Coral setup..."
coral source list
echo ""

echo "🎉 Coral setup complete!"
echo ""
echo "Try running a query:"
echo "  coral query \"SELECT name, email FROM linkedin.connections LIMIT 5\""
echo ""
echo "Or start MailRite and use the Coral Query panel:"
echo "  npm run dev"
