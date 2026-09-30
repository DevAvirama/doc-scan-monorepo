from functools import lru_cache

from src.core.config import settings
from src.services.extractor import DocumentExtractorService
from src.services.image_processor import ImageProcessorService


@lru_cache
def get_image_processor() -> ImageProcessorService:
    return ImageProcessorService(
        blur_threshold=settings.blur_threshold, max_dimension=settings.max_image_dimension
    )


@lru_cache
def get_document_extractor() -> DocumentExtractorService:
    return DocumentExtractorService(
        api_key=settings.gemini_api_key, model_name=settings.gemini_model
    )
