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

        # Public URL rewrites the internal Docker hostname in presigned URLs so
        # browsers can reach MinIO directly (e.g. http://localhost:9000 in dev).
        scheme = "https" if use_ssl else "http"
        self._internal_origin = f"{scheme}://{endpoint}:{port}"
        self._public_origin = (os.getenv("MINIO_PUBLIC_URL") or "").rstrip("/") or None

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
        # Replace internal Docker hostname with browser-reachable public URL.
        if self._public_origin:
            url = url.replace(self._internal_origin, self._public_origin, 1)
        return url
