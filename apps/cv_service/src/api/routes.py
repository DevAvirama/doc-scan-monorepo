import time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from src.api.deps import get_document_extractor, get_image_processor
from src.domain.schemas import ExtractionResponse
from src.services.extractor import DocumentExtractorService, VisionProviderError
from src.services.image_processor import ImageProcessorService, InvalidImageError

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "cv_service"}


@router.post(
    "/extract",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Extraction"]
)
async def extract_document(
    file: UploadFile = File(...),
    processor: ImageProcessorService = Depends(get_image_processor),
    extractor: DocumentExtractorService = Depends(get_document_extractor),
):
    start_time = time.perf_counter()

    # 1. Validación de MIME Type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_FILE_TYPE", "message": f"Tipo {file.content_type} no soportado."}
        )

    # 2. Lectura y validación de tamaño
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"error": "FILE_TOO_LARGE", "message": "El archivo supera el límite de 5 MB."}
        )

    # 3. Preprocesamiento con OpenCV
    try:
        processed = processor.process(raw_bytes)
    except InvalidImageError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_IMAGE_DATA", "message": str(e)}
        )

    # 4. Control de calidad: Rechazo si es ilegible/borrosa
    if processed.metrics.is_blurry:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "IMAGE_TOO_BLURRY",
                "blur_score": processed.metrics.blur_score,
                "message": "La nitidez de la imagen es insuficiente para una extracción precisa."
            }
        )

    # 5. Inferencia con Gemini Vision
    try:
        extracted = extractor.extract(processed.image_bytes)
    except VisionProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "VISION_PROVIDER_ERROR", "message": str(e)}
        )

    # 6. Cálculo de métricas de tiempo y consolidación de respuesta
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return ExtractionResponse(
        status="success",
        processing_time_ms=elapsed_ms,
        quality_metrics=processed.metrics,
        extracted_data=extracted
    )
