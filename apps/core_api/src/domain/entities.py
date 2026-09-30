from datetime import UTC, date, datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class DocumentStatus(StrEnum):
    PROCESSED = "PROCESSED"
    REVISED = "REVISED"
    ARCHIVED = "ARCHIVED"


class DocumentType(StrEnum):
    RECEIPT = "RECEIPT"
    INVOICE = "INVOICE"
    TICKET = "TICKET"
    UNKNOWN = "UNKNOWN"


class DocumentItem(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID = Field(default_factory=uuid4)
    description: str = Field(..., min_length=1)
    quantity: Decimal = Field(default=Decimal("1.000"), gt=Decimal("0"))
    unit_price: Decimal = Field(..., ge=Decimal("0"))
    total_price: Decimal = Field(..., ge=Decimal("0"))


class Document(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID = Field(default_factory=uuid4)
    merchant_name: str = Field(..., min_length=1)
    document_type: DocumentType = Field(default=DocumentType.RECEIPT)
    tax_id: str | None = Field(default=None)
    document_date: date | None = Field(default=None)
    currency: str = Field(default="COP", min_length=3, max_length=3)
    total_amount: Decimal = Field(..., ge=Decimal("0"))
    tax_amount: Decimal | None = Field(default=None, ge=Decimal("0"))
    confidence_score: Decimal = Field(default=Decimal("1.00"), ge=Decimal("0"), le=Decimal("1.00"))
    blur_score: Decimal | None = Field(default=None, ge=Decimal("0"))
    status: DocumentStatus = Field(default=DocumentStatus.PROCESSED)
    items: list[DocumentItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def validate_totals(self) -> bool:
        """Verifica la consistencia entre la suma de ítems y el total declarado."""
        if not self.items:
            return True
        sum_items = sum(item.total_price for item in self.items)
        # Margen de tolerancia de 0.05 para redondeos de IVA
        return abs(sum_items - self.total_amount) <= Decimal("0.05")
