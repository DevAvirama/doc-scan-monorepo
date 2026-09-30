import logging
from typing import Any

from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_random_exponential,
)

from src.core.config import settings
from src.domain.exceptions import VisionProviderError
from src.domain.schemas import DocumentExtractionSchema

logger = logging.getLogger("cv_service.gemini")


def _is_transient_gemini_error(exc: BaseException) -> bool:
    """Evalúa si la excepción corresponde a una saturación o fallo transitorio de Gemini."""
    if isinstance(exc, APIError):
        # 429: Too Many Requests / Quota Exceeded, 503: Service Unavailable / Overloaded
        return exc.code in (429, 503)

    error_str = str(exc).lower()
    transient_indicators = [
        "503",
        "unavailable",
        "high demand",
        "429",
        "resource_exhausted",
        "timeout",
    ]
    return any(ind in error_str for ind in transient_indicators)


class GeminiVisionProvider:
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    @retry(
        retry=retry_if_exception(_is_transient_gemini_error),
        wait=wait_random_exponential(multiplier=1.5, min=2, max=10),
        stop=stop_after_attempt(4),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    def _call_model_with_retry(self, image_bytes: bytes, mime_type: str) -> Any:
        """Invoca la API de Gemini con tolerancia a picos temporales de saturación."""
        prompt = (
            "Analiza con máxima precisión la siguiente imagen de documento comercial (recibo, factura o ticket). "
            "Extrae estructuradamente: comercio, fecha, número de documento si aplica, moneda, total, impuestos "
            "y la lista detallada de productos o servicios con cantidades y precios."
        )

        return self.client.models.generate_content(
            model=self.model,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DocumentExtractionSchema,
                temperature=0.1,
            ),
        )

    def extract_document_data(
        self, image_bytes: bytes, mime_type: str = "image/jpeg"
    ) -> DocumentExtractionSchema:
        try:
            response = self._call_model_with_retry(image_bytes, mime_type)
            if not response.text:
                raise VisionProviderError("El modelo respondió con un cuerpo de texto vacío")
            return DocumentExtractionSchema.model_validate_json(response.text)
        except Exception as e:
            if not isinstance(e, VisionProviderError):
                logger.error(f"Error irrecuperable en GeminiVisionProvider: {e}")
                raise VisionProviderError(
                    f"Error de comunicación con el motor de visión: {e}"
                ) from e
            raise
