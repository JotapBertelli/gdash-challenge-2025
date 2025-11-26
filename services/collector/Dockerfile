FROM python:3.11-alpine
WORKDIR /app

# Instala dependências de build necessárias para alguns pacotes Python
RUN apk add --no-cache gcc musl-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
CMD ["python", "-u", "-m", "src"]


