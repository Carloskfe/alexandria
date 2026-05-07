# Noetia — Author Upload Guide

Specs and workflow for books uploaded by authors and publishers.
The `/upload-guide` page in the web app is the user-facing version of this document.
Contact: autores@noetia.app

---

## Process overview

1. **Prepare files** — text, cover, audio, optional SRT/VTT sync file
2. **Upload via author portal** — `/author` page, form submission
3. **Editorial review** — 3–5 business days
4. **Publication** — confirmation email, book goes live
5. **Add/update sync** — available any time from "Mis libros", even post-publication

---

## Text file

| Spec | Value |
|------|-------|
| Preferred format | `.txt` (plain text, UTF-8) |
| Also accepted | `.epub`, `.pdf` |
| Max size | 10 MB |

### Formatting rules

- Paragraphs separated by a **blank line**.
- Chapter headings on their own line, ALL CAPS or prefixed with `CAPÍTULO` / `CHAPTER`.
- No page numbers, headers, footers, or tables of contents.
- Footnotes at the end of the chapter in brackets: `[Nota: text]`.

```
CAPÍTULO I — El comienzo

Era una noche oscura y tormentosa. El viento
azotaba las ventanas del viejo caserón.

Don Rodrigo no podía dormir.
```

---

## Cover image

| Spec | Value |
|------|-------|
| Formats | JPG or PNG |
| Min dimensions | 800 × 1200 px (2:3 ratio) |
| Recommended | 1600 × 2400 px |
| Max size | 5 MB |
| Background | No transparency (no alpha channel) |

Title and author name must be legible at 120 × 180 px (thumbnail size in-app).

**Stored in MinIO:** `images/covers/{uuid}.{ext}` — URL returned as `publicUrl('images', key)`. Set MinIO `images` bucket to public-read in production.

---

## Audio file

| Spec | Value |
|------|-------|
| Preferred format | MP3 |
| Also accepted | M4A, AAC |
| Min bitrate | 128 kbps |
| Recommended | 192 kbps |
| Sample rate | 44,100 Hz or 48,000 Hz |
| Channels | Mono or stereo |
| Max size | 500 MB per file |

- No background music.
- 0.5 s silence at start and end.
- Normalize to −14 LUFS for consistent playback volume.
- Files > 2 hours can be split by chapter.

---

## Sync file (SRT / VTT) — optional but recommended

Enables phrase-by-phrase highlighting in Modo Escucha Activa.

| Spec | Value |
|------|-------|
| Formats | SRT (`.srt`) or WebVTT (`.vtt`) |
| Encoding | UTF-8 |
| Max size | 2 MB |
| Rule | Each cue = one sentence / phrase |

### SRT format

```srt
1
00:00:01,000 --> 00:00:03,500
Primera frase del libro.

2
00:00:03,700 --> 00:00:06,200
Segunda frase del libro.
```

### WebVTT format

```vtt
WEBVTT

00:00:01.000 --> 00:00:03.500
Primera frase del libro.
```

VTT uses period (`.`) not comma (`,`) in timestamps.

### Recommended tools

| Tool | Platform | Cost |
|------|----------|------|
| Subtitle Edit | Windows | Free |
| Aegisub | Win / macOS / Linux | Free |
| Descript | Web / Desktop | Freemium |
| oTranscribe | Browser | Free |

### API endpoint (used by the author portal form)

```
POST /books/:bookId/sync-map/srt
Authorization: Bearer <jwt>
Content-Type: text/plain
Body: raw SRT or VTT text (max 2 MB)

200 OK:
{
  "id": "uuid",
  "bookId": "uuid",
  "syncSource": "srt",    // or "vtt"
  "phrases": [...],
  "updatedAt": "ISO 8601"
}
```

Authorized for: admins and the book's own uploader (`book.uploadedById`).  
The author portal posts to this endpoint from the SRT upload button in "Mis libros".

---

## syncSource values

| Value | Meaning |
|-------|---------|
| `auto` | Auto-split from plain text; `startTime`/`endTime` = 0 |
| `srt` | Timestamps from uploaded SRT file |
| `vtt` | Timestamps from uploaded WebVTT file |
| `manual` | Timestamps set via admin JSON API |

---

## Production checklist

- [ ] Set MinIO `images` bucket policy to allow public reads on `covers/` prefix
- [ ] Configure `MINIO_PUBLIC_URL` to CDN or S3 public endpoint
- [ ] Verify `autores@noetia.app` inbox is monitored
- [ ] Set up email notification on book submission (currently manual review)
