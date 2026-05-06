from datetime import timedelta
from unittest.mock import MagicMock, call, patch

import pytest

from storage import MinioClient


@pytest.fixture
def mock_minio():
    with patch("storage.Minio") as mock_cls:
        mock_instance = MagicMock()
        mock_cls.return_value = mock_instance
        yield mock_cls, mock_instance


def test_upload_calls_put_object(mock_minio):
    _, mock_instance = mock_minio
    mock_instance.presigned_get_object.return_value = "http://example.com/img.png"
    client = MinioClient()
    data = b"\x89PNG test bytes"
    client.upload(data)
    mock_instance.put_object.assert_called_once()
    args = mock_instance.put_object.call_args
    assert args[0][0] == "images"  # bucket
    assert args[0][1].endswith(".png")  # object name
    assert args[1]["content_type"] == "image/png"


def test_upload_calls_presigned_get_object(mock_minio):
    _, mock_instance = mock_minio
    mock_instance.presigned_get_object.return_value = "http://example.com/img.png"
    client = MinioClient()
    client.upload(b"data")
    mock_instance.presigned_get_object.assert_called_once()
    args = mock_instance.presigned_get_object.call_args
    assert args[0][0] == "images"
    assert args[1]["expires"] == timedelta(days=7)


def test_upload_returns_presigned_url_unchanged_without_public_url(mock_minio):
    """Without MINIO_PUBLIC_URL the internal URL is returned as-is."""
    _, mock_instance = mock_minio
    internal_url = "http://storage:9000/images/uuid.png?token=abc"
    mock_instance.presigned_get_object.return_value = internal_url
    with patch.dict("os.environ", {}, clear=False):
        os_env = __import__("os").environ
        os_env.pop("MINIO_PUBLIC_URL", None)
        client = MinioClient()
    result = client.upload(b"data")
    assert result == internal_url


def test_upload_rewrites_url_when_minio_public_url_set(mock_minio):
    """MINIO_PUBLIC_URL replaces the internal Docker hostname in the presigned URL."""
    _, mock_instance = mock_minio
    internal_url = "http://storage:9000/images/uuid.png?X-Amz-Signature=abc"
    mock_instance.presigned_get_object.return_value = internal_url
    with patch.dict("os.environ", {"MINIO_PUBLIC_URL": "http://localhost:9000"}):
        client = MinioClient()
        result = client.upload(b"data")
    assert result.startswith("http://localhost:9000/")
    assert "storage:9000" not in result


def test_upload_rewrites_trailing_slash_in_public_url(mock_minio):
    """Trailing slash in MINIO_PUBLIC_URL is stripped before replacement."""
    _, mock_instance = mock_minio
    internal_url = "http://storage:9000/images/uuid.png"
    mock_instance.presigned_get_object.return_value = internal_url
    with patch.dict("os.environ", {"MINIO_PUBLIC_URL": "http://localhost:9000/"}):
        client = MinioClient()
        result = client.upload(b"data")
    assert "storage:9000" not in result
    assert result.startswith("http://localhost:9000/")


def test_upload_uses_custom_bucket(mock_minio):
    _, mock_instance = mock_minio
    mock_instance.presigned_get_object.return_value = "http://example.com/img.png"
    client = MinioClient()
    client.upload(b"data", bucket="custom-bucket")
    args = mock_instance.put_object.call_args
    assert args[0][0] == "custom-bucket"


def test_minio_client_uses_env_vars(mock_minio):
    mock_cls, _ = mock_minio
    mock_cls.return_value.presigned_get_object.return_value = "http://x.com/img.png"
    with patch.dict("os.environ", {
        "MINIO_ENDPOINT": "myhost",
        "MINIO_PORT": "9001",
        "MINIO_ACCESS_KEY": "mykey",
        "MINIO_SECRET_KEY": "mysecret",
        "MINIO_USE_SSL": "false",
    }):
        MinioClient()
    mock_cls.assert_called_with(
        "myhost:9001",
        access_key="mykey",
        secret_key="mysecret",
        secure=False,
    )
