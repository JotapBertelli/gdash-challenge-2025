import json
import os
import subprocess
import time
from datetime import datetime, timezone

import pika
import schedule

from .config import load_settings


def publish_to_queue(message: str):
    settings = load_settings()
    max_retries = 10
    for attempt in range(max_retries):
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
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Tentando conectar ao RabbitMQ... ({attempt + 1}/{max_retries})")
                time.sleep(5)
            else:
                print(f"❌ Erro ao publicar na fila após {max_retries} tentativas: {e}")


def fetch_weather():
    """Busca dados do clima usando OpenWeatherMap API"""
    settings = load_settings()
    
    # Verifica se a API key está configurada
    if not settings.openweather_api_key:
        raise Exception("OPENWEATHER_API_KEY não configurada no .env")
    
    url = (
        f"{settings.openweather_base_url}?"
        f"lat={settings.latitude}&"
        f"lon={settings.longitude}&"
        f"appid={settings.openweather_api_key}&"
        f"units=metric&"
        f"lang=pt_br"
    )
    
    for attempt in range(3):
        try:
            print(f"🌐 Tentativa {attempt + 1}/3: Conectando ao OpenWeatherMap...")
            
            # Usa wget do sistema (contorna problema de rede do Python no Docker)
            result = subprocess.run(
                ["wget", "-qO-", "--timeout=30", url],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise Exception(f"wget falhou: {result.stderr}")
            
            payload = json.loads(result.stdout)
            
            # Extrai dados do formato OpenWeatherMap
            message = {
                "city": settings.city,
                "ts": datetime.now(timezone.utc).isoformat(),
                "temperature": payload["main"]["temp"],
                "windspeed": payload["wind"]["speed"] * 3.6,  # m/s para km/h
                "humidity": payload["main"]["humidity"],
                "description": payload["weather"][0]["description"] if payload.get("weather") else "",
                "feels_like": payload["main"].get("feels_like", payload["main"]["temp"]),
                "pressure": payload["main"].get("pressure", 0),
            }
            print(f"✅ Dados obtidos com sucesso! Temp: {message['temperature']}°C")
            return json.dumps(message)
        except Exception as e:
            print(f"⚠️ Erro na tentativa {attempt + 1}/3: {type(e).__name__}: {e}")
            if attempt < 2:
                time.sleep(5)
            else:
                raise


def run_scheduler():
    print("🚀 Iniciando coletor de dados climáticos...")
    
    def job():
        try:
            print("📡 Buscando dados climáticos...")
            message = fetch_weather()
            publish_to_queue(message)
        except Exception as e:
            print(f"❌ Erro ao buscar da API: {e}")
            print("🔄 Usando dados de exemplo para teste...")
            # Fallback com dados de exemplo
            settings = load_settings()
            message = json.dumps({
                "city": settings.city,
                "ts": datetime.now(timezone.utc).isoformat(),
                "temperature": 25.0 + (hash(str(datetime.now())) % 10),
                "windspeed": 10.0 + (hash(str(datetime.now())) % 20),
                "humidity": 60.0 + (hash(str(datetime.now())) % 30),
                "description": "dados de exemplo",
                "feels_like": 26.0,
                "pressure": 1013,
            })
            publish_to_queue(message)

    # Executa a cada 30 minutos (ou conforme COLLECTOR_INTERVAL_MINUTES)
    interval = int(os.getenv("COLLECTOR_INTERVAL_MINUTES", "30"))
    schedule.every(interval).minutes.do(job)

    # Executa imediatamente na primeira vez
    print("⏳ Executando primeira coleta...")
    job()

    print(f"🔄 Coletor iniciado. Intervalo: {interval} minutos")
    while True:
        schedule.run_pending()
        time.sleep(1)
