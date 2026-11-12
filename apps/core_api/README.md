# 🏛️ Core API — Dominio, Persistencia y Orquestación

API central de negocio del monorepositorio **DocScan**, encargada del ciclo de vida de los comprobantes y facturas, persistencia relacional transaccional en PostgreSQL (Supabase) y orquestación con el microservicio de visión por computador (`cv_service`).

> 📖 **Especificación Técnica Completa:** Consulta los detalles de arquitectura y contratos en [SPEC-002: Core API](../../docs/specs/02_core_api_spec.md).

---

## 🏗️ Arquitectura Limpia (Clean Architecture)

El código sigue estrictamente los principios de **Arquitectura Limpia / Puertos y Adaptadores**:

```text
apps/core_api/src/
├── domain/                  # Entidades, Value Objects e interfaces de puertos (DIP)
│   ├── entities.py          # Modelos puros del negocio (Document, DocumentItem)
│   └── ports/               # Interfaces abstractas (IDocumentRepository, ICVClient)
├── application/             # Casos de uso y DTOs de aplicación
│   └── use_cases/           # Orquestación de escaneo (ScanDocumentUseCase, GetDocumentUseCase)
├── infrastructure/          # Adaptadores y detalles tecnológicos concretos
│   ├── database/            # Conexión asíncrona a PostgreSQL con SQLAlchemy y asyncpg
│   ├── repositories/        # Implementación concreta del repositorio de documentos
│   ├── external/            # Cliente HTTP (httpx) para comunicar con cv_service
│   └── api/                 # Controladores y routers de FastAPI
├── core/                    # Configuración de entorno y loggers
└── main.py                  # Fábrica de aplicación FastAPI y ciclo de vida (Lifespan)
```

---

## 🛠️ Stack Tecnológico

* **Lenguaje:** Python 3.11+
* **Framework Web:** FastAPI (asíncrono)
* **Servidor ASGI:** Uvicorn
* **ORM & Base de Datos:** SQLAlchemy 2.0 (AsyncIO) + `asyncpg` / PostgreSQL (Supabase)
* **Cliente HTTP:** HTTPX
* **Validación de Datos:** Pydantic v2 & Pydantic Settings
* **Gestor de Dependencias:** [uv](https://docs.astral.sh/uv/)

---

## 📋 Endpoints Principales

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/scan` | Recibe imagen (`multipart/form-data`), orquesta extracción con `cv_service` y persiste en transacción atómica |
| `GET` | `/api/v1/documents` | Consulta paginada de documentos registrados (`limit`, `offset`) |
| `GET` | `/api/v1/documents/{id}` | Retorna el detalle del documento junto a sus ítems asociados |
| `GET` | `/api/v1/health` | Verificación de salud y conectividad del servicio |

---

## ⚙️ Variables de Entorno

Configura las variables en un archivo `.env` tomando como base la raíz del proyecto:

```env
PORT=8000
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/docscan
CV_SERVICE_URL=http://localhost:8001/api/v1
```

---

## 🚀 Puesta en Marcha

### Opción 1: Ejecución local con `uv`

1. **Instalar dependencias y sincronizar entorno virtual:**
   ```bash
   uv sync
   ```

2. **Iniciar servidor en modo desarrollo (Hot Reload):**
   ```bash
   uv run uvicorn src.main:app --reload --port 8000 --host 0.0.0.0
   ```

3. **Ejecutar pruebas unitarias e integración:**
   ```bash
   uv run pytest
   ```

---

### Opción 2: Contenedor Docker

1. **Construir la imagen:**
   ```bash
   docker build -t docscan-core-api -f Dockerfile .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -p 8000:8000 --env-file ../../.env docscan-core-api
   ```

---

### Opción 3: Orquestación con Docker Compose (desde la raíz)

Desde la raíz del monorepositorio:
```bash
docker compose up --build core_api
```
