# ==========================================
# Etapa 1: Builder (Resolución limpia con uv)
# ==========================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Instalar uv para gestión reproducible de dependencias
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Indicar a uv que instale directamente en /opt/venv
ENV UV_PROJECT_ENVIRONMENT="/opt/venv" \
    UV_COMPILE_BYTECODE=1

# Copiar manifiesto e instalar dependencias directamente en /opt/venv
COPY pyproject.toml uv.lock* README.md ./
RUN uv sync --no-dev --no-install-project || uv sync --no-dev

# ==========================================
# Etapa 2: Runner (Entorno seguro de ejecución)
# ==========================================
FROM python:3.11-slim AS runner

# Hardening de variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000

WORKDIR /app

# Crear usuario de sistema sin privilegios de root (UID 10001)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false -m appuser

# Copiar el entorno virtual completo desde la etapa builder
COPY --from=builder /opt/venv /opt/venv

# Copiar código fuente y asegurar propiedad de archivos
COPY src/ /app/src/
RUN chown -R appuser:appgroup /app /opt/venv

# Cambiar contexto al usuario no privilegiado
USER appuser

EXPOSE 8000

# Healthcheck interno del contenedor
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen(\x27http://localhost:8000/api/v1/health\x27)" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
