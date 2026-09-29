from fastapi import Request, status
from fastapi.responses import JSONResponse

from src.domain.exceptions import DocumentNotFoundError, DomainError, VisionServiceError


async def document_not_found_handler(request: Request, exc: DocumentNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "DOCUMENT_NOT_FOUND",
            "message": str(exc),
            "document_id": exc.document_id,
        },
    )


async def vision_service_error_handler(request: Request, exc: VisionServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "VISION_SERVICE_ERROR",
            "message": str(exc),
        },
    )


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "DOMAIN_RULE_VIOLATION",
            "message": str(exc),
        },
    )
