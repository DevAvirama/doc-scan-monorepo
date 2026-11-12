# 👁️ CV Service — Visión por Computador y Extracción Estructurada

Microservicio autónomo de visión artificial y preprocesamiento de imágenes del monorepositorio **DocScan**. Recibe imágenes de recibos o comprobantes de pago, evalúa su nitidez con OpenCV y extrae datos estructurados de alta fidelidad mediante modelos de inferencia visual de Gemini.

> 📖 **Especificación Técnica Completa:** Consulta los detalles de diseño, algoritmos y esquemas JSON en [SPEC-001: CV Service](../../docs/specs/01_cv_service_spec.md).

---

## 🔬 Pipeline de Procesamiento Visual

```text
[ Imagen Upload ] ──► [ Validación de Tamaño (<=5MB) y MIME ]
                             │
                             ▼
                      [ Preprocesamiento OpenCV ]
                      ├── Redimensionamiento inteligente (max 1920px)
                      └── Detección de borrosidad (Varianza del Laplaciano)
                             │  (Si blur_score < 80.0 ──► 422 Image Too Blurry)
                             ▼
                      [ Inferencia Visual Estructurada (Gemini) ]
                      └── Generación JSON con tipado estricto (Merchant, Total, Tax, Items)
                             │
                             ▼
                      [ 200 OK: Payload estructurado + Métricas de tiempo ]
```

---

## 🛠️ Stack Tecnológico

* **Lenguaje:** Python 3.11+
* **Framework Web:** FastAPI
* **Servidor ASGI:** Uvicorn
* **Visión Artificial:** OpenCV Headless (`opencv-python-headless`) & NumPy
* **IA / Visión Multimodal:** Google GenAI SDK (`google-genai`)
* **Resiliencia:** Tenacity (reintentos exponenciales)
* **Gestor de Paquetes:** [uv](https://docs.astral.sh/uv/)

---

## 📋 Endpoints

| Método | Endpoint | Consumo | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/extract` | `multipart/form-data` | Procesa la imagen, ejecuta control de calidad y extrae el JSON estructurado del documento |
| `GET` | `/api/v1/health` | `application/json` | Healthcheck y estado operativo del servicio |

---

## ⚙️ Variables de Entorno

Configura las variables en tu archivo `.env` o en el entorno:

```env
PORT=8001
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
GEMINI_MODEL=gemini-2.0-flash # o modelo visual configurado
BLUR_THRESHOLD=80.0
```

---

## 🚀 Puesta en Marcha

### Opción 1: Ejecución local con `uv`

1. **Instalar dependencias y sincronizar:**
   ```bash
   uv sync
   ```

2. **Iniciar servidor en modo desarrollo (Hot Reload):**
   ```bash
   uv run uvicorn src.main:app --reload --port 8001 --host 0.0.0.0
   ```

3. **Ejecutar pruebas unitarias:**
   ```bash
   uv run pytest
   ```

---

### Opción 2: Contenedor Docker

1. **Construir la imagen:**
   ```bash
   docker build -t docscan-cv-service -f Dockerfile .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -p 8001:8001 --env-file ../../.env docscan-cv-service
   ```

---

### Opción 3: Orquestación con Docker Compose (desde la raíz)

Desde la raíz del monorepositorio:
```bash
docker compose up --build cv_service
```
