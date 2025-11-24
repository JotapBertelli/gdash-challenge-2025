# Frontend React - Interface Web

Interface web moderna desenvolvida com React, Vite e Tailwind CSS para visualização de dados climáticos e gerenciamento de usuários.

## 🎯 Responsabilidades

- **Dashboard de Clima:** Exibe dados climáticos em tempo real com cards e tabela
- **Autenticação:** Tela de login e proteção de rotas
- **Gerenciamento de Usuários:** CRUD completo de usuários
- **Exportação:** Botões para download de CSV e XLSX
- **Interface Responsiva:** Design moderno com Tailwind CSS

## 📁 Estrutura

```
src/
├── pages/
│   ├── Login.tsx        # Tela de autenticação
│   ├── Dashboard.tsx    # Dashboard principal com dados climáticos
│   └── Users.tsx        # Gerenciamento de usuários
├── lib/
│   ├── api.ts          # Cliente Axios configurado
│   └── auth.ts         # Serviços de autenticação
├── App.tsx             # Componente raiz com rotas
├── main.tsx            # Entry point
└── index.css           # Estilos globais Tailwind
```

## 🔧 Tecnologias

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento SPA
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones (se usado)

## 🚀 Executando

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

### Build para Produção

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t gdash-web .
docker run -p 5173:5173 gdash-web
```

## 🎨 Páginas

### Login (`/login`)

Tela de autenticação com formulário de email e senha.

- Validação de campos
- Feedback de erro
- Redirecionamento automático após login
- Armazena token no localStorage

### Dashboard (`/dashboard`)

Página principal com visualização de dados climáticos.

**Funcionalidades:**
- Cards com métricas atuais (temperatura, vento, umidade)
- Tabela com histórico de registros
- Botões de exportação CSV/XLSX
- Navegação para gerenciamento de usuários
- Botão de logout

**Dados exibidos:**
- Data/Hora do registro
- Cidade
- Temperatura (°C)
- Velocidade do vento (km/h)
- Umidade (%)

### Usuários (`/users`)

Gerenciamento completo de usuários (requer role admin).

**Funcionalidades:**
- Listagem de todos os usuários
- Criação de novos usuários
- Edição de usuários existentes
- Exclusão de usuários
- Formulário modal para criar/editar
- Indicador visual de role (admin/user)

## 🔐 Autenticação

### Fluxo

1. Usuário faz login em `/login`
2. Token JWT é armazenado no `localStorage`
3. Token é enviado automaticamente em todas as requisições via interceptor Axios
4. Rotas protegidas verificam autenticação
5. Se token expirar (401), redireciona para login

### Interceptors Axios

**Request Interceptor:**
- Adiciona `Authorization: Bearer <token>` em todas as requisições

**Response Interceptor:**
- Detecta erro 401 (não autorizado)
- Remove token do localStorage
- Redireciona para `/login`

## 🎨 Estilização

O projeto usa **Tailwind CSS** com tema dark:

- **Background:** `slate-950` (quase preto)
- **Cards:** `slate-900` com bordas `slate-800`
- **Texto:** `slate-50` (branco) e `slate-400` (cinza)
- **Acentos:** `emerald-500` (verde) para ações principais
- **Erros:** `red-500` para feedback negativo

## 📡 Integração com API

### Cliente Axios

O arquivo `src/lib/api.ts` configura o cliente Axios:

- Base URL: `http://localhost:3000/api` (ou `VITE_API_URL`)
- Interceptors para token e tratamento de erros
- Headers padrão configurados

### Serviços

**auth.ts:**
- `login(email, password)` - Autenticação
- `logout()` - Limpa token e redireciona
- `isAuthenticated()` - Verifica se está autenticado
- `getToken()` - Retorna token atual

## 🛣️ Rotas

```typescript
/              → Redireciona para /dashboard
/login         → Tela de login (pública)
/dashboard     → Dashboard (protegida)
/users         → Gerenciamento de usuários (protegida)
```

### Proteção de Rotas

O componente `PrivateRoute` verifica autenticação antes de renderizar:

```typescript
<PrivateRoute>
  <Dashboard />
</PrivateRoute>
```

## 📦 Dependências Principais

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "axios": "^1.7.4",
  "tailwindcss": "^3.4.4",
  "vite": "^5.2.11",
  "typescript": "^5.4.5"
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
```

### Vite Config

O `vite.config.ts` está configurado para:
- Porta: `5173`
- Host: `0.0.0.0` (acessível externamente)
- Plugin React habilitado

## 🎯 Funcionalidades Futuras

- [ ] Gráficos interativos (Chart.js ou Recharts)
- [ ] Filtros por data/cidade
- [ ] Paginação na tabela
- [ ] Insights de IA visualizados
- [ ] Página de integração com API pública (PokéAPI/SWAPI)
- [ ] Modo claro/escuro
- [ ] Notificações toast

