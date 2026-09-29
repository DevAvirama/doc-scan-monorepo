from typing import Any, AsyncGenerator, Dict
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.domain.exceptions import VisionServiceError
from src.domain.ports.cv_client import ICvServiceClient
from src.infrastructure.api.deps import get_cv_client, get_db_session
from src.infrastructure.database.session import Base
from src.main import app


class MockCvServiceClient(ICvServiceClient):
    def __init__(self, simulate_blurry: bool = False, simulate_failure: bool = False):
        self.simulate_blurry = simulate_blurry
        self.simulate_failure = simulate_failure

    async def extract_from_image(
        self,
        image_bytes: bytes,
        filename: str = "receipt.jpg",
        content_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        if self.simulate_failure:
            raise VisionServiceError("Fallo de red hacia el microservicio.", status_code=503)

        if self.simulate_blurry:
            raise VisionServiceError(
                "La imagen no tiene nitidez suficiente. (Puntuación de nitidez: 34.2)",
                status_code=422
            )

        return {
            "status": "success",
            "quality_metrics": {"is_blurry": False, "blur_score": 142.8},
            "extracted_data": {
                "merchant_name": "Almacén Éxito Popayán",
                "document_type": "RECEIPT",
                "tax_id": "890.900.608-9",
                "date": "2026-09-29",
                "currency": "COP",
                "total_amount": 58500.00,
                "tax_amount": 9340.00,
                "items": [
                    {
                        "description": "Café Sello Rojo 500g",
                        "quantity": 2.0,
                        "unit_price": 18000.00,
                        "total_price": 36000.00
                    },
                    {
                        "description": "Leche Deslactosada 1L",
                        "quantity": 3.0,
                        "unit_price": 7500.00,
                        "total_price": 22500.00
                    }
                ],
                "confidence_score": 0.98
            }
        }


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
def mock_cv_client() -> MockCvServiceClient:
    return MockCvServiceClient()


@pytest.fixture
async def client(db_session: AsyncSession, mock_cv_client: MockCvServiceClient) -> AsyncGenerator[AsyncClient, None]:
    async def override_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_cv_client] = lambda: mock_cv_client

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_http_client:
        yield async_http_client

    app.dependency_overrides.clear()
