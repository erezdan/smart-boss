import uuid
import logging
from datetime import timedelta
from typing import Optional
from firebase_admin import storage
from .firebase_app import get_firebase_app

logger = logging.getLogger(__name__)


class FirebaseStorageService:
    def __init__(self):
        try:
            get_firebase_app()
            self.bucket = storage.bucket()
        except Exception as e:
            logger.critical("Failed to initialize Firebase Storage", exc_info=e)
            raise

    def upload_temp_image(
        self,
        image_bytes: bytes,
        content_type: str = "image/jpeg",
        ttl_minutes: int = 5,
    ) -> Optional[str]:
        """
        Uploads image bytes to Firebase Storage and returns a signed URL.
        Returns None on failure.
        """
        if not image_bytes:
            logger.warning("upload_temp_image called with empty image_bytes")
            return None

        filename = f"vlm_temp/{uuid.uuid4()}.jpg"

        try:
            blob = self.bucket.blob(filename)

            blob.upload_from_string(
                image_bytes,
                content_type=content_type,
            )

            url = blob.generate_signed_url(
                expiration=timedelta(minutes=ttl_minutes),
                method="GET",
            )

            return url

        except Exception as e:
            logger.error(
                "Failed to upload image to Firebase Storage",
                extra={"path": filename},
                exc_info=e,
            )
            return None

    def delete_by_url(self, signed_url: str) -> bool:
        """
        Deletes a file from Firebase Storage using its signed URL.
        Returns True if deleted, False otherwise.
        """
        if not signed_url:
            logger.warning("delete_by_url called with empty url")
            return False

        try:
            path = self._extract_blob_path(signed_url)
            blob = self.bucket.blob(path)
            blob.delete()
            return True

        except Exception as e:
            logger.warning(
                "Failed to delete file from Firebase Storage",
                extra={"url": signed_url},
                exc_info=e,
            )
            return False

    @staticmethod
    def _extract_blob_path(url: str) -> str:
        from urllib.parse import urlparse, unquote

        parsed = urlparse(url)

        # Expected:
        # /smart-boss-a771e.appspot.com/vlm_temp/xxx.jpg
        parts = parsed.path.split("/", 2)
        if len(parts) < 3:
            raise ValueError("Invalid Firebase Storage URL format")

        return unquote(parts[2])
