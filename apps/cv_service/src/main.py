from fastapi import FastAPI

from src.api.routes import router

app = FastAPI(
    title="Document Scanner CV Service",
    version="0.1.0",
    description="Microservicio de visión artificial para procesamiento y extracción de documentos.",
)

app.include_router(router, prefix="/api/v1")
