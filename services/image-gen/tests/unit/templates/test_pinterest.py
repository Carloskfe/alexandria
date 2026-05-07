from unittest.mock import patch
import pytest
from templates.pinterest import render, _DIMENSIONS

FRAGMENT = {"text": "La sabiduría es el tesoro del hombre.",
            "author": "Autor", "title": "Libro"}


def test_render_returns_bytes():
    data = render(FRAGMENT)
    assert isinstance(data, bytes)
    assert len(data) > 0


def test_default_format_is_pin():
    w, h = _DIMENSIONS['pin']
    assert w == 1000 and h == 1500


def test_pin_square_dimensions():
    w, h = _DIMENSIONS['pin-square']
    assert w == 1000 and h == 1000


def test_render_pin_produces_png():
    data = render(FRAGMENT, format='pin')
    assert data[:4] == b'\x89PNG'


def test_render_pin_square_produces_png():
    data = render(FRAGMENT, format='pin-square')
    assert data[:4] == b'\x89PNG'


def test_render_unknown_format_falls_back_to_pin():
    data = render(FRAGMENT, format='nonexistent')
    assert data[:4] == b'\x89PNG'


def test_render_respects_font_parameter():
    data_oswald = render(FRAGMENT, font='oswald')
    data_playfair = render(FRAGMENT, font='playfair')
    assert isinstance(data_oswald, bytes)
    assert isinstance(data_playfair, bytes)
