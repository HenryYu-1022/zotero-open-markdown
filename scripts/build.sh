#!/bin/bash
# Build script for Open Markdown Zotero plugin
# Creates a .xpi file (which is just a zip) from the src/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_ROOT/src"
OUTPUT="$REPO_ROOT/zotero-open-markdown.xpi"

# Remove old build
rm -f "$OUTPUT"

# Create .xpi (zip) from src/
cd "$SRC_DIR"
zip -r "$OUTPUT" . -x ".*" -x "__MACOSX/*" -x "*.DS_Store"

echo ""
echo "✅ Built: $OUTPUT"
echo ""
echo "To install:"
echo "  1. Open Zotero 7"
echo "  2. Go to Tools → Add-ons"
echo "  3. Click the gear icon → Install Add-on From File…"
echo "  4. Select: $OUTPUT"
