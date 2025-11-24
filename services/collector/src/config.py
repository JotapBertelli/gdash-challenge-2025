import os
from pydantic import BaseModel


class Settings(BaseModel):
    rabbitmq_url: str
    queue_name: str
    latitude: float
    longitude: float
    city: str
    base_url: str


def load_settings() -> Settings:
    return Settings(
        rabbitmq_url="amqp://guest:guest@rabbitmq:5672/",
        queue_name="weather_logs",
        latitude=float(os.getenv("COLLECTOR_LAT", "-23.55")),
        longitude=float(os.getenv("COLLECTOR_LON", "-46.63")),
        city=os.getenv("COLLECTOR_CITY", "São Paulo"),
        base_url=os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast"),
    )

