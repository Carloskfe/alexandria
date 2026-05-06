"""Generate placeholder book cover PNGs for the Noetia library.

Run from services/image-gen/:
    python3 scripts/generate_book_covers.py

Outputs cover PNGs to services/web/public/covers/{slug}.png
These are placeholders until real covers are supplied by authors/publishers.
"""
import hashlib
import os
import sys
import textwrap

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from PIL import Image, ImageDraw, ImageFont
from templates.base import FONT_REGISTRY

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'services', 'web', 'public', 'covers'
)

COVER_W, COVER_H = 400, 600

# Palette: one background color per book derived from its slug hash
PALETTE = [
    '#0D1B2A', '#1B2A3A', '#2C3E50', '#1A1A2E', '#16213E',
    '#0F3460', '#533483', '#2D132C', '#1C0C5B', '#2B2D42',
    '#3D405B', '#264653',
]

BOOKS = [
    {'slug': 'biblia-rv-salmos',        'title': 'Salmos',                    'author': 'Biblia Reina Valera',     'collection': 'Biblia'},
    {'slug': 'biblia-rv-proverbios',    'title': 'Proverbios',                'author': 'Biblia Reina Valera',     'collection': 'Biblia'},
    {'slug': 'biblia-rv-genesis',       'title': 'Génesis',                   'author': 'Biblia Reina Valera',     'collection': 'Biblia'},
    {'slug': 'crimen-y-castigo',        'title': 'Crimen y Castigo',          'author': 'Fiódor Dostoievski',      'collection': None},
    {'slug': 'el-alquimista',           'title': 'El Alquimista',             'author': 'Paulo Coelho',            'collection': None},
    {'slug': 'habitos-atomicos',        'title': 'Hábitos Atómicos',          'author': 'James Clear',             'collection': None},
    {'slug': 'el-poder-del-ahora',      'title': 'El Poder del Ahora',        'author': 'Eckhart Tolle',           'collection': None},
    {'slug': 'como-ganar-amigos',       'title': 'Cómo Ganar Amigos',        'author': 'Dale Carnegie',           'collection': None},
    {'slug': 'padre-rico-padre-pobre',  'title': 'Padre Rico Padre Pobre',   'author': 'Robert Kiyosaki',         'collection': None},
    {'slug': 'piense-y-hagase-rico',    'title': 'Piense y Hágase Rico',     'author': 'Napoleon Hill',           'collection': None},
    {'slug': 'los-7-habitos',           'title': 'Los 7 Hábitos',            'author': 'Stephen Covey',           'collection': None},
    {'slug': 'el-hombre-en-busca',      'title': 'El Hombre en Busca de Sentido', 'author': 'Viktor Frankl',     'collection': None},
]


def _bg_color(slug: str) -> tuple:
    idx = int(hashlib.md5(slug.encode()).hexdigest(), 16) % len(PALETTE)
    hex_color = PALETTE[idx].lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _accent_color(bg: tuple) -> tuple:
    """Return a lighter accent derived from the background."""
    return tuple(min(255, int(c * 1.6 + 40)) for c in bg)


def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_REGISTRY.get(name)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def generate_cover(book: dict) -> bytes:
    bg = _bg_color(book['slug'])
    accent = _accent_color(bg)

    img = Image.new('RGB', (COVER_W, COVER_H), bg)
    draw = ImageDraw.Draw(img)

    # Decorative accent bar on the left edge
    draw.rectangle([0, 0, 6, COVER_H], fill=accent)

    # Collection badge (top right)
    if book.get('collection'):
        badge_font = _load_font('lato', 16)
        badge_text = book['collection'].upper()
        bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
        bw = bbox[2] - bbox[0] + 20
        bh = bbox[3] - bbox[1] + 10
        bx = COVER_W - bw - 16
        by = 16
        draw.rectangle([bx, by, bx + bw, by + bh], fill=accent)
        draw.text((bx + 10, by + 5), badge_text, font=badge_font, fill=bg)

    # Title
    title_font = _load_font('playfair', 38)
    max_chars = 18
    lines = textwrap.wrap(book['title'], width=max_chars)
    y = COVER_H // 3
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=title_font)
        x = (COVER_W - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=title_font, fill=(255, 255, 255))
        y += (bbox[3] - bbox[1]) + 8

    # Separator line
    line_y = y + 16
    draw.line([(COVER_W // 4, line_y), (3 * COVER_W // 4, line_y)], fill=accent, width=2)

    # Author
    author_font = _load_font('lato', 22)
    bbox = draw.textbbox((0, 0), book['author'], font=author_font)
    ax = (COVER_W - (bbox[2] - bbox[0])) // 2
    draw.text((ax, line_y + 16), book['author'], font=author_font, fill=accent)

    # Noetia watermark (bottom center)
    wm_font = _load_font('montserrat', 14)
    wm_text = 'NOETIA'
    bbox = draw.textbbox((0, 0), wm_text, font=wm_font)
    wx = (COVER_W - (bbox[2] - bbox[0])) // 2
    draw.text((wx, COVER_H - 30), wm_text, font=wm_font, fill=(*accent, 140))

    import io
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for book in BOOKS:
        data = generate_cover(book)
        path = os.path.join(OUTPUT_DIR, f"{book['slug']}.png")
        with open(path, 'wb') as f:
            f.write(data)
        print(f"  wrote {path}")
    print(f"Done. {len(BOOKS)} covers generated.")


if __name__ == '__main__':
    main()
