from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entities import Document
from src.domain.ports.document_repository import IDocumentRepository
from src.infrastructure.database.models import DocumentModel
from src.infrastructure.repositories.mappers import (
    document_entity_to_model,
    document_model_to_entity,
)


class SQLAlchemyDocumentRepository(IDocumentRepository):
    """Implementación de persistencia asíncrona sobre PostgreSQL / SQLite."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def save(self, document: Document) -> Document:
        doc_model = document_entity_to_model(document)
        self._session.add(doc_model)
        await self._session.flush()
        return document_model_to_entity(doc_model)

    async def get_by_id(self, document_id: UUID) -> Optional[Document]:
        query = (
            select(DocumentModel)
            .options(selectinload(DocumentModel.items))
            .where(DocumentModel.id == document_id)
        )
        result = await self._session.execute(query)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return document_model_to_entity(model)

    async def list_documents(self, limit: int = 20, offset: int = 0) -> Tuple[List[Document], int]:
        # Conteo total en base de datos
        count_query = select(func.count()).select_from(DocumentModel)
        count_result = await self._session.execute(count_query)
        total = count_result.scalar_one()

        # Consulta paginada con carga ansiosa (evita N+1)
        data_query = (
            select(DocumentModel)
            .options(selectinload(DocumentModel.items))
            .order_by(DocumentModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        data_result = await self._session.execute(data_query)
        models = data_result.scalars().all()

        entities = [document_model_to_entity(m) for m in models]
        return entities, total
