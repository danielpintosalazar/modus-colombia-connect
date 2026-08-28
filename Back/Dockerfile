# Contexto de build: raíz del repo (ver docker-compose.yml) para poder incluir data/.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY Back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Back/app ./app
COPY Back/scripts ./scripts
# app/api/zonas.py resuelve los datos de demo en /data/mock/ cuando corre en /app.
COPY data /data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
