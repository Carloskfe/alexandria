#!/usr/bin/env python3
"""Merge ordered Whisper VTT chapter files into one file with adjusted timestamps."""
import re
import sys
import os
from pathlib import Path

GAP_SECONDS = 2.0


def ts_to_sec(ts: str) -> float:
    parts = ts.strip().replace(',', '.').split(':')
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    return int(parts[0]) * 60 + float(parts[1])


def sec_to_ts(s: float) -> str:
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}"


def shift_inline(text: str, offset: float) -> str:
    def replace_ts(m):
        return f"<{sec_to_ts(ts_to_sec(m.group(1)) + offset)}>"
    return re.sub(r'<(\d{2}:\d{2}:\d{2}[\.,]\d{3})>', replace_ts, text)


def parse_cues(vtt: str):
    cues = []
    blocks = re.split(r'\n\n+', vtt.strip())
    for block in blocks:
        lines = block.strip().splitlines()
        m = None
        for i, line in enumerate(lines):
            m = re.match(r'(\d{2}:\d{2}:\d{2}[\.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[\.,]\d{3})', line)
            if m:
                payload = '\n'.join(lines[i+1:])
                cues.append((ts_to_sec(m.group(1)), ts_to_sec(m.group(2)), payload))
                break
    return cues


def extract_order(filename: str) -> int:
    nums = re.findall(r'\d+', filename)
    return int(nums[0]) if nums else 0


def merge(directory: str, output: str):
    files = sorted(Path(directory).glob('*.vtt'), key=lambda f: extract_order(f.name))
    if not files:
        print(f"No VTT files found in {directory}", file=sys.stderr)
        sys.exit(1)

    all_cues = []
    offset = 0.0

    for path in files:
        vtt = path.read_text(encoding='utf-8')
        cues = parse_cues(vtt)
        if not cues:
            continue
        for start, end, payload in cues:
            all_cues.append((start + offset, end + offset, shift_inline(payload, offset)))
        last_end = max(end for _, end, _ in cues)
        offset += last_end + GAP_SECONDS
        print(f"  + {path.name} ({len(cues)} cues, ends at {last_end:.1f}s)")

    lines = ['WEBVTT', '']
    for i, (start, end, payload) in enumerate(all_cues, 1):
        lines.append(f"{i}")
        lines.append(f"{sec_to_ts(start)} --> {sec_to_ts(end)}")
        lines.append(payload)
        lines.append('')

    Path(output).write_text('\n'.join(lines), encoding='utf-8')
    print(f"\nMerged {len(all_cues)} cues → {output}")


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--dir', required=True)
    p.add_argument('--out', required=True)
    args = p.parse_args()
    merge(args.dir, args.out)
