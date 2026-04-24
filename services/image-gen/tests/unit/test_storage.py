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


def test_upload_returns_presigned_url(mock_minio):
    _, mock_instance = mock_minio
    expected_url = "http://storage:9000/images/uuid.png?token=abc"
    mock_instance.presigned_get_object.return_value = expected_url
    client = MinioClient()
    result = client.upload(b"data")
    assert result == expected_url


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
