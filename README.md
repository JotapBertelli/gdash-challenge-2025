# GDASH Challenge 2025/02

Solução completa para o desafio de processo seletivo GDASH 2025/02. Sistema full-stack que coleta dados climáticos, processa via fila de mensagens e exibe em dashboard interativo com autenticação e gerenciamento de usuários.

## 🏗️ Arquitetura

O projeto segue uma arquitetura de microsserviços com comunicação assíncrona via message broker:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│   Python    │─────▶│   RabbitMQ   │─────▶│     Go      │─────▶│   NestJS    │
│  Collector  │      │  (Message     │      │   Worker    │      │     API     │
│             │      │   Broker)     │      │             │      │             │
└─────────────┘      └──────────────┘      └─────────────┘      └──────┬──────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────┐
                                                               │  MongoDB    │
                                                               │             │
                                                               └──────┬──────┘
                                                                      │
                                                                      ▼
                                                               ┌─────────────┐
                                                               │   React      │
                                                               │  Frontend   │
                                                               └─────────────┘
```

## 📁 Estrutura do Projeto

```
gdash-challenge-2025/
├── apps/
│   ├── api/              # API NestJS (Backend)
│   └── web/              # Frontend React + Vite
├── services/
│   ├── collector/        # Coletor Python (dados climáticos)
│   └── worker/           # Worker Go (processamento de fila)
├── docker-compose.yml    # Orquestração de todos os serviços
├── env.example           # Exemplo de variáveis de ambiente
└── README.md            # Este arquivo
```

### 📂 Documentação por Módulo

- **[apps/api/README.md](./apps/api/README.md)** - API NestJS com MongoDB
- **[apps/web/README.md](./apps/web/README.md)** - Frontend React + Vite + Tailwind
- **[services/collector/README.md](./services/collector/README.md)** - Coletor Python
- **[services/worker/README.md](./services/worker/README.md)** - Worker Go

## 🚀 Início Rápido

### Pré-requisitos

- **Docker Desktop** instalado e rodando
- **Node.js 18+** (para desenvolvimento local)
- **Go 1.22+** (para desenvolvimento local)
- **Python 3.11+** (para desenvolvimento local)

### Executando com Docker Compose

1. **Clone o repositório:**
   ```bash
   git clone <seu-repositorio>
   cd gdash-challenge-2025
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp env.example .env
   # Edite o .env se necessário
   ```

3. **Suba todos os serviços:**
   ```bash
   docker compose up --build
   ```

4. **Acesse a aplicação:**
   - **Frontend:** http://localhost:5173
   - **API:** http://localhost:3000
   - **Mongo Express:** http://localhost:8081 (visualizar dados)
   - **RabbitMQ Management:** http://localhost:15672 (guest/guest)

### Credenciais Padrão

- **Email:** `admin@gdash.io`
- **Senha:** `123456`

## 🔄 Fluxo de Dados

1. **Coleta (Python):** O serviço `collector` consulta a API Open-Meteo a cada 30 minutos e publica os dados na fila RabbitMQ.

2. **Processamento (Go):** O `worker` consome mensagens da fila, valida os dados e envia para a API NestJS via HTTP.

3. **Persistência (NestJS):** A API recebe os dados, persiste no MongoDB e pode gerar insights de IA.

4. **Visualização (React):** O frontend consome os dados da API, exibe em dashboard e permite exportação CSV/XLSX.

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **Passport** - Estratégias de autenticação
- **bcrypt** - Hash de senhas
- **ExcelJS** - Geração de arquivos XLSX
- **csv-stringify** - Geração de arquivos CSV

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **Axios** - Cliente HTTP

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **RabbitMQ** - Message broker
- **MongoDB** - Banco de dados

### Serviços
- **Python 3.11** - Coletor de dados
- **Go 1.22** - Worker de processamento
- **Open-Meteo API** - Dados climáticos

## 📋 Funcionalidades

### ✅ Implementado

- ✅ Coleta automática de dados climáticos (Open-Meteo)
- ✅ Pipeline assíncrono (Python → RabbitMQ → Go → NestJS)
- ✅ Persistência no MongoDB
- ✅ Autenticação JWT
- ✅ CRUD completo de usuários
- ✅ Dashboard de clima em tempo real
- ✅ Exportação CSV/XLSX
- ✅ Guards de autorização por role (admin/user)
- ✅ Interface responsiva com Tailwind CSS

### 🚧 Em Desenvolvimento

- [ ] Insights de IA baseados em dados climáticos
- [ ] Integração opcional com API pública paginada (PokéAPI/SWAPI)
- [ ] Gráficos interativos no dashboard
- [ ] Filtros e busca avançada

## 🧪 Desenvolvimento Local

### Backend (NestJS)

```bash
cd apps/api
npm install
npm run start:dev
```

### Frontend (React)

```bash
cd apps/web
npm install
npm run dev
```

### Collector (Python)

```bash
cd services/collector
pip install -r requirements.txt
python -m src
```

### Worker (Go)

```bash
cd services/worker
go mod download
go run main.go
```

## 📝 Variáveis de Ambiente

Veja `env.example` para todas as variáveis disponíveis. Principais:

- `MONGO_URI` - String de conexão MongoDB
- `RABBITMQ_URL` - URL do RabbitMQ
- `JWT_SECRET` - Chave secreta para JWT
- `DEFAULT_ADMIN_EMAIL` - Email do admin padrão
- `DEFAULT_ADMIN_PASSWORD` - Senha do admin padrão

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login e obtenção de token

### Usuários (requer autenticação)
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/me` - Usuário atual
- `POST /api/users` - Criar usuário (admin)
- `PATCH /api/users/:id` - Atualizar usuário (admin)
- `DELETE /api/users/:id` - Deletar usuário (admin)

### Clima (requer autenticação)
- `GET /api/weather/logs` - Listar registros climáticos
- `GET /api/weather/export.csv` - Exportar CSV
- `GET /api/weather/export.xlsx` - Exportar XLSX

### Clima (público - usado pelo worker)
- `POST /api/weather/logs` - Criar registro (usado pelo worker Go)

## 🐛 Troubleshooting

### MongoDB não conecta
- Verifique se o MongoDB está rodando: `docker ps`
- Confirme a `MONGO_URI` no `.env`

### RabbitMQ não conecta
- Acesse http://localhost:15672 para verificar status
- Credenciais padrão: guest/guest

### API não inicia
- Verifique se todas as dependências foram instaladas
- Confirme se o MongoDB está acessível

## 📄 Licença

MIT

## 👤 Autor

Desenvolvido para o processo seletivo GDASH 2025/02
