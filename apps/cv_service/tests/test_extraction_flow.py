import cv2
import numpy as np


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "cv_service"}


def test_extract_valid_sharp_receipt(client):
    # Generar imagen nítida sintética en memoria
    canvas = np.zeros((800, 800, 3), dtype=np.uint8)
    cv2.putText(
        canvas,
        "FACTURA DE VENTA #001",
        (60, 200),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        (255, 255, 255),
        2,
    )
    cv2.putText(canvas, "TOTAL: .000", (60, 400), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
    _, buffer = cv2.imencode(".jpg", canvas)

    response = client.post(
        "/api/v1/extract", files={"file": ("recibo_nitido.jpg", buffer.tobytes(), "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["quality_metrics"]["is_blurry"] is False
    assert data["extracted_data"]["merchant_name"] == "Comercio de Prueba S.A.S."
    assert float(data["extracted_data"]["total_amount"]) == 45000.00


def test_reject_blurry_receipt(client):
    # Generar imagen severamente borrosa
    canvas = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.putText(
        canvas, "TEXTO ILEGIBLE", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2
    )
    blurred = cv2.GaussianBlur(canvas, (65, 65), 0)
    _, buffer = cv2.imencode(".jpg", blurred)

    response = client.post(
        "/api/v1/extract", files={"file": ("recibo_borroso.jpg", buffer.tobytes(), "image/jpeg")}
    )

    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "IMAGE_TOO_BLURRY"
    assert "blur_score" in data


def test_reject_unsupported_mime_type(client):
    response = client.post(
        "/api/v1/extract", files={"file": ("documento.pdf", b"%PDF-1.4...", "application/pdf")}
    )

    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "INVALID_FILE_TYPE"
