# SPEC-001: Microservicio de Procesamiento y Extracción de Documentos (CV Service)

## 1. Contexto y Objetivo
- **Propósito:** Servicio HTTP autónomo que recibe imágenes de documentos o recibos de compra, aplica preprocesamiento visual y extrae datos estructurados mediante visión e inferencia.
- **Fuera de alcance (Out of Scope):**
  - Autenticación de usuarios o gestión de sesiones (eso le corresponde a \`core_api\`).
  - Persistencia permanente en base de datos.
  - Almacenamiento a largo plazo de las imágenes (las imágenes se procesan en memoria o en almacenamiento volátil y se descartan).

## 2. Contratos de Interfaz (REST API)

### POST /api/v1/extract
- **Consumo:** \`multipart/form-data\`
- **Parámetros:**
  - \`file\`: Archivo binario de imagen (MIME types permitidos: \`image/jpeg\`, \`image/png\`, \`image/webp\`).
  - Restricción de tamaño: Máximo 5 MB.
- **Respuesta 200 OK (Content-Type: application/json):**
\`\`\`json
{
  "status": "success",
  "processing_time_ms": 450,
  "quality_metrics": {
    "is_blurry": false,
    "blur_score": 145.2
  },
  "extracted_data": {
    "merchant_name": "Supermercado Éxito",
    "document_type": "RECEIPT",
    "tax_id": "890.900.608-9",
    "date": "2026-09-28",
    "currency": "COP",
    "total_amount": 154200.00,
    "tax_amount": 24600.00,
    "items": [
      {
        "description": "Café Sello Rojo 500g",
        "quantity": 2.0,
        "unit_price": 18000.00,
        "total_price": 36000.00
      }
    ],
    "confidence_score": 0.94
  }
}
\`\`\`
- **Respuestas de Error:**
  - \`400 Bad Request\`: Tipo de archivo no soportado o archivo dañado (\`{"error": "INVALID_FILE_TYPE"}\`).
  - \`413 Payload Too Large\`: Archivo supera los 5 MB (\`{"error": "FILE_TOO_LARGE"}\`).
  - \`422 Unprocessable Content\`: Imagen con nitidez insuficiente para extracción fiable (\`{"error": "IMAGE_TOO_BLURRY", "blur_score": 32.1}\`).
  - \`502 Bad Gateway\`: Fallo en la comunicación con la API de inferencia visual (\`{"error": "VISION_PROVIDER_ERROR"}\`).

## 3. Pipeline de Procesamiento (Reglas Internas)
1. **Validación de Cabecera y Tamaño:** Filtrado rápido de tamaño y MIME type antes de cargar el buffer completo.
2. **Preprocesamiento con OpenCV:**
   - Detección de borrosidad mediante la varianza del Laplaciano (\`cv2.Laplacian\`). Si la varianza es menor a un umbral predefinido (ej. 80.0), se rechaza con error 422 para no gastar cuota de API.
   - Normalización de dimensiones: Si la imagen excede 1920px en su lado más largo, redimensionar manteniendo el ratio de aspecto.
3. **Inferencia Visual Estructurada (Gemini API):**
   - Invocación con esquema de respuesta forzado (*Structured Outputs*) garantizando los tipos de datos numéricos y de fecha.
4. **Métricas y Trazabilidad:**
   - Cada respuesta debe calcular el tiempo total de procesamiento en milisegundos.

## 4. Arquitectura de Código (\`apps/cv_service\`)
- \`src/domain/\`: Esquemas Pydantic puros (modelos de datos extraídos, métricas). Sin dependencias de FastAPI ni OpenCV.
- \`src/services/\`:
  - \`image_processor.py\`: Lógica de OpenCV (blur detection, resize).
  - \`extractor.py\`: Adaptador para interactuar con el modelo de visión.
- \`src/api/\`: Rutas de FastAPI, validadores de subida y manejo unificado de excepciones.
