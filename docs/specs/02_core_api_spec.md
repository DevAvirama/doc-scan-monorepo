# SPEC-002: Core API - Gestión, Persistencia y Dominio de Documentos

## 1. Contexto y Alcance
- **Propósito:** API principal de negocio encargada del ciclo de vida de los recibos y facturas, persistencia transaccional en PostgreSQL (Supabase) y orquestación con el microservicio de visión.
- **Fuera de alcance (Out of Scope):**
  - Procesamiento pesado de imágenes en este proceso (delegado exclusivamente a `cv_service`).
  - Pasarelas de pago o facturación electrónica hacia la DIAN (fase posterior).

## 2. Modelo de Datos Relacional (PostgreSQL / Supabase)

### Tabla: `documents`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `merchant_name`: VARCHAR(255) NOT NULL
- `document_type`: VARCHAR(50) NOT NULL DEFAULT RECEIPT
- `tax_id`: VARCHAR(50) NULL
- `document_date`: DATE NULL
- `currency`: VARCHAR(3) NOT NULL DEFAULT COP
- `total_amount`: NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0)
- `tax_amount`: NUMERIC(14, 2) NULL CHECK (tax_amount >= 0)
- `confidence_score`: NUMERIC(3, 2) NOT NULL DEFAULT 1.00
- `blur_score`: NUMERIC(6, 2) NULL
- `status`: VARCHAR(30) NOT NULL DEFAULT PROCESSED -- (PROCESSED, REVISED, ARCHIVED)
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT timezone(utc, now())
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT timezone(utc, now())

### Tabla: `document_items`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `document_id`: UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE
- `description`: VARCHAR(255) NOT NULL
- `quantity`: NUMERIC(10, 3) NOT NULL DEFAULT 1.000 CHECK (quantity > 0)
- `unit_price`: NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0)
- `total_price`: NUMERIC(14, 2) NOT NULL CHECK (total_price >= 0)
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT timezone(utc, now())

**Índices requeridos:**
- `CREATE INDEX idx_documents_created_at ON documents(created_at DESC);`
- `CREATE INDEX idx_document_items_document_id ON document_items(document_id);`

## 3. Contratos de Interfaz (REST API)

### Endpoint 1: POST /api/v1/documents/scan
- **Input:** `multipart/form-data` con archivo binario `file`.
- **Flujo:**
  1. Envía la imagen al cliente HTTP de `cv_service` (`/api/v1/extract`).
  2. Si `cv_service` responde 422 (borrosa) o 400 (inválida), propaga el error con formato estandarizado.
  3. Abre una transacción atómica en PostgreSQL:
     - Inserta el registro en `documents`.
     - Inserta en lote (*bulk*) los ítems en `document_items`.
  4. Retorna el documento creado junto con sus ítems calculados.
- **Respuesta 201 Created:** Objeto completo del documento persistido.

### Endpoint 2: GET /api/v1/documents
- **Query Params:** `limit` (default 20, max 100), `offset` (default 0).
- **Respuesta 200 OK:** Paginación con metadata (`total`, `items`).

### Endpoint 3: GET /api/v1/documents/{id}
- **Respuesta 200 OK:** Detalle del documento incluyendo la lista de ítems mediante una consulta JOIN optimizada (sin N+1).
- **Respuesta 404 Not Found:** `{"error": "DOCUMENT_NOT_FOUND"}`.

## 4. Reglas de Arquitectura y Puertos (Clean Architecture)
apps/core_api/src/
├── domain/                  # Lógica pura: Entidades, Value Objects, Excepciones
│   ├── entities.py
│   └── ports/               # Interfaces / Contratos (DIP)
│       ├── document_repository.py
│       └── cv_client.py
├── application/             # Casos de uso / Orquestación
│   ├── use_cases/
│   │   ├── scan_document.py
│   │   └── get_document.py
│   └── dtos.py
└── infrastructure/          # Detalles externos
├── database/            # Conexión Supabase (SQLAlchemy Async / asyncpg)
├── repositories/        # Implementación concreta de IDocumentRepository
├── external/            # Adaptador HTTP para comunicar con cv_service
└── api/                 # Endpoints FastAPI y schemas de transporte
