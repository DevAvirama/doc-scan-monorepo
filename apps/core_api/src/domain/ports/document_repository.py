from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from src.domain.entities import Document


class IDocumentRepository(ABC):
    """Puerto de persistencia para el agregado Document."""

    @abstractmethod
    async def save(self, document: Document) -> Document:
        """Persiste atómicamente el documento y sus ítems asociados."""
        raise NotImplementedError

    @abstractmethod
    async def get_by_id(self, document_id: UUID) -> Optional[Document]:
        """Recupera un documento con sus ítems en una sola consulta relacional."""
        raise NotImplementedError

    @abstractmethod
    async def list_documents(self, limit: int = 20, offset: int = 0) -> Tuple[List[Document], int]:
        """Obtiene un listado paginado y el total de registros existentes."""
        raise NotImplementedError
