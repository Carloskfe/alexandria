"""Generate background preset placeholder PNGs for the share image creator.

Run from services/image-gen/:
    python3 scripts/generate_bg_presets.py

Outputs:
  - services/web/public/backgrounds/imagen-1.png  … imagen-5.png  (preset placeholders)
  - services/web/public/backgrounds/upload-slot.png               (upload CTA placeholder)
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from PIL import Image, ImageDraw, ImageFont
from templates.base import FONT_REGISTRY

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'services', 'web', 'public', 'backgrounds'
)

W, H = 400, 400

PRESET_COLORS = [
    ('#1A1A2E', '#E94560'),  # dark navy / red
    ('#0F3460', '#533483'),  # navy / purple
    ('#2C3E50', '#27AE60'),  # dark slate / green
    ('#16213E', '#F5A623'),  # midnight / amber
    ('#2D132C', '#EE4540'),  # deep plum / rose
]

UPLOAD_SLOT = {
    'bg': '#F0F4F8',
    'icon_color': '#94A3B8',
    'text': 'Subir imagen',
    'text_color': '#64748B',
}


def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_REGISTRY.get(name)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def generate_preset(index: int, bg_hex: str, accent_hex: str) -> bytes:
    bg = _hex_to_rgb(bg_hex)
    accent = _hex_to_rgb(accent_hex)

    img = Image.new('RGB', (W, H), bg)
    draw = ImageDraw.Draw(img)

    # Subtle diagonal gradient feel — lighten top-left corner
    pixels = img.load()
    for y in range(H):
        for x in range(W):
            factor = 1.0 + 0.15 * (1.0 - (x + y) / (W + H))
            r, g, b = bg
            pixels[x, y] = (
                min(255, int(r * factor)),
                min(255, int(g * factor)),
                min(255, int(b * factor)),
            )

    # Decorative corner accent
    draw.rectangle([0, 0, W // 4, 4], fill=accent)
    draw.rectangle([0, 0, 4, H // 4], fill=accent)
    draw.rectangle([3 * W // 4, H - 4, W, H], fill=accent)
    draw.rectangle([W - 4, 3 * H // 4, W, H], fill=accent)

    # Label
    label = f'Imagen {index}'
    font_large = _load_font('montserrat', 36)
    bbox = draw.textbbox((0, 0), label, font=font_large)
    x = (W - (bbox[2] - bbox[0])) // 2
    y = (H - (bbox[3] - bbox[1])) // 2
    draw.text((x, y), label, font=font_large, fill=(255, 255, 255))

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def generate_upload_slot() -> bytes:
    bg = _hex_to_rgb(UPLOAD_SLOT['bg'])
    icon_color = _hex_to_rgb(UPLOAD_SLOT['icon_color'])
    text_color = _hex_to_rgb(UPLOAD_SLOT['text_color'])

    img = Image.new('RGB', (W, H), bg)
    draw = ImageDraw.Draw(img)

    # Dashed border simulation using rectangles
    border = 3
    gap = 10
    for i in range(0, W, gap * 2):
        draw.rectangle([i, 0, min(i + gap, W), border], fill=icon_color)
        draw.rectangle([i, H - border, min(i + gap, W), H], fill=icon_color)
    for i in range(0, H, gap * 2):
        draw.rectangle([0, i, border, min(i + gap, H)], fill=icon_color)
        draw.rectangle([W - border, i, W, min(i + gap, H)], fill=icon_color)

    # Upload icon (simple ↑ arrow)
    cx, cy = W // 2, H // 2 - 30
    arrow_w, arrow_h = 40, 50
    # shaft
    draw.rectangle([cx - 6, cy, cx + 6, cy + arrow_h], fill=icon_color)
    # arrowhead
    points = [(cx - 20, cy + 18), (cx, cy - 10), (cx + 20, cy + 18)]
    draw.polygon(points, fill=icon_color)
    # base line
    draw.rectangle([cx - 22, cy + arrow_h, cx + 22, cy + arrow_h + 4], fill=icon_color)

    # Text
    font = _load_font('lato', 26)
    text = UPLOAD_SLOT['text']
    bbox = draw.textbbox((0, 0), text, font=font)
    tx = (W - (bbox[2] - bbox[0])) // 2
    draw.text((tx, cy + arrow_h + 20), text, font=font, fill=text_color)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for i, (bg, accent) in enumerate(PRESET_COLORS, start=1):
        data = generate_preset(i, bg, accent)
        path = os.path.join(OUTPUT_DIR, f'imagen-{i}.png')
        with open(path, 'wb') as f:
            f.write(data)
        print(f'  wrote {path}')

    data = generate_upload_slot()
    path = os.path.join(OUTPUT_DIR, 'upload-slot.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'  wrote {path}')

    print('Done.')


if __name__ == '__main__':
    main()
