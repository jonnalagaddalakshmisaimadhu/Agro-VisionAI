# =============================================================================
# STAGE 1: BUILDER STAGE
# Compiles dependencies in an isolated build environment
# =============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install minimal build tools for C-extensions (psycopg2, ujson, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and compile dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt \
    && pip install --no-cache-dir --prefix=/install xgboost prometheus-client psutil

# =============================================================================
# STAGE 2: PRODUCTION RUNTIME STAGE
# Minimal, secure, non-root runtime (<180MB footprint)
# =============================================================================
FROM python:3.11-slim AS runner

# Set secure production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Install runtime libraries only (e.g., libpq for PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user (CIS Security Compliance)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source code
COPY . /app

# Create necessary upload/cache directories and grant non-root permissions
RUN mkdir -p /app/uploads /app/models && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Container Healthcheck (Kubernetes & Docker automated probes)
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Start Uvicorn production server with 4 concurrent workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-level", "info"]
