from uuid import uuid4

from httpx import AsyncClient

from src.infrastructure.api.deps import get_cv_client
from src.main import app
from tests.conftest import MockCvServiceClient

FAKE_IMAGE = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"0" * 256


async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "core_api"}


async def test_scan_document_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/documents/scan", files={"file": ("recibo_valido.jpg", FAKE_IMAGE, "image/jpeg")}
    )
    assert response.status_code == 201
    data = response.json()

    assert data["merchant_name"] == "Almacén Éxito Popayán"
    assert float(data["total_amount"]) == 58500.00
    assert data["document_type"] == "RECEIPT"
    assert len(data["items"]) == 2
    assert data["items"][0]["description"] == "Café Sello Rojo 500g"


async def test_get_document_by_id_with_items(client: AsyncClient):
    # 1. Crear documento mediante el endpoint de escaneo
    create_res = await client.post(
        "/api/v1/documents/scan", files={"file": ("factura.jpg", FAKE_IMAGE, "image/jpeg")}
    )
    doc_id = create_res.json()["id"]

    # 2. Consultar el documento por ID
    get_res = await client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    doc_data = get_res.json()

    assert doc_data["id"] == doc_id
    assert doc_data["merchant_name"] == "Almacén Éxito Popayán"
    assert len(doc_data["items"]) == 2


async def test_get_document_not_found(client: AsyncClient):
    non_existent_id = uuid4()
    response = await client.get(f"/api/v1/documents/{non_existent_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "DOCUMENT_NOT_FOUND"
    assert str(non_existent_id) in data["message"]


async def test_list_documents_pagination(client: AsyncClient):
    # Insertar dos documentos
    await client.post(
        "/api/v1/documents/scan", files={"file": ("doc1.jpg", FAKE_IMAGE, "image/jpeg")}
    )
    await client.post(
        "/api/v1/documents/scan", files={"file": ("doc2.jpg", FAKE_IMAGE, "image/jpeg")}
    )

    response = await client.get("/api/v1/documents?limit=10&offset=0")
    assert response.status_code == 200
    payload = response.json()

    assert payload["total"] == 2
    assert len(payload["items"]) == 2
    assert payload["limit"] == 10
    assert payload["offset"] == 0


async def test_scan_rejects_unsupported_mime(client: AsyncClient):
    response = await client.post(
        "/api/v1/documents/scan", files={"file": ("recibo.pdf", b"%PDF-1.4...", "application/pdf")}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "INVALID_FILE_TYPE"


async def test_scan_propagates_blurry_rejection(client: AsyncClient):
    app.dependency_overrides[get_cv_client] = lambda: MockCvServiceClient(simulate_blurry=True)

    response = await client.post(
        "/api/v1/documents/scan", files={"file": ("borroso.jpg", FAKE_IMAGE, "image/jpeg")}
    )
    assert response.status_code == 422
    assert response.json()["error"] == "VISION_SERVICE_ERROR"


async def test_scan_propagates_vision_service_offline(client: AsyncClient):
    app.dependency_overrides[get_cv_client] = lambda: MockCvServiceClient(simulate_failure=True)

    response = await client.post(
        "/api/v1/documents/scan", files={"file": ("recibo.jpg", FAKE_IMAGE, "image/jpeg")}
    )
    assert response.status_code == 503
    assert response.json()["error"] == "VISION_SERVICE_ERROR"
