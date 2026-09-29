from datetime import date
from decimal import Decimal
from typing import Optional

from src.domain.entities import Document, DocumentItem, DocumentType
from src.domain.exceptions import VisionServiceError
from src.domain.ports.cv_client import ICvServiceClient
from src.domain.ports.document_repository import IDocumentRepository


class ScanDocumentUseCase:
    """Orquesta la extracción visual y persistencia atómica del documento."""

    def __init__(self, repository: IDocumentRepository, cv_client: ICvServiceClient):
        self.repository = repository
        self.cv_client = cv_client

    async def execute(
        self,
        image_bytes: bytes,
        filename: str = "receipt.jpg",
        content_type: str = "image/jpeg"
    ) -> Document:
        # 1. Delegar extracción estructurada al microservicio de visión
        payload = await self.cv_client.extract_from_image(
            image_bytes=image_bytes,
            filename=filename,
            content_type=content_type
        )

        extracted = payload["extracted_data"]
        quality_metrics = payload.get("quality_metrics", {})

        # 2. Construir ítems de dominio con tipos estrictos
        items = [
            DocumentItem(
                description=item["description"],
                quantity=Decimal(str(item.get("quantity", 1.0))),
                unit_price=Decimal(str(item["unit_price"])),
                total_price=Decimal(str(item["total_price"]))
            )
            for item in extracted.get("items", [])
        ]

        # 3. Parsear fecha si fue detectada
        parsed_date: Optional[date] = None
        if extracted.get("date"):
            try:
                parsed_date = date.fromisoformat(extracted["date"])
            except (ValueError, TypeError):
                parsed_date = None

        # 4. Instanciar agregado de dominio con validaciones invariantes
        doc_type_raw = extracted.get("document_type", "RECEIPT")
        try:
            doc_type = DocumentType(doc_type_raw)
        except ValueError:
            doc_type = DocumentType.UNKNOWN

        blur_val = quality_metrics.get("blur_score")
        blur_score = Decimal(str(blur_val)) if blur_val is not None else None

        document = Document(
            merchant_name=extracted["merchant_name"],
            document_type=doc_type,
            tax_id=extracted.get("tax_id"),
            document_date=parsed_date,
            currency=extracted.get("currency", "COP"),
            total_amount=Decimal(str(extracted["total_amount"])),
            tax_amount=Decimal(str(extracted["tax_amount"])) if extracted.get("tax_amount") is not None else None,
            confidence_score=Decimal(str(extracted.get("confidence_score", 1.0))),
            blur_score=blur_score,
            items=items
        )

        # 5. Persistir atómicamente a través del puerto de repositorio
        saved_document = await self.repository.save(document)
        return saved_document
