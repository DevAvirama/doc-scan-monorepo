from src.domain.entities import Document, DocumentItem, DocumentStatus, DocumentType
from src.infrastructure.database.models import DocumentItemModel, DocumentModel


def document_entity_to_model(entity: Document) -> DocumentModel:
    """Convierte una entidad de dominio puro en un modelo ORM persistible."""
    return DocumentModel(
        id=entity.id,
        merchant_name=entity.merchant_name,
        document_type=entity.document_type.value,
        tax_id=entity.tax_id,
        document_date=entity.document_date,
        currency=entity.currency,
        total_amount=entity.total_amount,
        tax_amount=entity.tax_amount,
        confidence_score=entity.confidence_score,
        blur_score=entity.blur_score,
        status=entity.status.value,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        items=[
            DocumentItemModel(
                id=item.id,
                document_id=entity.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
                created_at=entity.created_at,
            )
            for item in entity.items
        ],
    )


def document_model_to_entity(model: DocumentModel) -> Document:
    """Reconstruye la entidad de dominio a partir del registro persistido."""
    items = [
        DocumentItem(
            id=item_model.id,
            description=item_model.description,
            quantity=item_model.quantity,
            unit_price=item_model.unit_price,
            total_price=item_model.total_price,
        )
        for item_model in model.items
    ]

    return Document(
        id=model.id,
        merchant_name=model.merchant_name,
        document_type=DocumentType(model.document_type),
        tax_id=model.tax_id,
        document_date=model.document_date,
        currency=model.currency,
        total_amount=model.total_amount,
        tax_amount=model.tax_amount,
        confidence_score=model.confidence_score,
        blur_score=model.blur_score,
        status=DocumentStatus(model.status),
        items=items,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
