#!/usr/bin/env bash
# Batch Whisper transcription pipeline for all 21 remaining books.
# Sorted by chapter count (shortest first) so early books finish quickly.
#
# Usage:
#   bash scripts/whisper-batch.sh           # all 21 books, medium model
#   bash scripts/whisper-batch.sh small     # use 'small' model (~4x faster on CPU)
#   SKIP="genesis mateo" bash scripts/whisper-batch.sh  # skip already-done books
#
# After all books complete, commit and push transcriptions/, then run
# seed-sync-whisper.js on the server for each new .merged.vtt file.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
MODEL="${1:-medium}"
SKIP="${SKIP:-}"

run_book() {
  local url="$1" slug="$2" dir="$3" lang="${4:-es}"
  if echo "$SKIP" | grep -qw "$slug"; then
    echo "==> SKIP $dir"
    return
  fi
  if [[ -f "$REPO/transcriptions/$slug.merged.vtt" ]]; then
    echo "==> ALREADY DONE: $dir"
    return
  fi
  echo ""
  echo "============================================================"
  echo "==> START: $dir  (model=$MODEL, lang=$lang)"
  echo "============================================================"
  python3 "$REPO/scripts/whisper-book.py" \
    --url "$url" --slug "$slug" --dir "$dir" \
    --lang "$lang" --model "$MODEL"
}

# ── Bible epistles (1–6 chapters each, very short) ───────────────────────────
run_book "https://librivox.org/bible-reina-valera-nt-10-la-epistola-del-apostol-san-pablo-a-los-efesios-by-reina-valera/" \
         "efesios" "Efesios"

run_book "https://librivox.org/bible-reina-valera-nt-11-filipenses-by-reina-valera/" \
         "filipenses" "Filipenses"

# ── Short Bible books ─────────────────────────────────────────────────────────
run_book "https://librivox.org/bible-reina-valera-nt-27-apocalipsis-by-reina-valera/" \
         "apocalipsis" "Apocalipsis"

run_book "https://librivox.org/bible-reina-valera-nt-01-mateo-by-reina-valera/" \
         "mateo" "Mateo"

run_book "https://librivox.org/bible-reina-valera-nt-04-juan-by-reina-valera/" \
         "juan" "Juan"

run_book "https://librivox.org/bible-reina-valera-nt-03-lucas-by-reina-valera/" \
         "lucas" "Lucas"

run_book "https://librivox.org/bible-reina-valera-1909-20-libro-de-los-proverbios-by-reina-valera/" \
         "proverbios" "Proverbios"

run_book "https://librivox.org/isaias-by-reina-valera/" \
         "isaias" "Isaías"

# ── Short literary books ──────────────────────────────────────────────────────
run_book "https://librivox.org/fabulas-y-verdades-by-rafael-pombo/" \
         "fabulas-y-verdades" "Fábulas y Verdades"

run_book "https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/" \
         "cuentos-de-la-selva" "Cuentos de la Selva"

run_book "https://librivox.org/el-gaucho-martin-fierro-by-jose-hernandez/" \
         "martin-fierro" "El Gaucho Martín Fierro"

run_book "https://librivox.org/romeo-y-julieta-by-william-shakespeare/" \
         "romeo-y-julieta" "Romeo y Julieta"

run_book "https://librivox.org/cuentos-de-amor-de-locura-y-de-muerte-by-horacio-quiroga/" \
         "cuentos-de-amor" "Cuentos de Amor de Locura y de Muerte"

# ── Bible long books ──────────────────────────────────────────────────────────
run_book "https://librivox.org/genesis-reina-valera-version/" \
         "genesis" "Génesis"

run_book "https://librivox.org/bible-reina-valera-02-exodo-by-reina-valera/" \
         "exodo" "Éxodo"

# ── Medium literary books ─────────────────────────────────────────────────────
run_book "https://librivox.org/los-cuatro-jinetes-del-apocalipsis-by-vicente-blasco-ibanez/" \
         "cuatro-jinetes" "Los Cuatro Jinetes del Apocalipsis"

run_book "https://librivox.org/la-odisea-by-homero/" \
         "la-odisea" "La Odisea"

run_book "https://librivox.org/viaje-al-centro-de-la-tierra-by-jules-verne/" \
         "viaje-al-centro" "Viaje al Centro de la Tierra"

# ── Long literary books (run overnight) ──────────────────────────────────────
run_book "https://librivox.org/crimen-y-castigo-by-fyodor-dostoyevsky/" \
         "crimen-y-castigo" "Crimen y Castigo"

run_book "https://librivox.org/don-quijote-vol-1-by-miguel-de-cervantes-saavedra/" \
         "don-quijote-vol-1" "Don Quijote Vol. I"

run_book "https://librivox.org/don-quijote-volume-2-by-miguel-de-cervantes-saavedra/" \
         "don-quijote-vol-2" "Don Quijote Vol. II"

echo ""
echo "============================================================"
echo "All done! Next: commit and push transcriptions/, then run"
echo "seed-sync-whisper.js on the server for each new merged VTT."
echo "============================================================"
