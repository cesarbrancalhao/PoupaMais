# Server-side PoupaMais

Backend API for PoupaMais - Complete personal finance management system.

## Stacks

- **NestJS** - Node.js Framework
- **PostgreSQL** - Relational database
- **Docker & Docker Compose** - Containerization
- **Passport & JWT** - Authentication and authorization
- **bcrypt** - Password hashing
- **class-validator & class-transformer** - Request validation
- **Swagger** - Interactive API documentation
- **Throttler** - Rate limiting for abuse protection

### Database

- **usuario** - User accounts
- **config** - User settings (theme, language, currency)
- **categoria_despesa** - Custom expense categories (with icons)
- **fonte_receita** - Custom income sources (with icons)
- **despesa** - Expense records (supports recurrence and due dates)
- **receita** - Income records (supports recurrence and due dates)
- **despesa_exclusao** - Specific exclusions for recurring expenses
- **receita_exclusao** - Specific exclusions for recurring income
- **meta** - Financial goals/objectives (with automatic tracking)
- **contribuicao_meta** - Goal contributions

### API Modules

- **Auth** - Registration, login, JWT tokens
- **Users** - User profile management
- **Configs** - User settings (theme, language, currency)
- **Categoria Despesa** - CRUD for expense categories
- **Fonte Receita** - CRUD for income sources
- **Despesas** - Full CRUD for expenses + exclusion management
- **Receitas** - Full CRUD for income + exclusion management
- **Metas** - CRUD for financial goals/objectives
- **Contribuicao Meta** - CRUD for goal contributions

### Security Features

- Password hashing with bcrypt (salt rounds: 10)
- JWT authentication with Passport strategy
- Rate limiting (100 requests per minute per IP)
- Parameterized SQL queries (SQL injection protection)
- Strict input validation with class-validator
- Complete data isolation per user
- Restrictive CORS configuration
- Required environment variable validation
- Global exception filter for error handling

## Requirements

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

## Quick Start (3 Steps)

```bash
# Install Dependencies
cd server
npm i 
# Start Database
docker compose up postgres -d
# Start app
npm run start:dev
```

Done! Your API is running at `http://localhost:3001`

## Project Structure

```
server/
├── src/
│   ├── auth/                      # Authentication module
│   │   ├── dto/                   # Login and registration DTOs
│   │   ├── guards/                # JWT and Local guards
│   │   ├── strategies/            # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── database/                  # PostgreSQL pool
│   │   ├── database.service.ts
│   │   └── database.module.ts
│   ├── users/                     # User management
│   ├── configs/                   # Settings (theme, language, currency)
│   ├── categoria-despesa/         # Categories with icons
│   ├── fonte-receita/             # Income sources with icons
│   ├── despesas/                  # Expenses + exclusions
│   │   ├── dto/
│   │   ├── despesas.controller.ts
│   │   ├── despesas.service.ts   # Includes exclusion logic
│   │   └── despesas.module.ts
│   ├── receitas/                  # Income + exclusions
│   │   ├── dto/
│   │   ├── receitas.controller.ts
│   │   ├── receitas.service.ts   # Includes exclusion logic
│   │   └── receitas.module.ts
│   ├── metas/                     # Financial goals
│   ├── contribuicao-meta/         # Goal contributions
│   │   ├── dto/
│   │   ├── contribuicao-meta.controller.ts
│   │   ├── contribuicao-meta.service.ts
│   │   └── contribuicao-meta.module.ts
│   ├── common/                    # Shared
│   │   ├── dto/                   # Global DTOs (pagination)
│   │   ├── filters/               # Exception filters
│   │   └── interfaces/            # Shared interfaces
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application bootstrap
├── data.sql                       # Schema + triggers + indices
├── docker compose.yml             # Containerized PostgreSQL
├── Dockerfile
├── package.json
└── README.md
```

## Environment

Create a `.env` file in the server project root:

```bash

cp .env.example .env
```

Add the following environment variables:

```bash
# Environment
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=poupa_mais

# JWT (REQUIRED - change to a secure key in production)
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (use your preferred SMTP service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=YOUR_APP_PASSWORD
SMTP_FROM=yourgmail@gmail.com
```

**IMPORTANT**: The variables `JWT_SECRET`, `DB_HOST`, and `DB_PASSWORD` are required. The application will not start without them.

## API Documentation

Swagger documentation available at: **`http://localhost:3001/api/docs`**

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/auth/register | Register new user | No |
| POST | /api/v1/auth/login | User login | No |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/users/profile | Get user profile | Yes |
| PUT | /api/v1/users/profile | Update profile | Yes |
| DELETE | /api/v1/users/account | Delete account | Yes |

### Configurations
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/configs | Get user settings | Yes |
| PUT | /api/v1/configs | Update settings (theme, language, currency) | Yes |

### Expense Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/categoria-despesa | Create category (name + icon) | Yes |
| GET | /api/v1/categoria-despesa | List all categories | Yes |
| GET | /api/v1/categoria-despesa/:id | Get category by ID | Yes |
| PUT | /api/v1/categoria-despesa/:id | Update category | Yes |
| DELETE | /api/v1/categoria-despesa/:id | Delete category | Yes |

### Income Sources
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/fonte-receita | Create source (name + icon) | Yes |
| GET | /api/v1/fonte-receita | List all sources | Yes |
| GET | /api/v1/fonte-receita/:id | Get source by ID | Yes |
| PUT | /api/v1/fonte-receita/:id | Update source | Yes |
| DELETE | /api/v1/fonte-receita/:id | Delete source | Yes |

### Expenses
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/despesas | Create expense (supports recurrence) | Yes |
| GET | /api/v1/despesas?page=1&limit=10 | List expenses (paginated) | Yes |
| GET | /api/v1/despesas/:id | Get expense by ID | Yes |
| PUT | /api/v1/despesas/:id | Update expense | Yes |
| DELETE | /api/v1/despesas/:id | Delete expense | Yes |
| POST | /api/v1/despesas/:id/exclusoes | Create exclusion for recurring expense | Yes |
| GET | /api/v1/despesas/exclusoes/all | List all exclusions | Yes |
| DELETE | /api/v1/despesas/exclusoes/:id | Remove exclusion | Yes |

### Income
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/receitas | Create income (supports recurrence) | Yes |
| GET | /api/v1/receitas?page=1&limit=10 | List income (paginated) | Yes |
| GET | /api/v1/receitas/:id | Get income by ID | Yes |
| PUT | /api/v1/receitas/:id | Update income | Yes |
| DELETE | /api/v1/receitas/:id | Delete income | Yes |
| POST | /api/v1/receitas/:id/exclusoes | Create exclusion for recurring income | Yes |
| GET | /api/v1/receitas/exclusoes/all | List all exclusions | Yes |
| DELETE | /api/v1/receitas/exclusoes/:id | Remove exclusion | Yes |

### Goals
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/metas | Create financial goal | Yes |
| GET | /api/v1/metas?page=1&limit=10 | List goals (paginated) | Yes |
| GET | /api/v1/metas/:id | Get goal by ID | Yes |
| PUT | /api/v1/metas/:id | Update goal | Yes |
| DELETE | /api/v1/metas/:id | Delete goal | Yes |

### Goal Contributions
| Method | Endpoint | Description | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/contribuicao-meta | Create contribution for a goal | Yes |
| GET | /api/v1/contribuicao-meta?page=1&limit=10 | List all contributions | Yes |
| GET | /api/v1/contribuicao-meta/meta/:metaId | List contributions by goal | Yes |
| GET | /api/v1/contribuicao-meta/:id | Get contribution by ID | Yes |
| PUT | /api/v1/contribuicao-meta/:id | Update contribution | Yes |
| DELETE | /api/v1/contribuicao-meta/:id | Delete contribution | Yes |

### Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the JWT token in the Authorization header:

```js
Authorization: Bearer <your_token>
```

## Advanced Features

### 1. Recurrence Exclusion System

Allows excluding specific occurrences of recurring expenses/income without affecting others:

- Recurring expense/income remains active
- Exclusions are registered with a specific date
- System ignores excluded occurrences in calculations

**Usage example**: Your rent is recurring every month, but in December you didn't pay because you were traveling. Create an exclusion for December/2025.

### 2. Goal System with Contributions

Financial goals with automatic tracking:

- `valor`: Total goal amount
- `valor_atual`: Automatically calculated from the sum of contributions
- `economia_mensal`: Planned monthly savings amount
- `data_inicio` and `data_alvo`: Timeframe to reach the goal

**Automatic trigger**: When you add/remove/update contributions, the goal's `valor_atual` is automatically recalculated.

### 3. Pagination

All list endpoints support pagination via query params:

```
?page=1&limit=10
```

Defaults: `page=1`, `limit=10`

### 4. Custom Icons

Expense categories and income sources support custom icons (e.g., "ShoppingCart", "Home", "Car", "DollarSign").

### 5. Multi-language and Multi-currency Settings

Each user can configure:
- **Theme**: Light (false) or Dark (true)
- **Language**: Portuguese, English, Spanish
- **Currency**: Real, Dollar, Euro

### 6. Rate Limiting

Abuse protection: maximum of 100 requests per minute per IP.

## API Request Flow

1. Entry point: Controller

```js
@Controller('auth')
export class AuthController {
  @Post('register')
  @Post('login')
}
```

2. DTO Validation

```js
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

3. Authentication guards (on protected routes)

```js
@UseGuards(LocalAuthGuard)
@Post('login')
async login(@Body() loginDto: LoginDto, @Request() req) {
  return this.authService.login(req.user);
}
```

4. Strategy Execution

```js
export class LocalStrategy extends PassportStrategy(Strategy) {
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

5. BLL (business logic layer)

```js
export class AuthService {
  async validateUser(email: string, password: string): Promise<any> {
    const result = await this.databaseService.query(
      'SELECT * FROM usuario WHERE email = $1',
      [email],
    );
    if (!await bcrypt.compare(password, user.senha)) {
      return null;
    }
    const { senha, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

## Testing the API

### Using Swagger UI
Open `http://localhost:3001/api/docs` in your browser to interactively test all endpoints.

### Using cURL

**1. Register a user:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"John Doe","email":"john@example.com","password":"password123"}'
```

**2. Login:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

Copy the `access_token` from the response.

**3. Create an expense category (with icon):**

```bash
curl -X POST http://localhost:3001/api/v1/categoria-despesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"nome":"Food","icone":"ShoppingCart"}'
```

**4. Create a recurring expense:**

```bash
curl -X POST http://localhost:3001/api/v1/despesas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "nome":"Rent",
    "valor":1200.00,
    "recorrente":true,
    "data":"2025-11-05",
    "data_vencimento":"2025-11-05",
    "categoria_despesa_id":1
  }'
```

**5. Get expenses (with pagination):**

```bash
curl -X GET "http://localhost:3001/api/v1/despesas?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**6. Create an exclusion for a recurring expense:**

```bash
curl -X POST http://localhost:3001/api/v1/despesas/1/exclusoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"data_exclusao":"2025-12-05"}'
```

**7. Create a financial goal:**

```bash
curl -X POST http://localhost:3001/api/v1/metas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "nome":"Trip to Europe",
    "descricao":"Summer vacation",
    "valor":10000.00,
    "economia_mensal":500.00,
    "data_inicio":"2025-01-01",
    "data_alvo":"2025-12-31"
  }'
```

**8. Add a contribution to a goal:**

```bash
curl -X POST http://localhost:3001/api/v1/contribuicao-meta \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "meta_id":1,
    "valor":500.00,
    "data":"2025-11-20",
    "observacao":"November contribution"
  }'
```

## Development

```bash
# Run in Dev
npm run start:dev

# In prod
npm run build
npm run start:prod

# Formatting
npm run format

# Linting
npm run lint
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start only the database
docker compose up postgres -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v
```

## Database Management

### Connect to PostgreSQL

```bash
docker exec -it poupa_mais_db psql -U postgres -d poupa_mais
```

### Useful SQL Commands

```sql
-- List all tables
\dt

-- View table structure
\d+ despesa

-- Check triggers
\dS+ contribuicao_meta

-- Query goals with current value
SELECT id, nome, valor, valor_atual, 
       ROUND((valor_atual / valor * 100), 2) as progresso_percentual
FROM meta 
WHERE usuario_id = 1;

-- View goal contributions
SELECT c.id, c.valor, c.data, c.observacao, m.nome as meta_nome
FROM contribuicao_meta c
JOIN meta m ON c.meta_id = m.id
WHERE c.usuario_id = 1
ORDER BY c.data DESC;

-- Check recurring expense exclusions
SELECT d.nome as despesa, de.data_exclusao
FROM despesa_exclusao de
JOIN despesa d ON de.despesa_id = d.id
WHERE de.usuario_id = 1
ORDER BY de.data_exclusao;
```

### Schema Highlights

**Automatic Triggers:**
- `trigger_atualizar_meta`: Automatically updates the goal's `valor_atual` when contributions are inserted/updated/deleted

**Constraints:**
- Decimal values with 2 decimal places (DECIMAL(11,2))
- Positive value checks on expenses, income, and goals
- Foreign keys with ON DELETE CASCADE for automatic cleanup

**Indices:**
- Indices on all foreign keys
- Indices on `usuario_id` for fast per-user queries
- Composite indices for exclusions (despesa_id, receita_id)

**Enums and Types:**
```sql
-- Supported languages
idioma_enum: 'portugues', 'ingles', 'espanhol'

-- Supported currencies
moeda_enum: 'real', 'dolar', 'euro'
```

## Key Files to Understand

1. **data.sql** - Complete database schema with triggers and indices
2. **src/database/database.service.ts** - PostgreSQL connection pool and SQL query execution
3. **src/auth/auth.service.ts** - Registration, login, and user validation with bcrypt
4. **src/despesas/despesas.service.ts** - Expense CRUD operations + recurring exclusions
5. **src/receitas/receitas.service.ts** - Income CRUD operations + recurring exclusions
6. **src/metas/metas.service.ts** - Financial goal management
7. **src/contribuicao-meta/contribuicao-meta.service.ts** - Contribution system with automatic goal updates
8. **src/main.ts** - Global application configuration (CORS, pipes, Swagger, rate limiting)
9. **src/common/filters/http-exception.filter.ts** - Global exception handling

## Troubleshooting

**Port already in use:**

```bash
# Change the PORT in the .env file
PORT=3001
```

**Database connection error:**

```bash
# Check if Docker is running
docker compose up postgres -d

# Check PostgreSQL logs
docker compose logs postgres

# Test connection manually
docker exec -it poupa_mais_db psql -U postgres -d poupa_mais -c "\l"
```

**Application won't start - missing environment variables:**

```bash
# Error: "Environment variable JWT_SECRET is not defined"
# Solution: Create the .env file with all required variables
# JWT_SECRET, DB_HOST, DB_PASSWORD are required
```

**Completely reset the database:**

```bash
# Stop and remove volumes (WARNING: deletes all data!)
docker compose down -v

# Restart a clean database
docker compose up postgres -d

# Wait 5-10 seconds for the database to initialize
sleep 10

# The schema will be applied automatically via data.sql
```

**Rate limit hit (429 Too Many Requests):**

```
# Wait 60 seconds or adjust the limit in src/app.module.ts
# Current setting: 100 requests per minute
```