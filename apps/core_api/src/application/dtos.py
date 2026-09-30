from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentItemDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal


class DocumentResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_name: str
    document_type: str
    tax_id: str | None
    document_date: date | None
    currency: str
    total_amount: Decimal
    tax_amount: Decimal | None
    confidence_score: Decimal
    blur_score: Decimal | None
    status: str
    items: list[DocumentItemDTO]
    created_at: datetime
    updated_at: datetime


class PaginatedDocumentsDTO(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[DocumentResponseDTO]
