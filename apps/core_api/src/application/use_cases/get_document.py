from typing import List, Tuple
from uuid import UUID

from src.domain.entities import Document
from src.domain.exceptions import DocumentNotFoundError
from src.domain.ports.document_repository import IDocumentRepository


class GetDocumentUseCase:
    """Recupera un documento específico por su identificador UUID."""

    def __init__(self, repository: IDocumentRepository):
        self.repository = repository

    async def execute(self, document_id: UUID) -> Document:
        doc = await self.repository.get_by_id(document_id)
        if doc is None:
            raise DocumentNotFoundError(str(document_id))
        return doc


class ListDocumentsUseCase:
    """Recupera un conjunto paginado de documentos y el total disponible."""

    def __init__(self, repository: IDocumentRepository):
        self.repository = repository

    async def execute(self, limit: int = 20, offset: int = 0) -> Tuple[List[Document], int]:
        return await self.repository.list_documents(limit=limit, offset=offset)
