import io
import os
import uuid
from datetime import timedelta

from minio import Minio


class MinioClient:
    def __init__(self):
        endpoint = os.getenv("MINIO_ENDPOINT", "storage")
        port = os.getenv("MINIO_PORT", "9000")
        access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        secret_key = os.getenv("MINIO_SECRET_KEY", "changeme")
        use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"

        self._client = Minio(
            f"{endpoint}:{port}",
            access_key=access_key,
            secret_key=secret_key,
            secure=use_ssl,
        )

    def upload(self, data: bytes, bucket: str = "images") -> str:
        object_name = f"{uuid.uuid4()}.png"
        self._client.put_object(
            bucket,
            object_name,
            io.BytesIO(data),
            length=len(data),
            content_type="image/png",
        )
        url = self._client.presigned_get_object(
            bucket,
            object_name,
            expires=timedelta(days=7),
        )
        return url
