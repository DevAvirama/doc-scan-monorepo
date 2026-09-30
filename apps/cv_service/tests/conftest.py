from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from src.api.deps import get_document_extractor
from src.domain.schemas import DocumentType, ExtractedData, ReceiptItem
from src.main import app
from src.services.extractor import DocumentExtractorService


class MockDocumentExtractorService(DocumentExtractorService):
    def __init__(self):
        # No requiere API Key real para tests
        super().__init__(api_key="mock_key_for_testing")

    def extract(self, image_bytes: bytes) -> ExtractedData:
        return ExtractedData(
            merchant_name="Comercio de Prueba S.A.S.",
            document_type=DocumentType.RECEIPT,
            tax_id="900.123.456-7",
            date="2026-09-29",
            currency="COP",
            total_amount=Decimal("45000.00"),
            tax_amount=Decimal("7185.00"),
            items=[
                ReceiptItem(
                    description="Producto Test A",
                    quantity=1.0,
                    unit_price=Decimal("45000.00"),
                    total_price=Decimal("45000.00"),
                )
            ],
            confidence_score=0.98,
        )


@pytest.fixture
def client():
    # Inyectamos el mock reemplazando la dependencia real
    mock_extractor = MockDocumentExtractorService()
    app.dependency_overrides[get_document_extractor] = lambda: mock_extractor

    with TestClient(app) as test_client:
        yield test_client

    # Limpieza al finalizar los tests
    app.dependency_overrides.clear()
