from templates.base import render_card


def render(fragment: dict, style: str = 'classic') -> bytes:
    """LinkedIn quote card — 1200x627px."""
    return render_card(fragment, 1200, 627, style)
