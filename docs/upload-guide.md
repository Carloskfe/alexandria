# Noetia — Author Upload Guide

This document specifies the accepted formats and requirements for books uploaded by authors and publishers. It mirrors the `/upload-guide` page in the web app.

---

## 1. Text File

| Spec | Requirement |
|------|-------------|
| Format | `.txt` plain text |
| Encoding | **UTF-8** (required) |
| Max size | 10 MB |

### Structure

- Paragraphs separated by a **blank line**.
- Chapter headings must be on their own line, in ALL CAPS or prefixed with `CAPÍTULO` / `CHAPTER`.
- Remove page numbers, headers, footers, tables of contents, and footnotes.

```
CAPÍTULO I

Era una noche oscura y tormentosa. El viento
azotaba las ventanas del viejo caserón.

Don Rodrigo no podía dormir. Se levantó y
caminó hasta la ventana.
```

---

## 2. Cover Image

| Spec | Requirement |
|------|-------------|
| Formats | JPG or PNG |
| Minimum dimensions | 800 × 1200 px (2:3 ratio) |
| Recommended dimensions | 1600 × 2400 px |
| Max size | 5 MB |
| Background | No transparency (no alpha channel) |

Title and author name must be legible at the 120 × 180 px thumbnail size.

---

## 3. Audio File

| Spec | Requirement |
|------|-------------|
| Formats | **MP3** (recommended) or M4A/AAC |
| Minimum bitrate | 128 kbps |
| Recommended bitrate | 192 kbps |
| Sample rate | 44,100 Hz or 48,000 Hz |
| Channels | Mono or stereo |
| Max size | 500 MB per file |

### Recommendations

- Record in a quiet room without echo or background noise.
- For books longer than 2 hours, split by chapter (one file per chapter).
- No background music — it interferes with phrase-level sync highlighting.
- Leave 0.5 seconds of silence at the start and end of each file.

---

## 4. Sync File (SRT / VTT) — Optional

A sync file enables **phrase-by-phrase highlighting** in Modo Escucha Activa. Without it, the book works in reading mode only.

| Spec | Requirement |
|------|-------------|
| Formats | SRT (`.srt`) or WebVTT (`.vtt`) |
| Encoding | UTF-8 |
| Max size | 2 MB |
| Rule | Each cue = one sentence / phrase from the book |

Sync files are uploaded separately via the API after the book is created:

```
POST /books/:id/sync-map/srt
Authorization: Bearer <token>
Content-Type: text/plain
Body: raw SRT or VTT content (max 2 MB)

Response 200:
{
  "id": "uuid",
  "bookId": "uuid",
  "syncSource": "srt",   // or "vtt"
  "phrases": [...],
  "updatedAt": "ISO date"
}
```

### SRT Format

```srt
1
00:00:01,000 --> 00:00:03,500
Era una noche oscura y tormentosa.

2
00:00:03,700 --> 00:00:06,200
El viento azotaba las ventanas del caserón.

3
00:00:06,500 --> 00:00:09,100
Don Rodrigo no podía dormir.
```

- Separator between seconds and milliseconds: **comma** (`,`).
- Each block: sequence number → timing line → text → blank line.

### WebVTT Format

```vtt
WEBVTT

00:00:01.000 --> 00:00:03.500
Era una noche oscura y tormentosa.

00:00:03.700 --> 00:00:06.200
El viento azotaba las ventanas del caserón.
```

- First line must be `WEBVTT`.
- Separator between seconds and milliseconds: **period** (`.`).
- Cue identifiers and `NOTE` blocks are ignored by the parser.

### Recommended tools

| Tool | Platform | Cost | Notes |
|------|----------|------|-------|
| **Subtitle Edit** | Windows | Free | Manual sync with waveform display |
| **Aegisub** | Win / macOS / Linux | Free | Frame-accurate subtitle editor |
| **Descript** | Web / Desktop | Freemium | Automatic transcription → exports SRT |
| **oTranscribe** | Browser | Free | Keyboard-shortcut-driven manual transcription |

---

## 5. Review Process

1. **Upload** — Text, cover, and audio via the author portal.
2. **Sync** — Optional SRT/VTT file uploaded via the API.
3. **Review** — Editorial team reviews content within 3–5 business days.
4. **Publication** — Confirmation email sent; book goes live on the platform.

---

## 6. syncSource Values

The `syncSource` field on a sync map tracks how phrase timestamps were generated:

| Value | Meaning |
|-------|---------|
| `auto` | Phrases split from plain text; no timestamps (startTime/endTime = 0) |
| `srt` | Timestamps from an uploaded SRT file |
| `vtt` | Timestamps from an uploaded WebVTT file |
| `manual` | Timestamps set directly via the admin JSON API |
