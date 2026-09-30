from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.domain.exceptions import DocumentNotFoundError, DomainError, VisionServiceError
from src.infrastructure.api.exception_handlers import (
    document_not_found_handler,
    domain_error_handler,
    vision_service_error_handler,
)
from src.infrastructure.api.routes import router
from src.infrastructure.database.session import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización del esquema relacional (modo local/desarrollo)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Document Scanner Core API",
    version="0.1.0",
    description="Servicio central de gestión documental, persistencia relacional y orquestación de negocio.",
    lifespan=lifespan,
)

# Registro de excepciones de dominio
app.add_exception_handler(DocumentNotFoundError, document_not_found_handler)
app.add_exception_handler(VisionServiceError, vision_service_error_handler)
app.add_exception_handler(DomainError, domain_error_handler)

# Rutas
app.include_router(router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "core_api"}
