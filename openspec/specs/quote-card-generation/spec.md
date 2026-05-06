## ADDED Requirements

### Requirement: Platform templates render styled quote cards
The image-gen service SHALL render a PNG quote card for each supported platform and format. The card SHALL include: quote text wrapped to fit the card width, author + book attribution line, and a "Noetia" watermark. The background SHALL be either a solid colour or a two-stop vertical gradient. The text colour SHALL be determined as follows: if `textColor` is provided, use it directly; otherwise apply auto-luminance (white when background luminance ≤ 0.179, dark navy `#0D1B2A` otherwise). The font SHALL be selected from 5 bundled TTF typefaces.

**Supported platforms:** `linkedin`, `instagram`, `facebook`, `pinterest`
(`whatsapp` is kept in the renderer map for backwards compatibility but is no longer exposed in the UI.)

#### Scenario: LinkedIn post card renders at correct dimensions
- **WHEN** `render(fragment, format='post')` is called on the LinkedIn template
- **THEN** the returned bytes decode to a valid PNG with dimensions 1200×627 px

#### Scenario: Instagram post card renders at correct dimensions
- **WHEN** `render(fragment, format='post')` is called on the Instagram template
- **THEN** the returned bytes decode to a valid PNG with dimensions 1080×1080 px

#### Scenario: Instagram story/reel card renders at correct dimensions
- **WHEN** `render(fragment, format='story')` or `render(fragment, format='reel')` is called
- **THEN** the returned bytes decode to a valid PNG with dimensions 1080×1920 px

#### Scenario: Facebook post card renders at correct dimensions
- **WHEN** `render(fragment, format='post')` is called on the Facebook template
- **THEN** the returned bytes decode to a valid PNG with dimensions 1200×630 px

#### Scenario: Pinterest standard pin renders at correct dimensions
- **WHEN** `render(fragment, format='pin')` is called on the Pinterest template
- **THEN** the returned bytes decode to a valid PNG with dimensions 1000×1500 px

#### Scenario: Pinterest square pin renders at correct dimensions
- **WHEN** `render(fragment, format='pin-square')` is called on the Pinterest template
- **THEN** the returned bytes decode to a valid PNG with dimensions 1000×1000 px

#### Scenario: Long text is wrapped and does not overflow
- **WHEN** `render(fragment)` is called with quote text longer than 200 characters
- **THEN** the returned PNG is valid and text is wrapped within card bounds

#### Scenario: Light background produces dark text when no textColor override
- **WHEN** `render_card` is called with `bg_colors=["#FFFFFF"]` and no `textColor`
- **THEN** the rendered card uses dark navy text colour

#### Scenario: Dark background produces white text when no textColor override
- **WHEN** `render_card` is called with `bg_colors=["#000000"]` and no `textColor`
- **THEN** the rendered card uses white text colour

#### Scenario: textColor override bypasses auto-luminance
- **WHEN** `render_card` is called with `bg_colors=["#FFFFFF"]` and `textColor="#FF0000"`
- **THEN** the rendered card uses `#FF0000` as the text colour regardless of luminance

#### Scenario: Each of the 5 fonts produces a valid PNG
- **WHEN** `render_card` is called with each of: `playfair`, `lato`, `merriweather`, `dancing`, `montserrat`
- **THEN** each call returns a valid PNG with correct dimensions

### Requirement: POST /generate endpoint accepts fragment metadata and returns a public URL
The image-gen service SHALL expose `POST /generate` accepting JSON `{ text, author, title, platform, format?, font?, bgType?, bgColors?, textColor? }`. It SHALL render the card, upload the PNG to MinIO `images/` bucket with a UUID filename, and return `{ url: <URL> }` with HTTP 200.

The returned URL SHALL use the public-facing host from `MINIO_PUBLIC_URL` so browsers can directly download the image. If `MINIO_PUBLIC_URL` is not set, the raw MinIO presigned URL is returned (usable only within the Docker network).

Valid values for `platform`: `linkedin`, `instagram`, `facebook`, `pinterest`
Valid values for `format`: `post`, `story`, `pin`, `pin-square`, `reel`, `twitter-card`
Defaults: `format=post`, `font=lato`, `bgType=solid`, `bgColors=["#0D1B2A"]`

#### Scenario: Valid request returns accessible URL
- **WHEN** a POST request is sent to `/generate` with `{ text, author, title, platform: "linkedin" }`
- **THEN** the response is HTTP 200 with JSON `{ "url": "<browser-accessible URL>" }`

#### Scenario: Pinterest pin request returns 200
- **WHEN** a POST request is sent with `{ text, author, title, platform: "pinterest", format: "pin" }`
- **THEN** the response is HTTP 200 with a URL for a 1000×1500 PNG

#### Scenario: Unknown platform returns 400
- **WHEN** a POST request is sent to `/generate` with `platform: "tiktok"`
- **THEN** the response is HTTP 400 with `{ "error": "unsupported platform" }`

#### Scenario: Missing required field returns 400
- **WHEN** a POST request is sent to `/generate` with `text` omitted
- **THEN** the response is HTTP 400 with `{ "error": "missing required field: text" }`

## REMOVED Requirements

### Requirement: WhatsApp as a primary sharing platform
**Reason:** WhatsApp replaced by Pinterest as the fourth sharing platform. Pinterest formats (`pin` 1000×1500, `pin-square` 1000×1000) are now the standard. The `whatsapp` renderer is retained in `app.py` for backward compatibility but is no longer listed as a valid platform in the frontend `share-utils.ts`.

### Requirement: Fixed colour palette styles
**Reason:** Replaced by fully customisable `font`, `bgType`, and `bgColors` parameters.
