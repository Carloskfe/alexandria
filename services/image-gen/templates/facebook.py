from templates.base import render_card


def render(fragment: dict) -> bytes:
    """Facebook quote card — 1200x630px."""
    return render_card(fragment, 1200, 630)
