# ==========================================
# Etapa 1: Builder (Compilación y dependencias)
# ==========================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Instalar uv para resolución reproducible de dependencias
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Indicar a uv que instale directamente en /opt/venv
ENV UV_PROJECT_ENVIRONMENT="/opt/venv" \
    UV_COMPILE_BYTECODE=1

# Copiar manifiestos y sincronizar dependencias de producción
COPY pyproject.toml uv.lock* README.md ./
RUN uv sync --no-dev --no-install-project || uv sync --no-dev

# ==========================================
# Etapa 2: Runner (Imagen de producción mínima)
# ==========================================
FROM python:3.11-slim AS runner

# Variables de entorno para hardening de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8001

# Dependencias mínimas de sistema para OpenCV headless y libGL stub
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Crear usuario sin privilegios de root (UID 10001)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false -m appuser

# Copiar el entorno virtual con uvicorn y dependencias completas
COPY --from=builder /opt/venv /opt/venv

# Copiar el código fuente y asignar permisos estrictos
COPY src/ /app/src/
RUN chown -R appuser:appgroup /app /opt/venv

# Cambiar al usuario no privilegiado
USER appuser

EXPOSE 8001

# Healthcheck interno del contenedor
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen(\x27http://localhost:8001/api/v1/health\x27)" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
