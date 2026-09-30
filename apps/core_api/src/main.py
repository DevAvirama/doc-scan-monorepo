from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.domain.exceptions import DocumentNotFoundError, DomainError, VisionServiceError
from src.infrastructure.api.exception_handlers import (
    document_not_found_handler,
    domain_error_handler,
    vision_service_error_handler,
)
from src.infrastructure.api.routes import router as documents_router
from src.infrastructure.database.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="Document Scanner Core API",
    version="0.1.0",
    description="Servicio central de gestión documental, persistencia relacional y orquestación de negocio.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(DocumentNotFoundError, document_not_found_handler)
app.add_exception_handler(DomainError, domain_error_handler)
app.add_exception_handler(VisionServiceError, vision_service_error_handler)

app.include_router(documents_router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "core_api"}
