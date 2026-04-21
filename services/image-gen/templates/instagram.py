import io
from PIL import Image


def render(fragment: dict) -> bytes:
    """Instagram quote card — 1080x1080px."""
    img = Image.new("RGB", (1080, 1080), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
