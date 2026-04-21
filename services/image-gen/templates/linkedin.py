import io
from PIL import Image


def render(fragment: dict) -> bytes:
    """LinkedIn quote card — 1200x627px."""
    img = Image.new("RGB", (1200, 627), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
