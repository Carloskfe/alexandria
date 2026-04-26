import struct
from unittest.mock import MagicMock, patch

import pytest

from templates.facebook import render


def _png_dimensions(data: bytes):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', "Not a valid PNG"
    w = struct.unpack('>I', data[16:20])[0]
    h = struct.unpack('>I', data[20:24])[0]
    return w, h


def test_render_returns_bytes():
    result = render({})
    assert isinstance(result, bytes)


def test_render_is_non_empty():
    result = render({})
    assert len(result) > 0


def test_render_produces_valid_png():
    result = render({})
    assert result[:8] == b'\x89PNG\r\n\x1a\n'


def test_render_dimensions_are_1200x630():
    result = render({})
    w, h = _png_dimensions(result)
    assert w == 1200
    assert h == 630


def test_render_accepts_populated_fragment():
    fragment = {"text": "Compartir en Facebook.", "author": "Autor", "title": "Libro"}
    result = render(fragment)
    assert isinstance(result, bytes)
    assert len(result) > 0


def test_render_accepts_empty_fragment():
    result = render({})
    assert isinstance(result, bytes)


def test_render_all_styles_produce_valid_png():
    for style in ("classic", "light", "dark", "warm", "bold"):
        result = render({}, style=style)
        assert result[:8] == b'\x89PNG\r\n\x1a\n', f"Style {style} did not produce valid PNG"
        w, h = _png_dimensions(result)
        assert w == 1200 and h == 630, f"Style {style} has wrong dimensions"


def test_render_draws_quote_text():
    fragment = {"text": "Cita Facebook", "author": "Autor", "title": "Libro"}
    with patch("templates.base.ImageDraw") as mock_draw_module:
        mock_draw = MagicMock()
        mock_draw.textbbox.return_value = (0, 0, 100, 20)
        mock_draw_module.Draw.return_value = mock_draw
        render(fragment)
    all_text = " ".join(str(c) for c in mock_draw.text.call_args_list)
    assert "Cita" in all_text or "Facebook" in all_text


def test_render_draws_attribution():
    fragment = {"text": "Quote", "author": "Autor FB", "title": "Libro FB"}
    with patch("templates.base.ImageDraw") as mock_draw_module:
        mock_draw = MagicMock()
        mock_draw.textbbox.return_value = (0, 0, 100, 20)
        mock_draw_module.Draw.return_value = mock_draw
        render(fragment)
    all_text = " ".join(str(c) for c in mock_draw.text.call_args_list)
    assert "Autor FB" in all_text
    assert "Libro FB" in all_text
