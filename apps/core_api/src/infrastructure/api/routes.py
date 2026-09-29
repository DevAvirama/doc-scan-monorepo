from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.dtos import DocumentResponseDTO, PaginatedDocumentsDTO
from src.application.use_cases.get_document import GetDocumentUseCase, ListDocumentsUseCase
from src.application.use_cases.scan_document import ScanDocumentUseCase
from src.infrastructure.api.deps import (
    get_db_session,
    get_get_document_use_case,
    get_list_documents_use_case,
    get_scan_document_use_case,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/scan", response_model=DocumentResponseDTO, status_code=status.HTTP_201_CREATED)
async def scan_document(
    file: UploadFile = File(...),
    use_case: ScanDocumentUseCase = Depends(get_scan_document_use_case),
    session: AsyncSession = Depends(get_db_session),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_FILE_TYPE", "message": f"Tipo {file.content_type} no permitido."}
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"error": "FILE_TOO_LARGE", "message": "El archivo excede el límite de 5 MB."}
        )

    document = await use_case.execute(
        image_bytes=raw_bytes,
        filename=file.filename or "receipt.jpg",
        content_type=file.content_type or "image/jpeg"
    )
    await session.commit()
    return document


@router.get("", response_model=PaginatedDocumentsDTO, status_code=status.HTTP_200_OK)
async def list_documents(
    limit: int = Query(20, ge=1, le=100, description="Cantidad máxima de registros a retornar"),
    offset: int = Query(0, ge=0, description="Cantidad de registros a omitir"),
    use_case: ListDocumentsUseCase = Depends(get_list_documents_use_case),
):
    items, total = await use_case.execute(limit=limit, offset=offset)
    return PaginatedDocumentsDTO(
        total=total,
        limit=limit,
        offset=offset,
        items=items
    )


@router.get("/{document_id}", response_model=DocumentResponseDTO, status_code=status.HTTP_200_OK)
async def get_document(
    document_id: UUID,
    use_case: GetDocumentUseCase = Depends(get_get_document_use_case),
):
    return await use_case.execute(document_id=document_id)
