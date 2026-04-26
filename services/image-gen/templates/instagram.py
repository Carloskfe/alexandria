from templates.base import render_card


def render(fragment: dict, style: str = 'classic') -> bytes:
    """Instagram quote card — 1080x1080px."""
    return render_card(fragment, 1080, 1080, style)
