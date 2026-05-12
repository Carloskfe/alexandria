#!/usr/bin/env python3
"""
Sync quality analyzer — compares merged VTT transcription text against the
stored Gutenberg/Wikisource book text to identify alignment problems and
generate fix recommendations.

Usage:
  python3 scripts/analyze-sync-quality.py --book "La Odisea" \
      --vtt transcriptions/la-odisea.merged.vtt \
      --gutenberg 58221

  python3 scripts/analyze-sync-quality.py --book "Romeo y Julieta" \
      --vtt transcriptions/romeo-y-julieta.merged.vtt \
      --wikisource "Romeo y Julieta (Menéndez y Pelayo tr.)"

  python3 scripts/analyze-sync-quality.py --all   # run all 8 synced books

Output: reports/sync-quality-<slug>.json + a console summary.
"""

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
REPORTS_DIR = REPO_ROOT / "reports" / "sync-quality"

# ── book registry ─────────────────────────────────────────────────────────────

BOOKS = [
    {
        "title":    "Romeo y Julieta",
        "slug":     "romeo-y-julieta",
        "source":   "wikisource",
        "wsTitle":  "Romeo y Julieta (Menéndez y Pelayo tr.)",
    },
    {
        "title":    "El Gaucho Martín Fierro",
        "slug":     "martin-fierro",
        "source":   "gutenberg",
        "gutId":    14765,
    },
    {
        "title":    "Cuentos de Amor de Locura y de Muerte",
        "slug":     "cuentos-de-amor",
        "source":   "gutenberg",
        "gutId":    13507,
    },
    {
        "title":    "Los Cuatro Jinetes del Apocalipsis",
        "slug":     "cuatro-jinetes",
        "source":   "gutenberg",
        "gutId":    24536,
    },
    {
        "title":    "La Isla del Tesoro",
        "slug":     "la-isla-del-tesoro",
        "source":   "wikisource",
        "wsTitle":  "La isla del tesoro (Manuel Caballero)",
    },
    {
        "title":    "Viaje al Centro de la Tierra",
        "slug":     "viaje-al-centro",
        "source":   "wikisource",
        "wsTitle":  "Viaje al centro de la Tierra",
    },
    {
        "title":    "Crimen y Castigo",
        "slug":     "crimen-y-castigo",
        "source":   "gutenberg",
        "gutId":    61851,
    },
    {
        "title":    "La Odisea",
        "slug":     "la-odisea",
        "source":   "gutenberg",
        "gutId":    58221,
    },
]

# ── text fetchers ─────────────────────────────────────────────────────────────

def fetch_gutenberg(gut_id: int) -> str:
    """Download plain-text from Project Gutenberg."""
    # Try UTF-8 first, then Latin-1
    for suffix in ["-utf8.txt", ".txt", "-0.txt", "-8.txt"]:
        url = f"https://www.gutenberg.org/files/{gut_id}/{gut_id}{suffix}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "NoetiaSync/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
                for enc in ["utf-8", "latin-1"]:
                    try:
                        return raw.decode(enc)
                    except UnicodeDecodeError:
                        continue
        except Exception:
            continue
    raise RuntimeError(f"Could not download Gutenberg text for ID {gut_id}")


def fetch_wikisource(ws_title: str) -> str:
    """Download plain text from Wikisource API."""
    encoded = urllib.parse.quote(ws_title.replace(" ", "_"))
    url = (
        f"https://es.wikisource.org/w/api.php?action=query&titles={encoded}"
        f"&prop=revisions&rvprop=content&format=json&rvslots=main"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "NoetiaSync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    pages = data["query"]["pages"]
    for page in pages.values():
        content = page.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("*", "")
        if content:
            return content
    raise RuntimeError(f"Wikisource page not found: {ws_title}")


# ── text normalisation ────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase, strip accents, keep only a-z and spaces."""
    import unicodedata
    nfd = unicodedata.normalize("NFD", text.lower())
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9\s]", " ", stripped)


def tokenize(text: str) -> list[str]:
    return [w for w in normalize(text).split() if len(w) > 2]


# ── VTT text extractor ────────────────────────────────────────────────────────

TS_RE = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}")

def extract_vtt_text(vtt_path: Path) -> str:
    """Extract all payload text from a VTT file (no timestamps, no indices)."""
    lines = []
    for line in vtt_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line == "WEBVTT" or TS_RE.match(line) or line.isdigit():
            continue
        lines.append(line)
    return " ".join(lines)


# ── sliding-window overlap scorer ────────────────────────────────────────────

def sliding_window_overlap(
    audio_tokens: list[str],
    book_tokens: list[str],
    window_words: int = 2000,
    step: int = 500,
) -> list[tuple[int, float]]:
    """
    Slide a window over book_tokens, score each window by overlap with
    audio_tokens. Returns list of (book_start_idx, score).
    """
    audio_set = set(audio_tokens)
    results = []
    for start in range(0, max(1, len(book_tokens) - window_words), step):
        window = book_tokens[start: start + window_words]
        overlap = sum(1 for w in window if w in audio_set)
        score = overlap / len(window) if window else 0
        results.append((start, score))
    return results


def find_narrative_window(
    audio_tokens: list[str],
    book_tokens: list[str],
    top_frac: float = 0.25,
) -> tuple[int, int]:
    """
    Find the contiguous range in book_tokens that best matches the audio.
    Returns (start_word_idx, end_word_idx).
    """
    window = min(len(audio_tokens) + 2000, len(book_tokens))
    step = max(200, window // 40)
    scores = sliding_window_overlap(audio_tokens, book_tokens, window, step)
    if not scores:
        return 0, len(book_tokens)

    # Pick the peak score region
    peak_score = max(s for _, s in scores)
    threshold = peak_score * 0.7

    good = [idx for idx, s in scores if s >= threshold]
    if not good:
        return 0, len(book_tokens)

    start = good[0]
    end = min(good[-1] + window, len(book_tokens))
    return start, end


# ── section-level confidence ──────────────────────────────────────────────────

def section_overlap(
    audio_tokens: list[str],
    book_tokens: list[str],
    section_size: int = 500,
) -> list[dict]:
    """
    Divide book_tokens into sections and score each against the audio.
    Returns list of section dicts with start, end, score.
    """
    audio_set = set(audio_tokens)
    sections = []
    for start in range(0, len(book_tokens), section_size):
        end = min(start + section_size, len(book_tokens))
        chunk = book_tokens[start:end]
        overlap = sum(1 for w in chunk if w in audio_set)
        score = round(overlap / len(chunk), 3) if chunk else 0
        sections.append({"start_word": start, "end_word": end, "score": score})
    return sections


# ── Gutenberg header/footer stripping ────────────────────────────────────────

def strip_gutenberg_envelope(text: str) -> str:
    """Remove Gutenberg header (before START OF PROJECT GUTENBERG) and footer."""
    # Strip header
    for marker in [
        "*** START OF THE PROJECT GUTENBERG",
        "***START OF THE PROJECT GUTENBERG",
        "*** START OF THIS PROJECT GUTENBERG",
        "*END*THE SMALL PRINT",
    ]:
        idx = text.upper().find(marker.upper())
        if idx != -1:
            # Find end of this line
            eol = text.find("\n", idx)
            text = text[eol + 1:] if eol != -1 else text[idx + len(marker):]
            break

    # Strip footer
    for marker in [
        "*** END OF THE PROJECT GUTENBERG",
        "***END OF THE PROJECT GUTENBERG",
        "End of the Project Gutenberg",
        "End of Project Gutenberg",
        "END OF THIS PROJECT GUTENBERG",
    ]:
        idx = text.lower().find(marker.lower())
        if idx != -1:
            text = text[:idx]
            break

    return text.strip()


# ── Wikisource markup cleaner ────────────────────────────────────────────────

def strip_wikisource_markup(text: str) -> str:
    """Remove wiki markup, templates, and navigation elements."""
    # Remove templates {{...}}
    text = re.sub(r'\{\{[^}]*\}\}', ' ', text, flags=re.DOTALL)
    # Remove [[File:...]] and [[Image:...]]
    text = re.sub(r'\[\[(?:File|Image|Archivo):[^\]]*\]\]', ' ', text, flags=re.IGNORECASE)
    # Convert [[link|text]] → text, [[link]] → link
    text = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove wiki headers (== Heading ==)
    text = re.sub(r'=+\s*[^=]+\s*=+', '\n', text)
    # Remove ''italic'' and '''bold'''
    text = re.sub(r"'{2,3}", '', text)
    return text.strip()


# ── main analysis ─────────────────────────────────────────────────────────────

def analyze_book(book: dict, verbose: bool = False) -> dict:
    title = book["title"]
    slug  = book["slug"]
    vtt_path = REPO_ROOT / "transcriptions" / f"{slug}.merged.vtt"

    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

    if not vtt_path.exists():
        print(f"  ✗ VTT not found: {vtt_path}")
        return {"title": title, "slug": slug, "error": "VTT not found"}

    # 1. Extract audio text
    print("  Extracting VTT transcription text...")
    audio_text = extract_vtt_text(vtt_path)
    audio_tokens = tokenize(audio_text)
    print(f"  Audio: {len(audio_tokens):,} significant words")

    # 2. Download book text
    print("  Downloading book text...")
    try:
        if book["source"] == "gutenberg":
            raw_text = fetch_gutenberg(book["gutId"])
            raw_text = strip_gutenberg_envelope(raw_text)
        else:
            raw_text = fetch_wikisource(book["wsTitle"])
            raw_text = strip_wikisource_markup(raw_text)
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        return {"title": title, "slug": slug, "error": str(e)}

    book_tokens = tokenize(raw_text)
    print(f"  Book:  {len(book_tokens):,} significant words")

    ratio = len(audio_tokens) / len(book_tokens) if book_tokens else 0
    print(f"  Audio/Book word ratio: {ratio:.2%}")

    # 3. Find narrative window
    print("  Finding narrative window (sliding-window scan)...")
    import urllib.parse  # ensure available
    start_w, end_w = find_narrative_window(audio_tokens, book_tokens)
    coverage_pct = (end_w - start_w) / len(book_tokens) * 100 if book_tokens else 0
    print(f"  Best match: words [{start_w:,}–{end_w:,}] "
          f"({coverage_pct:.1f}% of book text)")

    # 4. Section-level overlap heatmap
    print("  Computing section-level overlap...")
    sections = section_overlap(audio_tokens, book_tokens)
    high   = [s for s in sections if s["score"] >= 0.15]
    medium = [s for s in sections if 0.05 <= s["score"] < 0.15]
    low    = [s for s in sections if s["score"] < 0.05]

    print(f"  Sections ≥15% overlap (audio content): {len(high)}/{len(sections)}")
    print(f"  Sections  5–15%:  {len(medium)}")
    print(f"  Sections  <5% (non-audio text): {len(low)}")

    # 5. Identify problem zones
    # Contiguous low-overlap regions at start or end → preamble/appendix
    leading_low  = 0
    for s in sections:
        if s["score"] < 0.05:
            leading_low += 1
        else:
            break
    trailing_low = 0
    for s in reversed(sections):
        if s["score"] < 0.05:
            trailing_low += 1
        else:
            break

    preamble_words  = leading_low * 500
    appendix_words  = trailing_low * 500
    narrative_words = len(book_tokens) - preamble_words - appendix_words

    # 6. Overall quality estimate
    # Weighted overlap in the narrative zone
    narrative_sections = sections[leading_low: len(sections) - trailing_low] if trailing_low else sections[leading_low:]
    avg_narrative_overlap = (
        sum(s["score"] for s in narrative_sections) / len(narrative_sections)
        if narrative_sections else 0
    )

    quality_grade = (
        "EXCELLENT"  if avg_narrative_overlap >= 0.25 else
        "GOOD"       if avg_narrative_overlap >= 0.15 else
        "FAIR"       if avg_narrative_overlap >= 0.08 else
        "POOR"
    )

    print(f"\n  {'─'*50}")
    print(f"  Narrative overlap score: {avg_narrative_overlap:.1%}  → {quality_grade}")
    if preamble_words:
        print(f"  ⚠  Preamble (not in audio): ~{preamble_words:,} words")
    if appendix_words:
        print(f"  ⚠  Appendix (not in audio): ~{appendix_words:,} words")

    # 7. Recommendation
    recs = []
    if preamble_words > 2000:
        recs.append(
            f"Strip ~{preamble_words:,} word preamble from stored text "
            f"(first {leading_low} sections have <5% audio overlap)"
        )
    if appendix_words > 2000:
        recs.append(
            f"Strip ~{appendix_words:,} word appendix from stored text "
            f"(last {trailing_low} sections have <5% audio overlap)"
        )
    if quality_grade in ("FAIR", "POOR") and not recs:
        recs.append(
            "Consider re-ingesting from a cleaner source — "
            "the stored text edition may differ from the audio recording"
        )
    if not recs:
        recs.append("Text and audio match well — no structural changes needed")

    for r in recs:
        print(f"  → {r}")

    # 8. Build result
    result = {
        "title": title,
        "slug": slug,
        "source": book["source"],
        "audio_words": len(audio_tokens),
        "book_words": len(book_tokens),
        "audio_book_ratio": round(ratio, 3),
        "narrative_window": {"start_word": start_w, "end_word": end_w},
        "coverage_pct": round(coverage_pct, 1),
        "sections_total": len(sections),
        "sections_high": len(high),
        "sections_medium": len(medium),
        "sections_low": len(low),
        "leading_low_sections": leading_low,
        "trailing_low_sections": trailing_low,
        "preamble_words": preamble_words,
        "appendix_words": appendix_words,
        "narrative_overlap": round(avg_narrative_overlap, 3),
        "quality_grade": quality_grade,
        "recommendations": recs,
    }

    if verbose:
        result["sections"] = sections

    return result


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    import urllib.parse
    p = argparse.ArgumentParser()
    p.add_argument("--all", action="store_true", help="Analyze all 8 books")
    p.add_argument("--slug", help="Analyze one book by slug (e.g. la-odisea)")
    p.add_argument("--verbose", action="store_true")
    args = p.parse_args()

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    if args.all:
        targets = BOOKS
    elif args.slug:
        targets = [b for b in BOOKS if b["slug"] == args.slug]
        if not targets:
            print(f"Unknown slug: {args.slug}")
            sys.exit(1)
    else:
        targets = BOOKS

    results = []
    for book in targets:
        r = analyze_book(book, verbose=args.verbose)
        results.append(r)
        # Save individual report
        out = REPORTS_DIR / f"{book['slug']}.json"
        out.write_text(json.dumps(r, ensure_ascii=False, indent=2))

    # Summary table
    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    fmt = "  {:<38} {:>6}  {:>8}  {:>10}  {}"
    print(fmt.format("Book", "Ratio", "Overlap", "Grade", "Issues"))
    print("  " + "-"*58)
    for r in results:
        if "error" in r:
            print(f"  {r['title']:<38} ERROR: {r['error']}")
            continue
        issues = ""
        if r.get("preamble_words", 0) > 2000:
            issues += f"+{r['preamble_words']//1000}k preamble "
        if r.get("appendix_words", 0) > 2000:
            issues += f"+{r['appendix_words']//1000}k appendix"
        print(fmt.format(
            r["title"][:38],
            f"{r['audio_book_ratio']:.0%}",
            f"{r['narrative_overlap']:.0%}",
            r["quality_grade"],
            issues or "OK",
        ))

    # Save combined report
    combined = REPORTS_DIR / "all-books.json"
    combined.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"\n  Reports saved to {REPORTS_DIR}/")


if __name__ == "__main__":
    main()
