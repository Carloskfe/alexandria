"""Generate themed book cover PNGs for specific titles.

Run from the project root:
    python3 services/image-gen/scripts/generate_themed_covers.py

Outputs PNG files to services/web/public/covers/
"""
import io
import math
import os
import sys
import textwrap

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from PIL import Image, ImageDraw, ImageFont
from templates.base import FONT_REGISTRY

OUTPUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', '..', '..', 'services', 'web', 'public', 'covers')
)

W, H = 400, 600


# ── Font helpers ──────────────────────────────────────────────────────────────

def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_REGISTRY.get(name)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def _center_text(draw, text, font, y, width, color, wrap=18):
    for line in textwrap.wrap(text, wrap) or [text]:
        bb = draw.textbbox((0, 0), line, font=font)
        x = (width - (bb[2] - bb[0])) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += (bb[3] - bb[1]) + 6
    return y


def _gradient(img, c1, c2, direction='tb'):
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = y / (h - 1) if direction == 'tb' else x / (w - 1)
            px[x, y] = (
                int(c1[0] + (c2[0] - c1[0]) * t),
                int(c1[1] + (c2[1] - c1[1]) * t),
                int(c1[2] + (c2[2] - c1[2]) * t),
            )


def _save(img, slug):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, f'{slug}.png')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    with open(path, 'wb') as f:
        f.write(buf.getvalue())
    print(f'  wrote {path}')


# ── Individual cover generators ───────────────────────────────────────────────

def make_biblia_reina_valera():
    """Gold & cream — celestial light rays + cross silhouette."""
    img = Image.new('RGB', (W, H))
    _gradient(img, (20, 15, 40), (100, 75, 20))
    draw = ImageDraw.Draw(img)

    # Radial light rays from top-center
    cx, cy = W // 2, H // 4
    for angle in range(0, 360, 15):
        rad = math.radians(angle)
        x2 = cx + int(math.cos(rad) * W)
        y2 = cy + int(math.sin(rad) * H)
        draw.line([(cx, cy), (x2, y2)], fill=(255, 215, 100, 30), width=1)

    # Glowing halo behind cross
    for r, alpha in [(90, 15), (70, 25), (50, 40), (35, 60)]:
        col = (255, 220, 120, alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(
            min(255, 80 + int(alpha * 1.5)),
            min(255, 60 + int(alpha * 1.2)),
            20,
        ))

    # Cross
    cw, ch = 28, 60
    arm_w, arm_h = 60, 20
    cross_y = cy - ch // 2
    draw.rectangle([cx - cw // 2, cross_y, cx + cw // 2, cross_y + ch], fill=(255, 230, 140))
    draw.rectangle([cx - arm_w // 2, cross_y + 15, cx + arm_w // 2, cross_y + 15 + arm_h], fill=(255, 230, 140))

    # Divider
    draw.line([(50, H // 2 + 20), (W - 50, H // 2 + 20)], fill=(200, 170, 80), width=2)

    # Text
    y = H // 2 + 40
    y = _center_text(draw, 'SANTA BIBLIA', _font('playfair', 32), y, W, (255, 230, 140))
    y = _center_text(draw, 'Reina-Valera', _font('lato', 18), y + 6, W, (220, 190, 100))

    _save(img, 'biblia-reina-valera')


def make_quijote(volume: int):
    """Sky blue + rolling hills + windmill + lance."""
    img = Image.new('RGB', (W, H))
    _gradient(img, (100, 160, 220), (220, 200, 140))  # sky top to dusty horizon
    draw = ImageDraw.Draw(img)

    # Sun
    draw.ellipse([W - 90, 30, W - 30, 90], fill=(255, 220, 80))

    # Rolling hills
    hill_points = [(0, H - 180)]
    for x in range(0, W + 20, 20):
        y = H - 180 + int(20 * math.sin(x * 0.04))
        hill_points.append((x, y))
    hill_points += [(W, H), (0, H)]
    draw.polygon(hill_points, fill=(140, 160, 80))

    # Second hill (darker)
    hill2 = [(0, H - 100)]
    for x in range(0, W + 20, 20):
        y = H - 100 + int(15 * math.sin(x * 0.07 + 1))
        hill2.append((x, y))
    hill2 += [(W, H), (0, H)]
    draw.polygon(hill2, fill=(100, 120, 60))

    # Windmill tower (trapezoid)
    mx, my = W // 2 - 20, H - 200
    tower_pts = [
        (mx - 12, H - 100),
        (mx + 12, H - 100),
        (mx + 8, my),
        (mx - 8, my),
    ]
    draw.polygon(tower_pts, fill=(210, 195, 160))
    draw.polygon(tower_pts, outline=(160, 140, 100), width=2)

    # Windmill body (small house at top)
    body_pts = [
        (mx - 18, my),
        (mx + 18, my),
        (mx + 18, my - 25),
        (mx, my - 38),
        (mx - 18, my - 25),
    ]
    draw.polygon(body_pts, fill=(200, 180, 140))
    draw.polygon(body_pts, outline=(150, 130, 90), width=2)

    # Windmill blades (4 arms)
    blade_cx, blade_cy = mx, my - 12
    blade_len = 45
    blade_w = 7
    for angle in [30, 120, 210, 300]:
        rad = math.radians(angle)
        ex = blade_cx + int(blade_len * math.cos(rad))
        ey = blade_cy + int(blade_len * math.sin(rad))
        perp = math.radians(angle + 90)
        pts = [
            (blade_cx + int(blade_w * math.cos(perp)), blade_cy + int(blade_w * math.sin(perp))),
            (ex + int((blade_w // 2) * math.cos(perp)), ey + int((blade_w // 2) * math.sin(perp))),
            (ex - int((blade_w // 2) * math.cos(perp)), ey - int((blade_w // 2) * math.sin(perp))),
            (blade_cx - int(blade_w * math.cos(perp)), blade_cy - int(blade_w * math.sin(perp))),
        ]
        draw.polygon(pts, fill=(190, 170, 130))
        draw.polygon(pts, outline=(140, 120, 80), width=1)
    draw.ellipse([blade_cx - 5, blade_cy - 5, blade_cx + 5, blade_cy + 5], fill=(160, 140, 100))

    # Lance (diagonal, lower right)
    lx1, ly1 = W - 30, H - 60
    lx2, ly2 = 80, H // 3 + 30
    draw.line([(lx1, ly1), (lx2, ly2)], fill=(130, 100, 60), width=6)
    # Lance tip
    tip_rad = math.atan2(ly2 - ly1, lx2 - lx1)
    tip_pts = [
        (lx2, ly2),
        (lx2 + int(18 * math.cos(tip_rad + 0.5)), ly2 + int(18 * math.sin(tip_rad + 0.5))),
        (lx2 + int(18 * math.cos(tip_rad - 0.5)), ly2 + int(18 * math.sin(tip_rad - 0.5))),
    ]
    draw.polygon(tip_pts, fill=(180, 150, 90))

    # Dark overlay for title area at bottom
    overlay = Image.new('RGBA', (W, 130), (0, 0, 0, 140))
    img.paste(Image.alpha_composite(img.convert('RGBA').crop((0, H - 130, W, H)), overlay).convert('RGB'), (0, H - 130))

    draw = ImageDraw.Draw(img)
    vol_label = 'Volumen I' if volume == 1 else 'Volumen II'
    _center_text(draw, 'Don Quijote', _font('playfair', 30), H - 120, W, (255, 240, 180))
    _center_text(draw, 'de la Mancha', _font('playfair', 22), H - 86, W, (255, 240, 180))
    _center_text(draw, vol_label, _font('lato', 16), H - 54, W, (220, 200, 140))
    _center_text(draw, 'Cervantes', _font('lato', 13), H - 32, W, (180, 160, 110))

    _save(img, f'quijote-vol-{volume}')


def make_don_juan_tenorio():
    """Deep crimson + roses + mask silhouette."""
    img = Image.new('RGB', (W, H))
    _gradient(img, (80, 10, 20), (160, 20, 40))
    draw = ImageDraw.Draw(img)

    # Decorative corner ornaments
    def corner_ornament(x, y, flip_x=False, flip_y=False):
        sx = -1 if flip_x else 1
        sy = -1 if flip_y else 1
        for i, r in enumerate([40, 30, 22]):
            alpha = 60 + i * 20
            c = (min(255, 180 + i * 20), min(255, 50 + i * 15), min(255, 50 + i * 15))
            draw.arc([x - r * sx, y - r * sy, x + r * sx, y + r * sy], -30, 60, fill=c, width=2)

    corner_ornament(30, 30)
    corner_ornament(W - 30, 30, flip_x=True)
    corner_ornament(30, H - 30, flip_y=True)
    corner_ornament(W - 30, H - 30, flip_x=True, flip_y=True)

    # Theatrical mask (simple oval + eye cuts)
    mx, my = W // 2, H // 3
    mw, mh = 100, 70
    draw.ellipse([mx - mw, my - mh, mx + mw, my + mh], fill=(200, 160, 80))
    draw.ellipse([mx - mw + 2, my - mh + 2, mx + mw - 2, my + mh - 2], outline=(230, 195, 110), width=3)
    # Eye holes
    draw.ellipse([mx - 55, my - 20, mx - 20, my + 10], fill=(80, 10, 20))
    draw.ellipse([mx + 20, my - 20, mx + 55, my + 10], fill=(80, 10, 20))
    # Nose bridge
    draw.line([(mx, my - 10), (mx, my + 20)], fill=(170, 130, 60), width=3)

    # Roses (simplified circles + petals)
    def rose(cx, cy, r, col):
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            px2 = cx + int(r * 0.7 * math.cos(rad))
            py2 = cy + int(r * 0.7 * math.sin(rad))
            draw.ellipse([px2 - r // 2, py2 - r // 2, px2 + r // 2, py2 + r // 2], fill=col)
        draw.ellipse([cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3], fill=(
            min(255, col[0] + 30), max(0, col[1] - 10), max(0, col[2] - 10)
        ))

    rose(60, H // 2 + 30, 22, (180, 20, 30))
    rose(W - 65, H // 2 + 50, 18, (160, 15, 25))
    rose(W // 2, H * 2 // 3, 20, (200, 30, 40))

    # Decorative line
    draw.line([(40, H // 2 - 20), (W - 40, H // 2 - 20)], fill=(200, 140, 60), width=2)

    y = H // 2
    y = _center_text(draw, 'DON JUAN', _font('playfair', 36), y, W, (255, 220, 140))
    y = _center_text(draw, 'TENORIO', _font('playfair', 36), y + 2, W, (255, 220, 140))
    _center_text(draw, 'José Zorrilla', _font('lato', 16), y + 16, W, (220, 170, 100))

    _save(img, 'don-juan-tenorio')


def make_divina_comedia():
    """Dark infernal gradient + Dante's path of concentric circles."""
    img = Image.new('RGB', (W, H))
    _gradient(img, (8, 5, 15), (100, 40, 10))
    draw = ImageDraw.Draw(img)

    # Fire gradient overlay at bottom
    fire_img = Image.new('RGB', (W, H // 2))
    fp = fire_img.load()
    for y in range(H // 2):
        for x in range(W):
            t = 1 - y / (H // 2 - 1)
            fp[x, y] = (int(180 * t), int(60 * t), 0)
    fire_img.putalpha(Image.fromarray(
        __import__('numpy').array([[int(180 * (1 - y / (H // 2))) for _ in range(W)] for y in range(H // 2)],
        dtype='uint8')) if False else Image.new('L', (W, H // 2), 0))

    # Concentric circles (Dante's infernal rings)
    cx, cy = W // 2, H * 2 // 3
    for i, r in enumerate(range(200, 20, -30)):
        alpha = 30 + i * 15
        col = (min(255, 80 + i * 25), max(0, 30 - i * 3), 0)
        draw.ellipse([cx - r, cy - r // 2, cx + r, cy + r // 2], outline=col, width=2)

    # Dante's silhouette (simplified figure walking)
    sx, sy = W // 2 - 10, H // 2 + 10
    draw.ellipse([sx - 8, sy - 40, sx + 8, sy - 20], fill=(40, 30, 20))  # head
    draw.line([(sx, sy - 20), (sx, sy + 20)], fill=(40, 30, 20), width=6)  # body
    draw.line([(sx, sy), (sx - 20, sy + 20)], fill=(40, 30, 20), width=4)  # left arm
    draw.line([(sx, sy), (sx + 15, sy + 15)], fill=(40, 30, 20), width=4)  # right arm
    draw.line([(sx, sy + 20), (sx - 12, sy + 40)], fill=(40, 30, 20), width=4)  # left leg
    draw.line([(sx, sy + 20), (sx + 12, sy + 40)], fill=(40, 30, 20), width=4)  # right leg

    # Fire licks at bottom
    for fx in range(20, W - 20, 25):
        fh = 30 + int(25 * math.sin(fx * 0.15))
        pts = [(fx, H), (fx + 8, H - fh), (fx + 4, H - fh // 2), (fx - 4, H - fh * 3 // 4), (fx - 8, H)]
        col = (200 + int(55 * math.sin(fx * 0.2)), 60, 0)
        draw.polygon(pts, fill=col)

    # Top decorative border
    draw.line([(30, 30), (W - 30, 30)], fill=(180, 100, 20), width=2)
    draw.line([(30, 36), (W - 30, 36)], fill=(120, 60, 10), width=1)

    y = 50
    y = _center_text(draw, 'LA DIVINA', _font('playfair', 34), y, W, (255, 190, 80))
    y = _center_text(draw, 'COMEDIA', _font('playfair', 34), y + 4, W, (255, 190, 80))
    _center_text(draw, 'Dante Alighieri', _font('lato', 16), y + 16, W, (200, 140, 60))

    _save(img, 'la-divina-comedia')


def make_lider_cargo():
    """Dark navy with ascending geometric shapes — leadership/growth theme."""
    img = Image.new('RGB', (W, H))
    _gradient(img, (8, 15, 35), (20, 40, 80))
    draw = ImageDraw.Draw(img)

    # Ascending bar chart / growth silhouette
    bars = [
        (60, 80, 40),
        (120, 130, 40),
        (180, 190, 40),
        (240, 250, 40),
        (300, 310, 40),
    ]
    heights = [100, 160, 200, 260, 320]
    for i, (bx, _, bw) in enumerate(bars):
        bh = heights[i]
        by = H // 2 + 80 - bh
        col = (40 + i * 20, 100 + i * 15, 200)
        draw.rectangle([bx, by, bx + bw, H // 2 + 80], fill=col)
        # Highlight top
        draw.rectangle([bx, by, bx + bw, by + 6], fill=(min(255, col[0] + 60), min(255, col[1] + 40), 255))

    # Upward arrow
    ax = W - 50
    ay = H // 5
    draw.line([(ax, ay + 60), (ax, ay)], fill=(100, 220, 255), width=4)
    draw.polygon([(ax - 12, ay + 20), (ax + 12, ay + 20), (ax, ay - 10)], fill=(100, 220, 255))

    # Grid lines (subtle)
    for gy in range(H // 4, H // 2 + 90, 40):
        draw.line([(40, gy), (W - 40, gy)], fill=(255, 255, 255, 15), width=1)

    # Title
    draw.line([(40, H // 2 + 110), (W - 40, H // 2 + 110)], fill=(60, 120, 220), width=2)
    y = H // 2 + 125
    y = _center_text(draw, 'EL LÍDER', _font('montserrat', 30), y, W, (100, 200, 255))
    y = _center_text(draw, 'QUE NO TENÍA', _font('montserrat', 22), y + 4, W, (80, 180, 240))
    y = _center_text(draw, 'CARGO', _font('montserrat', 30), y + 2, W, (100, 200, 255))
    _center_text(draw, 'Robin Sharma', _font('lato', 14), y + 12, W, (100, 150, 200))

    _save(img, 'el-lider-cargo')


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print('Generating themed book covers...')
    make_biblia_reina_valera()
    make_quijote(1)
    make_quijote(2)
    make_don_juan_tenorio()
    make_divina_comedia()
    make_lider_cargo()
    print(f'\nDone. Files saved to:\n  {OUTPUT_DIR}')
    print('\nRun migration 028 to update coverUrl in the database.')
