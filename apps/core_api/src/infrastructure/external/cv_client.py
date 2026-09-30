from typing import Any
import httpx

from src.domain.exceptions import VisionServiceError
from src.domain.ports.cv_client import ICvServiceClient


class HttpCvServiceClient(ICvServiceClient):
    """Cliente HTTP asíncrono para consumir apps/cv_service."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        clean_base = base_url.rstrip("/")
        if clean_base.endswith("/api/v1"):
            self._endpoint = f"{clean_base}/extract"
        else:
            self._endpoint = f"{clean_base}/api/v1/extract"
        self.timeout = timeout

    async def extract_from_image(
        self, image_bytes: bytes, filename: str = "receipt.jpg", content_type: str = "image/jpeg"
    ) -> dict[str, Any]:
        files = {"file": (filename, image_bytes, content_type)}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self._endpoint, files=files)

            if response.status_code == 200:
                payload = response.json()
                return payload.get("data", payload)

            if response.status_code == 422:
                error_body = response.json()
                raise VisionServiceError(
                    message=error_body.get("message", "Error de validación en procesamiento de imagen"),
                    status_code=422,
                    detail=error_body.get("detail"),
                )

            raise VisionServiceError(
                message=f"Fallo del servicio de visión (HTTP {response.status_code}): {response.text}",
                status_code=response.status_code,
            )

        except httpx.RequestError as exc:
            raise VisionServiceError(
                message=f"No se pudo establecer conexión con cv_service: {str(exc)}",
                status_code=503,
            ) from exc
