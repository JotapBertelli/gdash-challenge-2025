# Worker Go - Processador de Fila

Worker desenvolvido em Go que consome mensagens da fila RabbitMQ, valida os dados e envia para a API NestJS via HTTP.

## 🎯 Responsabilidades

- **Consumo de Fila:** Lê mensagens da fila RabbitMQ de forma contínua
- **Validação:** Verifica estrutura e tipos dos dados recebidos
- **Envio HTTP:** Envia dados validados para a API NestJS
- **Tratamento de Erros:** Implementa retry e nack para mensagens com falha
- **Logging:** Registra operações para debugging

## 📁 Estrutura

```
main.go          # Código principal do worker
go.mod           # Dependências Go
Dockerfile       # Containerização
```

## 🔧 Tecnologias

- **Go 1.22+** - Linguagem
- **github.com/rabbitmq/amqp091-go** - Cliente RabbitMQ
- **encoding/json** - Serialização JSON
- **net/http** - Cliente HTTP

## 🚀 Executando

### Desenvolvimento Local

```bash
go mod download
go run main.go
```

### Build

```bash
go build -o worker main.go
./worker
```

### Docker

```bash
docker build -t gdash-worker .
docker run --env-file ../.env gdash-worker
```

## ⚙️ Configuração

Variáveis de ambiente (veja `.env.example`):

- `RABBITMQ_URL` - URL de conexão RabbitMQ (padrão: `amqp://guest:guest@rabbitmq:5672/`)
- `RABBITMQ_QUEUE` - Nome da fila (padrão: `weather_logs`)
- `API_BASE_URL` - URL base da API NestJS (padrão: `http://api:3000/api`)
- `WORKER_RETRY_MAX` - Máximo de tentativas (não implementado ainda)

## 📨 Formato da Mensagem

O worker espera receber mensagens no seguinte formato JSON:

```json
{
  "city": "São Paulo",
  "ts": "2025-11-24T13:00:00.000Z",
  "temperature": 25.5,
  "windspeed": 12.3,
  "humidity": 65.0
}
```

**Estrutura Go:**
```go
type WeatherPayload struct {
    City        string  `json:"city"`
    Timestamp   string  `json:"ts"`
    Temperature float64 `json:"temperature"`
    WindSpeed   float64 `json:"windspeed"`
    Humidity    float64 `json:"humidity"`
}
```

## 🔄 Fluxo de Processamento

1. **Conexão:** Conecta ao RabbitMQ
2. **Canal:** Abre canal de comunicação
3. **Consumo:** Inicia consumo da fila `weather_logs`
4. **Loop:** Para cada mensagem recebida:
   - Deserializa JSON
   - Valida estrutura
   - Envia HTTP POST para `POST /api/weather/logs`
   - Se sucesso: `Ack` (confirma processamento)
   - Se erro: `Nack` (rejeita e recoloca na fila)

## 📡 Integração com API

O worker envia dados para:

**Endpoint:** `POST {API_BASE_URL}/weather/logs`

**Headers:**
```
Content-Type: application/json
```

**Body:** JSON com os dados climáticos

**Resposta esperada:**
- `2xx` - Sucesso, mensagem é confirmada (Ack)
- `4xx/5xx` - Erro, mensagem é rejeitada (Nack)

## 🛡️ Tratamento de Erros

### Validação de Payload

Se o JSON não puder ser deserializado:
- Loga erro: `"payload inválido"`
- Faz `Nack` com `requeue=true` (recoloca na fila)

### Erro HTTP

Se a API retornar erro (status >= 400):
- Loga erro: `"API respondeu com status {code}"`
- Faz `Nack` com `requeue=true`

### Erro de Conexão

Se não conseguir conectar à API:
- Loga erro
- Faz `Nack` com `requeue=true`

## 📦 Dependências

```go
require (
    github.com/rabbitmq/amqp091-go v1.10.0
)
```

## 🔍 Logs

O worker registra:

- ✅ `"Worker aguardando mensagens..."` - Inicialização
- ✅ `"Mensagem enviada para API: {timestamp}"` - Sucesso
- ❌ `"Erro ao processar mensagem: {erro}"` - Falha

## 🧪 Testando Localmente

### Pré-requisitos

1. RabbitMQ rodando (Docker ou local)
2. API NestJS rodando e acessível
3. Mensagens na fila `weather_logs`

### Executar

```bash
export RABBITMQ_URL=amqp://guest:guest@localhost:5672/
export API_BASE_URL=http://localhost:3000/api
go run main.go
```

### Testar com Mensagem Manual

```bash
# Publique uma mensagem de teste no RabbitMQ
# Ou use o collector Python para gerar mensagens
```

## 🚀 Melhorias Futuras

- [ ] Implementar retry com backoff exponencial
- [ ] Dead Letter Queue para mensagens com falha repetida
- [ ] Métricas (mensagens processadas, taxa de erro)
- [ ] Health check endpoint
- [ ] Graceful shutdown
- [ ] Processamento em paralelo (workers múltiplos)
- [ ] Timeout configurável para requisições HTTP

## 🔧 Desenvolvimento

### Estrutura do Código

**main.go:**
- `main()` - Função principal, configura conexão e inicia consumo
- `processMessage()` - Processa uma mensagem individual
- `getEnv()` - Helper para variáveis de ambiente

### Padrões

- **Ack Manual:** Mensagens só são confirmadas após sucesso
- **Nack com Requeue:** Mensagens com erro voltam para a fila
- **Timeout HTTP:** 5 segundos para evitar travamentos
- **Validação:** Verifica estrutura antes de enviar

## 📝 Notas

- O worker roda indefinidamente até ser interrompido
- Mensagens são processadas sequencialmente (uma por vez)
- Em caso de falha na API, a mensagem volta para a fila e será reprocessada
- O worker não persiste estado, é stateless


