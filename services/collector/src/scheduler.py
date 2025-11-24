import asyncio
import json
import os
from datetime import datetime, timezone

import httpx
import pika
import schedule

from .config import load_settings


def publish_to_queue(message: str):
    settings = load_settings()
    try:
        connection = pika.BlockingConnection(
            pika.URLParameters(settings.rabbitmq_url)
        )
        channel = connection.channel()
        channel.queue_declare(queue=settings.queue_name, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=settings.queue_name,
            body=message,
            properties=pika.BasicProperties(delivery_mode=2),
        )
        connection.close()
        print(f"✅ Mensagem publicada na fila: {message[:50]}...")
    except Exception as e:
        print(f"❌ Erro ao publicar na fila: {e}")


async def fetch_weather():
    settings = load_settings()
    params = {
        "latitude": settings.latitude,
        "longitude": settings.longitude,
        "hourly": ["temperature_2m", "relativehumidity_2m", "windspeed_10m"],
        "current_weather": True,
    }
    async with httpx.AsyncClient(base_url=settings.base_url, timeout=10) as client:
        response = await client.get("", params=params)
        response.raise_for_status()
        payload = response.json()
        message = {
            "city": settings.city,
            "ts": datetime.now(timezone.utc).isoformat(),
            "temperature": payload["current_weather"]["temperature"],
            "windspeed": payload["current_weather"]["windspeed"],
            "humidity": payload["hourly"]["relativehumidity_2m"][0],
        }
        return json.dumps(message)


def run_scheduler():
    async def job():
        try:
            message = await fetch_weather()
            publish_to_queue(message)
        except Exception as e:
            print(f"❌ Erro no job: {e}")

    # Executa a cada 30 minutos (ou conforme COLLECTOR_INTERVAL_CRON)
    interval = int(os.getenv("COLLECTOR_INTERVAL_MINUTES", "30"))
    schedule.every(interval).minutes.do(lambda: asyncio.run(job()))

    # Executa imediatamente na primeira vez
    asyncio.run(job())

    print(f"🔄 Coletor iniciado. Intervalo: {interval} minutos")
    while True:
        schedule.run_pending()
        schedule.idle_seconds()


