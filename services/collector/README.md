# Collector Python - Coletor de Dados Climáticos

Serviço Python responsável por coletar dados climáticos da API Open-Meteo e publicar na fila RabbitMQ para processamento assíncrono.

## 🎯 Responsabilidades

- **Coleta Periódica:** Consulta a API Open-Meteo em intervalos configuráveis
- **Normalização:** Extrai e formata dados relevantes (temperatura, umidade, vento)
- **Publicação:** Envia dados para a fila RabbitMQ em formato JSON
- **Agendamento:** Usa a biblioteca `schedule` para execução periódica

## 📁 Estrutura

```
src/
├── __main__.py        # Entry point
├── scheduler.py       # Lógica de agendamento e coleta
└── config.py          # Configurações e settings
```

## 🔧 Tecnologias

- **Python 3.11+** - Linguagem
- **httpx** - Cliente HTTP assíncrono
- **pika** - Cliente RabbitMQ
- **pydantic** - Validação de configurações
- **schedule** - Agendamento de tarefas

## 🚀 Executando

### Desenvolvimento Local

```bash
pip install -r requirements.txt
python -m src
```

### Docker

```bash
docker build -t gdash-collector .
docker run --env-file ../.env gdash-collector
```

## ⚙️ Configuração

Variáveis de ambiente (veja `.env.example`):

- `COLLECTOR_CITY` - Nome da cidade (padrão: "São Paulo")
- `COLLECTOR_LAT` - Latitude (padrão: -23.55)
- `COLLECTOR_LON` - Longitude (padrão: -46.63)
- `COLLECTOR_INTERVAL_MINUTES` - Intervalo em minutos (padrão: 30)
- `OPEN_METEO_BASE_URL` - URL da API Open-Meteo
- `RABBITMQ_URL` - URL de conexão RabbitMQ
- `RABBITMQ_QUEUE` - Nome da fila (padrão: "weather_logs")

## 📡 API Open-Meteo

O serviço consulta a API Open-Meteo para obter dados climáticos:

**Endpoint:** `https://api.open-meteo.com/v1/forecast`

**Parâmetros:**
- `latitude` - Latitude da localização
- `longitude` - Longitude da localização
- `hourly` - Dados horários (temperature_2m, relativehumidity_2m, windspeed_10m)
- `current_weather` - Dados do clima atual

**Exemplo de resposta:**
```json
{
  "current_weather": {
    "temperature": 25.5,
    "windspeed": 12.3
  },
  "hourly": {
    "relativehumidity_2m": [65.0, 66.0, ...]
  }
}
```

## 📨 Formato da Mensagem

Os dados coletados são publicados na fila RabbitMQ no seguinte formato:

```json
{
  "city": "São Paulo",
  "ts": "2025-11-24T13:00:00.000Z",
  "temperature": 25.5,
  "windspeed": 12.3,
  "humidity": 65.0
}
```

**Campos:**
- `city` - Nome da cidade
- `ts` - Timestamp ISO 8601 (UTC)
- `temperature` - Temperatura em °C
- `windspeed` - Velocidade do vento em km/h
- `humidity` - Umidade relativa em %

## 🔄 Fluxo de Execução

1. **Inicialização:** Carrega configurações do ambiente
2. **Primeira Execução:** Coleta dados imediatamente
3. **Agendamento:** Configura execução periódica (padrão: 30 minutos)
4. **Coleta:** Faz requisição HTTP para Open-Meteo
5. **Normalização:** Extrai e formata dados relevantes
6. **Publicação:** Envia JSON para fila RabbitMQ
7. **Repetição:** Aguarda próximo intervalo

## 📦 Dependências

```txt
httpx==0.27.0          # Cliente HTTP assíncrono
pydantic==2.7.1        # Validação de dados
python-dotenv==1.0.1   # Carregamento de .env
schedule==1.2.1        # Agendamento de tarefas
pika==1.3.2            # Cliente RabbitMQ
```

## 🐛 Tratamento de Erros

- **Erro na API:** Loga erro e continua agendamento
- **Erro no RabbitMQ:** Loga erro e continua agendamento
- **Timeout:** Configurado para 10 segundos na requisição HTTP

## 📝 Logs

O serviço registra:
- ✅ Mensagens publicadas com sucesso
- ❌ Erros de conexão ou processamento
- 🔄 Status de inicialização e intervalo configurado

## 🔧 Desenvolvimento

### Estrutura do Código

**config.py:**
- Define classe `Settings` com Pydantic
- Carrega variáveis de ambiente
- Valida tipos e valores

**scheduler.py:**
- `fetch_weather()` - Função assíncrona de coleta
- `publish_to_queue()` - Publicação no RabbitMQ
- `run_scheduler()` - Loop principal de agendamento

**__main__.py:**
- Entry point que inicia o scheduler

### Testando Localmente

```bash
# Configure as variáveis
export RABBITMQ_URL=amqp://guest:guest@localhost:5672/
export COLLECTOR_CITY="Rio de Janeiro"
export COLLECTOR_LAT=-22.9068
export COLLECTOR_LON=-43.1729

# Execute
python -m src
```

## 🚀 Melhorias Futuras

- [ ] Retry automático em caso de falha
- [ ] Múltiplas localizações simultâneas
- [ ] Métricas de coleta (quantidade, sucesso/falha)
- [ ] Health check endpoint
- [ ] Suporte a outras APIs climáticas


