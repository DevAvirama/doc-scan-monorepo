class DomainError(Exception):
    """Excepción base para violaciones de reglas de negocio."""


class DocumentNotFoundError(DomainError):
    """Lanzada cuando un documento solicitado no existe en el sistema."""

    def __init__(self, document_id: str):
        super().__init__(f"Documento con ID {document_id} no encontrado.")
        self.document_id = document_id


class VisionServiceError(DomainError):
    """Lanzada cuando la comunicación o procesamiento con cv_service falla."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


class InvalidDocumentDataError(DomainError):
    """Lanzada cuando los datos del documento violan invariantes financieras."""
