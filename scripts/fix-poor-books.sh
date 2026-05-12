#!/usr/bin/env bash
# Re-ingest stored text for POOR-quality books, then re-run Whisper alignment.
#
# Run from /opt/noetia after git pull:
#   bash scripts/fix-poor-books.sh
#
# What it does:
#   1. Re-fetches and overwrites stored text for each book using the improved
#      fetchers (Wikisource nav stripping + Gutenberg narrative boundaries).
#   2. Re-runs seed-sync-whisper.js alignment for each book.
#   3. Prints a quality comparison for the fixed books.

set -uo pipefail
cd /opt/noetia

DC="docker compose --env-file .env.production -f docker-compose.server.yml"
EXEC="$DC exec -T -e DB_HOST=db api node"
CONTAINER="noetia-api-1"
REMOTE="/app/transcriptions"
LOCAL="transcriptions"

# Books that benefit from re-ingestion.
# Gutenberg books: use narrativeStartPattern/narrativeEndPattern to strip preamble/appendix.
# Wikisource books: strip navigation div blocks (headertemplate, ws-data, etc.)
# Format: slug|DB title
BOOKS=(
  "la-odisea|La Odisea"
  "el-sombrero-de-tres-picos|El Sombrero de Tres Picos"
  "la-isla-del-tesoro|La Isla del Tesoro"
  "martin-fierro|El Gaucho Martín Fierro"
  "rimas-y-leyendas|Leyendas"
  "dona-perfecta|Doña Perfecta"
)

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Phase 1 — Re-ingest stored text (improved fetchers)"
echo "════════════════════════════════════════════════════════"

for item in "${BOOKS[@]}"; do
  slug="${item%%|*}"
  title="${item##*|}"
  echo ""
  echo "  Re-ingesting: $title"
  $EXEC dist/ingestion/re-ingest-text.js --book "$title"
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Phase 2 — Re-align Whisper sync maps"
echo "════════════════════════════════════════════════════════"

for item in "${BOOKS[@]}"; do
  slug="${item%%|*}"
  title="${item##*|}"
  vtt="$LOCAL/${slug}.merged.vtt"

  if [[ ! -f "$vtt" ]]; then
    echo "  ✗ VTT not found for $slug — skipping alignment"
    continue
  fi

  echo ""
  echo "══════════════════════════════════════════════════════"
  printf "  %-50s\n" "$title"
  echo "══════════════════════════════════════════════════════"

  docker exec "$CONTAINER" mkdir -p "$REMOTE" 2>/dev/null || true
  docker cp "$vtt" "$CONTAINER:$REMOTE/${slug}.merged.vtt"

  $EXEC dist/ingestion/seed-sync-whisper.js \
    --book "$title" \
    --transcript "$REMOTE/${slug}.merged.vtt" \
    2>&1 | grep -E "aligned:|Exceptions:|confidence:|Low-confidence:" | sed 's/^/  /'
done

echo ""
echo "  Done. Run resync-all-books.sh to see the full 16-book quality table."
echo ""
