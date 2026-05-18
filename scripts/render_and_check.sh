#!/bin/bash
# scripts/render_and_check.sh
# Usage: bash scripts/render_and_check.sh talkNN
set -euo pipefail

TALK="$1"
QMD="slides/${TALK}/${TALK}.qmd"
HTML="slides/${TALK}/${TALK}.html"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Validate input
if [ -z "$TALK" ]; then
  echo "Usage: bash scripts/render_and_check.sh talkNN"
  exit 1
fi

if [ ! -f "$QMD" ]; then
  echo "ERROR: ${QMD} not found"
  exit 1
fi

echo "=== Render ${TALK} ==="
cd "$ROOT"
quarto render "$QMD"

echo ""
echo "=== Validate ${TALK} ==="

# Check prerequisites
if [ ! -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  echo "ERROR: Chrome not found at /Applications/Google Chrome.app"
  exit 1
fi

node -e "require('puppeteer-core')" 2>/dev/null || {
  echo "ERROR: puppeteer-core not installed. Run: npm install"
  exit 1
}

# Run validation
node scripts/validate_slides.js "$HTML" --qmd "$QMD" 2>&1
EXIT_CODE=$?

case $EXIT_CODE in
  0) echo ""; echo "✓ All checks passed" ;;
  2) echo ""; echo "✗ Some checks FAILED — review above" ;;
  *) echo ""; echo "⚠ Validation encountered errors (exit code ${EXIT_CODE})" ;;
esac

exit $EXIT_CODE
