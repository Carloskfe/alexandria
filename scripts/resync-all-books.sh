#!/usr/bin/env bash
# Re-sync phrase timestamps for every book that has a merged VTT.
# Runs seed-sync-whisper.js with the updated skip-and-continue aligner,
# captures per-book alignment stats, and prints a quality summary table.
#
# Run from /opt/noetia after git pull:
#   bash scripts/resync-all-books.sh
#
# Flags:
#   --dry-run   Only copy VTTs and show what would run (no DB writes)
#   --book SLUG Re-sync one book by slug (e.g. --book la-odisea)

set -uo pipefail
cd /opt/noetia

DRY_RUN=0
ONLY_SLUG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)  DRY_RUN=1 ;;
    --book)     ONLY_SLUG="$2"; shift ;;
  esac
  shift
done

DC="docker compose --env-file .env.production -f docker-compose.server.yml"
EXEC="$DC exec -T -e DB_HOST=db api node dist/ingestion/seed-sync-whisper.js"
CONTAINER="noetia-api-1"
REMOTE="/app/transcriptions"
LOCAL="transcriptions"

# ── Book registry (slug → exact DB title) ─────────────────────────────────────
declare -A BOOKS
BOOKS[don-juan]="Don Juan Tenorio"
BOOKS[dona-perfecta]="Doña Perfecta"
BOOKS[el-sombrero-de-tres-picos]="El Sombrero de Tres Picos"
BOOKS[lazarillo]="Lazarillo de Tormes"
BOOKS[rimas-y-leyendas]="Rimas y Leyendas"
BOOKS[marianela]="Marianela"
BOOKS[salmos]="Salmos"
BOOKS[niebla]="Niebla"
BOOKS[romeo-y-julieta]="Romeo y Julieta"
BOOKS[martin-fierro]="El Gaucho Martín Fierro"
BOOKS[cuentos-de-amor]="Cuentos de Amor de Locura y de Muerte"
BOOKS[cuatro-jinetes]="Los Cuatro Jinetes del Apocalipsis"
BOOKS[la-isla-del-tesoro]="La Isla del Tesoro"
BOOKS[viaje-al-centro]="Viaje al Centro de la Tierra"
BOOKS[crimen-y-castigo]="Crimen y Castigo"
BOOKS[la-odisea]="La Odisea"

# ── Ordered slug list (shorter books first) ────────────────────────────────────
SLUGS=(
  salmos lazarillo marianela rimas-y-leyendas el-sombrero-de-tres-picos
  don-juan dona-perfecta niebla martin-fierro romeo-y-julieta
  cuentos-de-amor la-isla-del-tesoro cuatro-jinetes viaje-al-centro
  la-odisea crimen-y-castigo
)

# ── Helpers ───────────────────────────────────────────────────────────────────

# Associative arrays for results
declare -A RES_ALIGNED RES_TOTAL RES_EXCEPTIONS RES_CONFIDENCE RES_LOW RES_GRADE

grade() {
  local conf="$1" exc_ratio="$2"   # both as percentages (integers)
  if   (( exc_ratio > 40 ));          then echo "⚠  POOR";
  elif (( conf >= 70 ));              then echo "✓  EXCELLENT";
  elif (( conf >= 50 ));              then echo "✓  GOOD";
  elif (( conf >= 30 ));              then echo "~  FAIR";
  else                                     echo "⚠  POOR"; fi
}

run_book() {
  local slug="$1"
  local title="${BOOKS[$slug]}"
  local vtt="$LOCAL/${slug}.merged.vtt"

  if [[ -z "$title" ]]; then
    echo "  ✗ Unknown slug: $slug" >&2
    return 1
  fi
  if [[ ! -f "$vtt" ]]; then
    echo "  ✗ VTT not found: $vtt" >&2
    return 1
  fi

  echo ""
  echo "══════════════════════════════════════════════════════"
  printf "  %-50s\n" "$title"
  echo "══════════════════════════════════════════════════════"

  # Copy VTT into container
  echo "  Copying VTT…"
  docker exec "$CONTAINER" mkdir -p "$REMOTE" 2>/dev/null || true
  docker cp "$vtt" "$CONTAINER:$REMOTE/${slug}.merged.vtt"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] would run: seed-sync-whisper --book \"$title\""
    RES_ALIGNED[$slug]="-"; RES_TOTAL[$slug]="-"
    RES_EXCEPTIONS[$slug]="-"; RES_CONFIDENCE[$slug]="-"
    RES_LOW[$slug]="-"; RES_GRADE[$slug]="DRY RUN"
    return
  fi

  # Run alignment and capture output
  local raw
  raw=$($EXEC --book "$title" --transcript "$REMOTE/${slug}.merged.vtt" 2>&1)
  echo "$raw" | grep -E "aligned:|Exceptions:|confidence:|Low-confidence:" | sed 's/^/  /'

  # Parse summary fields (awk — no PCRE needed)
  local aligned total exceptions conf low
  aligned=$(echo "$raw"    | awk '/Phrases aligned:/{print $3}' | head -1)
  total=$(echo "$raw"      | awk '/Phrases aligned:/{print $5}' | head -1)
  exceptions=$(echo "$raw" | awk '/Exceptions:/{print $2}'      | head -1)
  conf=$(echo "$raw"       | awk '/Avg confidence:/{gsub(/%/,"",$3); print $3}' | head -1)
  low=$(echo "$raw"        | awk '/Low-confidence:/{print $2}'  | head -1)

  aligned=${aligned:-0}; total=${total:-0}; exceptions=${exceptions:-0}
  conf=${conf:-0}; low=${low:-0}

  local exc_ratio=0
  if (( total > 0 )); then
    exc_ratio=$(( exceptions * 100 / total ))
  fi
  local conf_int=${conf%.*}   # integer part for comparison

  RES_ALIGNED[$slug]="$aligned"
  RES_TOTAL[$slug]="$total"
  RES_EXCEPTIONS[$slug]="$exceptions"
  RES_CONFIDENCE[$slug]="${conf}%"
  RES_LOW[$slug]="$low"
  RES_GRADE[$slug]=$(grade "$conf_int" "$exc_ratio")
}

# ── Main loop ─────────────────────────────────────────────────────────────────

if [[ -n "$ONLY_SLUG" ]]; then
  run_book "$ONLY_SLUG"
else
  for slug in "${SLUGS[@]}"; do
    run_book "$slug"
  done
fi

# ── Quality summary table ─────────────────────────────────────────────────────

if [[ "$DRY_RUN" -eq 0 || -n "$ONLY_SLUG" ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════════════╗"
  echo "║  SYNCHRONIZATION QUALITY REPORT                                             ║"
  echo "╠══════════════════════════════════════════════════════════════════════════════╣"
  printf "║  %-40s %8s %10s %8s %10s  ║\n" "Book" "Aligned" "Exceptions" "Conf%" "Grade"
  echo "╠══════════════════════════════════════════════════════════════════════════════╣"

  for slug in "${SLUGS[@]}"; do
    [[ -z "${BOOKS[$slug]+x}" ]] && continue
    [[ -z "${RES_GRADE[$slug]+x}" ]] && continue
    title="${BOOKS[$slug]}"
    aligned="${RES_ALIGNED[$slug]:-?}"
    total="${RES_TOTAL[$slug]:-?}"
    exc="${RES_EXCEPTIONS[$slug]:-?}"
    conf="${RES_CONFIDENCE[$slug]:-?}"
    grade="${RES_GRADE[$slug]:-?}"
    printf "║  %-40s %4s/%-3s %10s %8s  %-12s║\n" \
      "${title:0:40}" "$aligned" "$total" "$exc" "$conf" "$grade"
  done

  echo "╚══════════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Legend: Conf% = avg phrase-match confidence (higher = better alignment)"
  echo "          Exceptions = phrases not found in audio (extra text in stored edition)"
  echo ""
fi
