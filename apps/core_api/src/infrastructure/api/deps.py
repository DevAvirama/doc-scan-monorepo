from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.use_cases.get_document import GetDocumentUseCase, ListDocumentsUseCase
from src.application.use_cases.scan_document import ScanDocumentUseCase
from src.core.config import settings
from src.domain.ports.cv_client import ICvServiceClient
from src.domain.ports.document_repository import IDocumentRepository
from src.infrastructure.database.session import async_session_factory
from src.infrastructure.external.cv_client import HttpCvServiceClient
from src.infrastructure.repositories.document_repository import SQLAlchemyDocumentRepository


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


def get_document_repository(session: AsyncSession = Depends(get_db_session)) -> IDocumentRepository:
    return SQLAlchemyDocumentRepository(session)


def get_cv_client() -> ICvServiceClient:
    return HttpCvServiceClient(base_url=settings.cv_service_url)


def get_scan_document_use_case(
    repository: IDocumentRepository = Depends(get_document_repository),
    cv_client: ICvServiceClient = Depends(get_cv_client),
) -> ScanDocumentUseCase:
    return ScanDocumentUseCase(repository=repository, cv_client=cv_client)


def get_get_document_use_case(
    repository: IDocumentRepository = Depends(get_document_repository),
) -> GetDocumentUseCase:
    return GetDocumentUseCase(repository=repository)


def get_list_documents_use_case(
    repository: IDocumentRepository = Depends(get_document_repository),
) -> ListDocumentsUseCase:
    return ListDocumentsUseCase(repository=repository)
