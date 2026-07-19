# ─────────────────────────────────────────────
# Stage 1: Builder – install Python dependencies
# ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build tools needed for some C-extension packages (psycopg2-binary, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into a dedicated prefix so we can copy only the venv later
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ─────────────────────────────────────────────
# Stage 2: Runtime – lean production image
# ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime library for PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/

# Local storage volume mount point
RUN mkdir -p ./db ./local_storage

# Expose FastAPI port
EXPOSE 8000

# Health-check so Docker Compose knows when the API is ready
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

# Start Uvicorn (reads PORT / DEBUG from environment)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
