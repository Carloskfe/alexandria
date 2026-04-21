import io
from PIL import Image


def render(fragment: dict) -> bytes:
    """WhatsApp quote card — 800x800px."""
    img = Image.new("RGB", (800, 800), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
