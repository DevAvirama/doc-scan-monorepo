from abc import ABC, abstractmethod
from typing import Any


class ICvServiceClient(ABC):
    """Puerto para el cliente de comunicación con el microservicio cv_service."""

    @abstractmethod
    async def extract_from_image(
        self, image_bytes: bytes, filename: str, content_type: str
    ) -> dict[str, Any]:
        """Envía el archivo binario a cv_service y obtiene el payload normalizado."""
        raise NotImplementedError
