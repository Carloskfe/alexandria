from unittest.mock import MagicMock, patch

import pytest

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_health_returns_ok_json(client):
    response = client.get("/health")
    data = response.get_json()
    assert data == {"status": "ok"}


def test_health_content_type_is_json(client):
    response = client.get("/health")
    assert "application/json" in response.content_type


def test_unknown_route_returns_404(client):
    response = client.get("/unknown-route")
    assert response.status_code == 404


# /generate tests

_VALID_BODY = {
    "text": "El conocimiento es poder.",
    "author": "Francis Bacon",
    "title": "Meditationes Sacrae",
    "platform": "linkedin",
}


def test_generate_returns_200_with_url(client):
    with patch("app.MinioClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.upload.return_value = "http://storage:9000/images/abc.png?X-Amz-Signature=sig"
        mock_client_cls.return_value = mock_client
        response = client.post("/generate", json=_VALID_BODY)
    assert response.status_code == 200
    data = response.get_json()
    assert "url" in data
    assert data["url"].startswith("http")


def test_generate_calls_correct_renderer(client):
    mock_render = MagicMock(return_value=b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)
    with patch("app.MinioClient") as mock_client_cls, \
         patch.dict("app._RENDERERS", {"instagram": mock_render}):
        mock_client = MagicMock()
        mock_client.upload.return_value = "http://example.com/img.png"
        mock_client_cls.return_value = mock_client
        body = {**_VALID_BODY, "platform": "instagram"}
        client.post("/generate", json=body)
    mock_render.assert_called_once()


def test_generate_unknown_platform_returns_400(client):
    body = {**_VALID_BODY, "platform": "tiktok"}
    response = client.post("/generate", json=body)
    assert response.status_code == 400
    assert response.get_json()["error"] == "unsupported platform"


def test_generate_missing_text_returns_400(client):
    body = {k: v for k, v in _VALID_BODY.items() if k != "text"}
    response = client.post("/generate", json=body)
    assert response.status_code == 400
    assert "text" in response.get_json()["error"]


def test_generate_missing_author_returns_400(client):
    body = {k: v for k, v in _VALID_BODY.items() if k != "author"}
    response = client.post("/generate", json=body)
    assert response.status_code == 400
    assert "author" in response.get_json()["error"]


def test_generate_missing_title_returns_400(client):
    body = {k: v for k, v in _VALID_BODY.items() if k != "title"}
    response = client.post("/generate", json=body)
    assert response.status_code == 400
    assert "title" in response.get_json()["error"]


def test_generate_missing_platform_returns_400(client):
    body = {k: v for k, v in _VALID_BODY.items() if k != "platform"}
    response = client.post("/generate", json=body)
    assert response.status_code == 400
    assert "platform" in response.get_json()["error"]


def test_generate_minio_error_returns_500(client):
    with patch("app.MinioClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.upload.side_effect = Exception("connection refused")
        mock_client_cls.return_value = mock_client
        response = client.post("/generate", json=_VALID_BODY)
    assert response.status_code == 500
    assert response.get_json()["error"] == "image generation failed"


def test_generate_platform_case_insensitive(client):
    with patch("app.MinioClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.upload.return_value = "http://example.com/img.png"
        mock_client_cls.return_value = mock_client
        body = {**_VALID_BODY, "platform": "LinkedIn"}
        response = client.post("/generate", json=body)
    assert response.status_code == 200
