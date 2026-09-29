from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DocumentType(str, Enum):
    RECEIPT = "RECEIPT"
    INVOICE = "INVOICE"
    TICKET = "TICKET"
    UNKNOWN = "UNKNOWN"


class QualityMetrics(BaseModel):
    model_config = ConfigDict(frozen=True)

    is_blurry: bool = Field(
        ...,
        description="Indica si la imagen no cumple con el umbral de nitidez"
    )
    blur_score: float = Field(
        ...,
        ge=0.0,
        description="Varianza del Laplaciano calculada por el procesador visual"
    )


class ReceiptItem(BaseModel):
    model_config = ConfigDict(frozen=True)

    description: str = Field(..., min_length=1, description="Descripción del producto")
    quantity: float = Field(default=1.0, gt=0, description="Cantidad de unidades")
    unit_price: Decimal = Field(..., ge=0, description="Precio unitario")
    total_price: Decimal = Field(..., ge=0, description="Precio total del ítem")


class ExtractedData(BaseModel):
    merchant_name: str = Field(..., min_length=1, description="Nombre del comercio o emisor")
    document_type: DocumentType = Field(default=DocumentType.RECEIPT)
    tax_id: Optional[str] = Field(default=None, description="Identificador tributario (NIT/RUT)")
    date: Optional[str] = Field(default=None, description="Fecha detectada en formato YYYY-MM-DD")
    currency: str = Field(default="COP", min_length=3, max_length=3, description="Código ISO 4217")
    total_amount: Decimal = Field(..., ge=0, description="Importe total de la compra")
    tax_amount: Optional[Decimal] = Field(default=None, ge=0, description="Total de impuestos discriminados")
    items: List[ReceiptItem] = Field(default_factory=list, description="Listado detallado de ítems")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Puntuación de confianza (0.0 a 1.0)")


class ExtractionResponse(BaseModel):
    status: str = Field(default="success")
    processing_time_ms: float = Field(..., ge=0.0, description="Tiempo total de procesamiento en milisegundos")
    quality_metrics: QualityMetrics
    extracted_data: Optional[ExtractedData] = None
