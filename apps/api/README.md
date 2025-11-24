# API NestJS - Backend

API RESTful desenvolvida com NestJS que serve como núcleo do sistema, gerenciando autenticação, usuários e dados climáticos.

## 🎯 Responsabilidades

- **Autenticação e Autorização:** Sistema JWT com roles (admin/user)
- **Gerenciamento de Usuários:** CRUD completo com hash de senhas
- **Dados Climáticos:** Recebe, armazena e expõe dados de clima
- **Exportação:** Gera arquivos CSV e XLSX com dados climáticos
- **Persistência:** Integração com MongoDB via Mongoose

## 📁 Estrutura

```
src/
├── auth/              # Módulo de autenticação
│   ├── auth.controller.ts    # Endpoints de login
│   ├── auth.service.ts       # Lógica de autenticação
│   ├── jwt.strategy.ts       # Estratégia JWT do Passport
│   ├── jwt-auth.guard.ts     # Guard de autenticação
│   ├── roles.guard.ts        # Guard de autorização por role
│   ├── roles.decorator.ts    # Decorator @Roles()
│   └── current-user.decorator.ts  # Decorator @CurrentUser()
├── users/             # Módulo de usuários
│   ├── users.controller.ts   # Endpoints CRUD
│   ├── users.service.ts     # Lógica de negócio
│   ├── schemas/
│   │   └── user.schema.ts   # Schema Mongoose
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── weather/           # Módulo de clima
│   ├── weather.controller.ts # Endpoints de clima
│   ├── weather.service.ts    # Lógica de negócio + exportação
│   ├── schemas/
│   │   └── weather-log.schema.ts
│   └── dto/
│       └── create-weather-log.dto.ts
├── app.module.ts      # Módulo raiz
└── main.ts           # Bootstrap da aplicação
```

## 🔧 Tecnologias

- **NestJS 10** - Framework
- **Mongoose** - ODM para MongoDB
- **Passport + JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **class-validator** - Validação de DTOs
- **ExcelJS** - Geração de XLSX
- **csv-stringify** - Geração de CSV

## 🚀 Executando

### Desenvolvimento

```bash
npm install
npm run start:dev
```

### Produção

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t gdash-api .
docker run -p 3000:3000 --env-file ../.env gdash-api
```

## 📡 Endpoints

### Autenticação

#### `POST /api/auth/login`
Login e obtenção de token JWT.

**Body:**
```json
{
  "email": "admin@gdash.io",
  "password": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@gdash.io",
    "name": "Admin",
    "role": "admin"
  }
}
```

### Usuários

Todos os endpoints de usuários requerem autenticação JWT e role `admin` (exceto `GET /users/me`).

#### `GET /api/users`
Lista todos os usuários.

#### `GET /api/users/me`
Retorna o usuário autenticado atual.

#### `GET /api/users/:id`
Retorna um usuário específico.

#### `POST /api/users`
Cria um novo usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "role": "user"
}
```

#### `PATCH /api/users/:id`
Atualiza um usuário.

**Body (todos os campos opcionais):**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "novasenha123",
  "role": "admin"
}
```

#### `DELETE /api/users/:id`
Remove um usuário.

### Clima

#### `POST /api/weather/logs` (público - usado pelo worker)
Recebe dados climáticos do worker Go e persiste no MongoDB.

**Body:**
```json
{
  "city": "São Paulo",
  "ts": "2025-11-24T13:00:00.000Z",
  "temperature": 25.5,
  "windspeed": 12.3,
  "humidity": 65.0
}
```

#### `GET /api/weather/logs` (requer autenticação)
Lista os últimos 1000 registros climáticos.

#### `GET /api/weather/export.csv` (requer autenticação)
Exporta dados em formato CSV.

#### `GET /api/weather/export.xlsx` (requer autenticação)
Exporta dados em formato XLSX.

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos:

1. Faça login em `POST /api/auth/login`
2. Use o token retornado no header: `Authorization: Bearer <token>`
3. O token expira em 1 hora

### Guards

- **JwtAuthGuard:** Verifica se o usuário está autenticado
- **RolesGuard:** Verifica se o usuário tem a role necessária (admin/user)

### Decorators

- `@CurrentUser()` - Injeta o usuário autenticado no controller
- `@Roles('admin')` - Restringe acesso por role

## 🗄️ Banco de Dados

### Schema: User

```typescript
{
  name: string;
  email: string (único);
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema: WeatherLog

```typescript
{
  city: string;
  ts: Date;
  temperature: number;
  windspeed: number;
  humidity: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## ⚙️ Configuração

Variáveis de ambiente necessárias (veja `.env.example`):

- `MONGO_URI` - String de conexão MongoDB
- `JWT_SECRET` - Chave secreta para assinar tokens
- `DEFAULT_ADMIN_EMAIL` - Email do admin padrão
- `DEFAULT_ADMIN_PASSWORD` - Senha do admin padrão
- `API_PORT` - Porta da API (padrão: 3000)

## 🔄 Seed Automático

Na inicialização, a API cria automaticamente um usuário admin se não existir, usando as variáveis `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD`.

## 📦 Dependências Principais

```json
{
  "@nestjs/common": "^10.3.3",
  "@nestjs/core": "^10.3.3",
  "@nestjs/mongoose": "^10.0.6",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "mongoose": "^8.4.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "exceljs": "^4.4.0",
  "csv-stringify": "^6.0.0"
}
```


