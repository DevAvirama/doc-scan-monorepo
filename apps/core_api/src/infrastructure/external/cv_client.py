from typing import Any, Dict
import httpx

from src.domain.exceptions import VisionServiceError
from src.domain.ports.cv_client import ICvServiceClient


class HttpCvServiceClient(ICvServiceClient):
    """Cliente HTTP asíncrono para consumir apps/cv_service."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def extract_from_image(
        self,
        image_bytes: bytes,
        filename: str = "receipt.jpg",
        content_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/api/v1/extract"
        files = {
            "file": (filename, image_bytes, content_type)
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(endpoint, files=files)

            # Manejo de códigos de estado de negocio de cv_service
            if response.status_code == 200:
                payload = response.json()
                if "extracted_data" not in payload:
                    raise VisionServiceError(
                        "cv_service retornó un esquema sin extracted_data.",
                        status_code=502
                    )
                return payload

            # 422: Rechazo por nitidez insuficiente
            if response.status_code == 422:
                err_data = response.json()
                msg = err_data.get("message", "La imagen no tiene nitidez suficiente.")
                blur_score = err_data.get("blur_score", 0.0)
                raise VisionServiceError(
                    f"{msg} (Puntuación de nitidez: {blur_score})",
                    status_code=422
                )

            # 400 o 413: Archivo no soportado o excede 5 MB
            if response.status_code in (400, 413):
                err_data = response.json().get("detail", {})
                msg = err_data.get("message", "Archivo rechazado por el procesador visual.")
                raise VisionServiceError(msg, status_code=response.status_code)

            # Otros códigos 5xx
            raise VisionServiceError(
                f"Fallo del servicio de visión (HTTP {response.status_code}): {response.text}",
                status_code=502
            )

        except httpx.TimeoutException as exc:
            raise VisionServiceError(
                "Tiempo de espera agotado al conectar con el microservicio de visión.",
                status_code=504
            ) from exc

        except httpx.ConnectError as exc:
            raise VisionServiceError(
                "No fue posible establecer conexión con el microservicio de visión.",
                status_code=503
            ) from exc

        except httpx.RequestError as exc:
            raise VisionServiceError(
                f"Error de transporte HTTP hacia cv_service: {str(exc)}",
                status_code=502
            ) from exc
