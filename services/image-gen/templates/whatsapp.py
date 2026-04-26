from templates.base import render_card


def render(fragment: dict, style: str = 'classic') -> bytes:
    """WhatsApp quote card — 800x800px."""
    return render_card(fragment, 800, 800, style)
