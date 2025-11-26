import os
from pydantic import BaseModel


class Settings(BaseModel):
    rabbitmq_url: str
    queue_name: str
    latitude: float
    longitude: float
    city: str
    openweather_api_key: str
    openweather_base_url: str


def load_settings() -> Settings:
    return Settings(
        rabbitmq_url="amqp://guest:guest@rabbitmq:5672/",
        queue_name="weather_logs",
        latitude=float(os.getenv("COLLECTOR_LAT", "-21.4178")),
        longitude=float(os.getenv("COLLECTOR_LON", "-50.0769")),
        city=os.getenv("COLLECTOR_CITY", "Penápolis"),
        openweather_api_key=os.getenv("OPENWEATHER_API_KEY", ""),
        openweather_base_url=os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5/weather"),
    )
