#!/bin/bash
# Diabliss Sales App — JS Minifier
# Run before uploading to Hostinger
# Usage: bash minify.sh
# Output: dist/ folder with minified files

mkdir -p dist

FILES=(
  pricing.js
  app-core.js
  app-ui-helpers.js
  app-visit-flow.js
  app-admin-master.js
  app-dash-reports.js
  app-corrections.js
  app-targets-expenses.js
  app-ledger-invoice.js
  app-data-sync.js
  app-features-new.js
  app-features-v2.js
  sw.js
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    orig=$(wc -c < "$f")
    terser "$f" --compress --mangle --output "dist/$f"
    mini=$(wc -c < "dist/$f")
    saving=$(( (orig - mini) * 100 / orig ))
    echo "✅ $f: ${orig}B → ${mini}B (${saving}% smaller)"
  else
    echo "⚠️  $f not found — skipping"
  fi
done

# Copy non-JS files as-is
cp index.html dist/index.html 2>/dev/null && echo "✅ index.html copied"
cp mis-report.html dist/mis-report.html 2>/dev/null && echo "✅ mis-report.html copied"

echo ""
echo "Done. Upload contents of dist/ to Hostinger public_html/diabliss-sales-app/"
