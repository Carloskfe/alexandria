#!/usr/bin/env python3
"""
Clean Whisper VTT files produced by WhisperTranscribe.ai from LibriVox recordings.

Removes:
  - NOTE blocks (WhisperTranscribe.ai header)
  - Intro boilerplate: chapter/section announcements + LibriVox publicity (~first 30s)
  - Outro markers: "Fin de la sección N", "Fin del canto X", etc. (~last 60s)
  - Closing credits in the final chapter: "Fin de [title]", "Grabado para", "Traducido por"
  - Empty cues (timestamp present but text is blank or whitespace)
  - Renumbers cues sequentially

Usage:
  python3 scripts/clean-vtt.py --dir "transcriptions/Romeo y Julieta"   # clean in-place
  python3 scripts/clean-vtt.py --file path/to/file.vtt                  # single file
  python3 scripts/clean-vtt.py --dir "..." --dry-run                    # preview only
"""

import argparse
import re
import sys
from pathlib import Path

# ── Patterns ───────────────────────────────────────────────────────────────────

# Intro boilerplate — matched against lowercased, stripped cue text
INTRO_PATTERNS = [
    r"secci[oó]n\s+\w+\s+de\b",          # "Sección 1 de ..."
    r"canto\s+\w+\s+de\b",               # "Canto primero de ..."
    r"cap[ií]tulo\s+\w+\s+de\b",         # "Capítulo primero de ..."
    r"parte\s+\w+\s+de\b",               # "Parte 1 de ..."
    r"grabaci[oó]n\s+de\s+libri",        # "grabación de LibriVox/LibriBox"
    r"grabaci[oó]n\s+del?\s+iddie",      # "grabación del iddie box" (garbled)
    r"grabaci[oó]n\s+de\s+livery",       # "grabación de Liverybox" (garbled)
    r"grabaciones\s+de\s+libri",         # "grabaciones de LibriVox"
    r"grabaciones\s+del?\s+iddie",
    r"dominio\s+p[uú]blico",             # "dominio público"
    r"para\s+m[aá]s\s+informaci[oó]n",  # "Para más información"
    r"ser\s+voluntario",                 # "ser voluntario"
    r"visite\s+libri",                   # "visite LibriVox"
    r"visite\s+el\s+libri",
    r"punto\s+[0o]rg",                   # "punto ORG" / "punto 0RG"
    r"^por\s+favor",                     # "por favor, visite..."
]

INTRO_RE = [re.compile(p, re.IGNORECASE) for p in INTRO_PATTERNS]

# Outro section markers — present at end of every chapter
OUTRO_SECTION_RE = re.compile(
    r"fin\s+de\s+(la\s+secci[oó]n|el\s+canto|el\s+cap[ií]tulo|el\s+acto|el\s+libro|el\s+episodio|la\s+parte)"
    r"|\bfin\s+del\s+(canto|cap[ií]tulo|acto|libro|episodio|pr[oó]logo|ep[ií]logo)\b",
    re.IGNORECASE,
)

# Closing credits — last chapter only, matched within CLOSING_WINDOW seconds of file end.
# Split into two regexes to avoid re.IGNORECASE making [A-Z] match lowercase letters,
# which would cause false positives on book text containing "de su...", "por lo...", etc.
CLOSING_CI_RE = re.compile(                        # case-insensitive, safe patterns
    r"^fin\s+de\b"                                 # "Fin de [title]..."
    r"|grabado\s+(?:por|para)\b"                   # "Grabado por/para [reader]"
    r"|^traducido\s+por\b",                        # "Traducido por ..."
    re.IGNORECASE,
)
CLOSING_CS_RE = re.compile(                        # case-SENSITIVE: only matches Proper Nouns
    r"^de\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]"               # "de Fiodor Dostoyevski." (after "Fin de")
    r"|^por\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ][^\n]{0,38}$" # "por Víctor Villarrasa." — short credit
)

# ── VTT helpers ────────────────────────────────────────────────────────────────

TS_LINE = re.compile(
    r"^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})"
)

def ts_to_sec(ts: str) -> float:
    parts = ts.replace(",", ".").split(":")
    return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])


def parse_cues(text: str) -> list[dict]:
    """Return list of {start, end, payload} dicts."""
    cues = []
    blocks = re.split(r"\n{2,}", text.strip())
    for block in blocks:
        lines = [l for l in block.splitlines()]
        for i, line in enumerate(lines):
            m = TS_LINE.match(line.strip())
            if m:
                payload = "\n".join(lines[i + 1:]).strip()
                cues.append({
                    "start": ts_to_sec(m.group(1)),
                    "end":   ts_to_sec(m.group(2)),
                    "raw_start": m.group(1),
                    "raw_end":   m.group(2),
                    "payload": payload,
                })
                break
    return cues


def render_vtt(cues: list[dict]) -> str:
    lines = ["WEBVTT", ""]
    for i, c in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{c['raw_start']} --> {c['raw_end']}")
        lines.append(c["payload"])
        lines.append("")
    return "\n".join(lines)


# ── Cleaning logic ─────────────────────────────────────────────────────────────

INTRO_WINDOW = 35.0   # seconds — only strip intro patterns within this window
OUTRO_WINDOW = 90.0   # seconds before end — strip section-end markers
CLOSING_WINDOW = 20.0 # seconds before end — strip closing credits (last file only)


def is_intro(cue: dict) -> bool:
    if cue["start"] > INTRO_WINDOW:
        return False
    text = cue["payload"].lower().strip()
    if not text:
        return True  # empty cue in intro window → drop
    return any(r.search(text) for r in INTRO_RE)


def is_outro_section_marker(cue: dict, file_duration: float) -> bool:
    if cue["start"] < file_duration - OUTRO_WINDOW:
        return False
    text = cue["payload"].strip()
    if not text:
        return True  # trailing empty cue
    return bool(OUTRO_SECTION_RE.search(text))


def is_closing_credit(cue: dict, file_duration: float, is_last_file: bool) -> bool:
    if not is_last_file:
        return False
    if cue["start"] < file_duration - CLOSING_WINDOW:
        return False
    text = cue["payload"].strip()
    if not text:
        return True
    return bool(CLOSING_CI_RE.search(text) or CLOSING_CS_RE.search(text))


def clean_cues(cues: list[dict], is_last_file: bool) -> list[dict]:
    if not cues:
        return cues

    file_duration = cues[-1]["end"]

    kept = []
    for cue in cues:
        # Skip empty payload
        if not cue["payload"].strip():
            continue
        if is_intro(cue):
            continue
        if is_outro_section_marker(cue, file_duration):
            continue
        if is_closing_credit(cue, file_duration, is_last_file):
            continue
        kept.append(cue)

    return kept


def clean_file(path: Path, is_last_file: bool, dry_run: bool) -> tuple[int, int]:
    text = path.read_text(encoding="utf-8")
    cues = parse_cues(text)
    original_count = len(cues)
    cleaned = clean_cues(cues, is_last_file)
    removed = original_count - len(cleaned)

    if not dry_run and removed > 0:
        path.write_text(render_vtt(cleaned), encoding="utf-8")

    return original_count, removed


def clean_dir(directory: Path, dry_run: bool) -> None:
    files = sorted(
        directory.glob("*.vtt"),
        key=lambda f: int(re.search(r"\d+", f.name).group()) if re.search(r"\d+", f.name) else 0,
    )
    if not files:
        print(f"No VTT files in {directory}")
        return

    total_removed = 0
    for i, f in enumerate(files):
        is_last = (i == len(files) - 1)
        orig, removed = clean_file(f, is_last, dry_run)
        status = "DRY" if dry_run else "cleaned"
        print(f"  {f.name}: {orig} → {orig - removed} cues (removed {removed}) [{status}]")
        total_removed += removed

    print(f"\n  Total removed: {total_removed} cues across {len(files)} files")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Clean LibriVox/WhisperTranscribe VTT files")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--dir",  help="Directory of VTT chapter files (cleaned in-place)")
    group.add_argument("--file", help="Single VTT file to clean")
    p.add_argument("--dry-run", action="store_true", help="Preview removals without writing")
    args = p.parse_args()

    if args.dir:
        d = Path(args.dir)
        if not d.is_dir():
            print(f"Not a directory: {d}", file=sys.stderr)
            sys.exit(1)
        print(f"{'DRY RUN — ' if args.dry_run else ''}Cleaning: {d}")
        clean_dir(d, args.dry_run)
    else:
        f = Path(args.file)
        if not f.is_file():
            print(f"File not found: {f}", file=sys.stderr)
            sys.exit(1)
        orig, removed = clean_file(f, is_last_file=True, dry_run=args.dry_run)
        print(f"{f.name}: {orig} → {orig - removed} cues (removed {removed})")


if __name__ == "__main__":
    main()
