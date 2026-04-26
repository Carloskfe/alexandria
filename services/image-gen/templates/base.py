import io
import textwrap

from PIL import Image, ImageDraw, ImageFont

# Palette: (bg, text, rule, attr)
_PALETTES = {
    'classic': ((13, 27, 42),    (255, 255, 255), (201, 168, 76),  (176, 186, 197)),  # navy / white / gold
    'light':   ((255, 255, 255), (13, 27, 42),    (59, 130, 246),  (107, 114, 128)),  # white / navy / blue
    'dark':    ((0, 0, 0),       (255, 255, 255), (255, 255, 255), (156, 163, 175)),  # black / white / white
    'warm':    ((245, 230, 200), (123, 75, 26),   (180, 100, 40),  (120, 80, 40)),    # cream / amber / rust
    'bold':    ((26, 74, 74),    (240, 230, 208), (240, 230, 208), (200, 220, 210)),  # teal / cream / cream
}

VALID_STYLES = set(_PALETTES.keys())


def render_card(fragment: dict, width: int, height: int, style: str = 'classic') -> bytes:
    palette = _PALETTES.get(style, _PALETTES['classic'])
    bg_color, text_color, rule_color, attr_color = palette

    text = fragment.get("text", "")
    author = fragment.get("author", "")
    title = fragment.get("title", "")

    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    margin = int(width * 0.08)
    text_area_w = width - 2 * margin

    quote_size = max(16, int(width * 0.026))
    attr_size = max(12, int(width * 0.018))
    wm_size = max(10, int(width * 0.015))

    font_quote = ImageFont.load_default(size=quote_size)
    font_attr = ImageFont.load_default(size=attr_size)
    font_wm = ImageFont.load_default(size=wm_size)

    # Approximate characters per line from font size and available width
    chars_per_line = max(20, int(text_area_w / (quote_size * 0.58)))
    lines = textwrap.wrap(text, width=chars_per_line) if text else [""]

    line_h = quote_size * 1.6
    block_h = len(lines) * line_h
    rule_gap = 14
    attr_h = attr_size * 1.4

    total_h = block_h + rule_gap + 2 + rule_gap + attr_h
    y = (height - total_h) / 2

    for line in lines:
        bb = draw.textbbox((0, 0), line, font=font_quote)
        lw = bb[2] - bb[0]
        draw.text(((width - lw) / 2, y), line, font=font_quote, fill=text_color)
        y += line_h

    rule_y = int(y + rule_gap)
    draw.line([(margin, rule_y), (width - margin, rule_y)], fill=rule_color, width=2)

    attr_parts = [p for p in (author, title) if p]
    attr_text = " · ".join(attr_parts)
    if attr_text:
        attr_y = rule_y + rule_gap
        bb = draw.textbbox((0, 0), attr_text, font=font_attr)
        draw.text(((width - (bb[2] - bb[0])) / 2, attr_y), attr_text, font=font_attr, fill=attr_color)

    wm = "Alexandria"
    bb = draw.textbbox((0, 0), wm, font=font_wm)
    draw.text(
        (width - margin - (bb[2] - bb[0]), height - margin - (bb[3] - bb[1])),
        wm,
        font=font_wm,
        fill=attr_color,
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
