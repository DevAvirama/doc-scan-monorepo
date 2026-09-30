from google import genai
from google.genai import types

from src.domain.schemas import ExtractedData


class VisionProviderError(Exception):
    """Lanzada cuando el proveedor de IA falla en la inferencia o conexión."""


class DocumentExtractorService:
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self._client = None

    @property
    def client(self) -> genai.Client:
        """Inicializa el cliente de Gemini bajo demanda (Lazy initialization)."""
        if not self.api_key:
            raise VisionProviderError("GEMINI_API_KEY no configurada o vacía.")
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def extract(self, image_bytes: bytes) -> ExtractedData:
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    (
                        "Analiza con rigor la imagen del recibo o factura comercial adjunta. "
                        "Extrae cada campo asegurando que los importes numéricos coincidan con los totales impresos."
                    ),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtractedData,
                    temperature=0.1,
                ),
            )

            if response.parsed is None:
                raise VisionProviderError("El modelo retornó una estructura vacía o inválida.")

            return response.parsed

        except Exception as e:
            if isinstance(e, VisionProviderError):
                raise e
            raise VisionProviderError(f"Error de comunicación con el motor de visión: {e!s}") from e
