import io
from PIL import Image


def render(fragment: dict) -> bytes:
    """Facebook quote card — 1200x630px."""
    img = Image.new("RGB", (1200, 630), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
