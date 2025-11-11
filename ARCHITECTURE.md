# 🏗️ Arquitetura do Projeto

## Visão Geral

Este projeto segue uma **arquitetura em camadas** inspirada no padrão **MVC (Model-View-Controller)**, com separação clara de responsabilidades.

```
┌─────────────────────────────────────────┐
│            Frontend (View)              │
│         HTML + CSS + JavaScript         │
└─────────────────────────────────────────┘
                   ↓ HTTP
┌─────────────────────────────────────────┐
│            Routes (Router)              │
│     Define endpoints e middlewares      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│        Controllers (Controller)         │
│  Processa requisições HTTP e respostas  │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Services (Business Logic)       │
│    Lógica de negócio e regras          │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          Models (Data Access)           │
│      Operações no banco de dados        │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│           Database (MySQL)              │
│         Armazenamento de dados          │
└─────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios

```
encurtador/
├── config/
│   └── passport.js          # Configuração OAuth 2.0
├── controllers/
│   └── urlController.js     # Controller de URLs
├── middleware/
│   └── auth.js              # Middleware de autenticação
├── models/
│   └── Url.js               # Model de URLs (acesso ao BD)
├── public/
│   ├── index.html           # Interface do usuário
│   ├── script.js            # JavaScript do frontend
│   └── styles.css           # Estilos CSS
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   └── urls.js              # Rotas de URLs
├── services/
│   └── urlService.js        # Lógica de negócio de URLs
├── utils/
│   └── constants.js         # Constantes do sistema
├── validators/
│   └── urlValidator.js      # Validadores de entrada
├── database.js              # Configuração do pool MySQL
└── server.js                # Ponto de entrada da aplicação
```

---

## 🔍 Detalhamento das Camadas

### 1. **Routes** (Camada de Roteamento)

**Responsabilidade:** Definir endpoints HTTP e aplicar middlewares.

**Arquivos:**
- `routes/urls.js` - Rotas para operações de URLs
- `routes/auth.js` - Rotas para autenticação

**Exemplo:**
```javascript
// routes/urls.js
router.post('/shorten', createLimiter, UrlController.createShortUrl);
router.get('/urls', UrlController.listUrls);
router.delete('/urls/:shortCode', ensureAuthenticated, UrlController.deleteUrl);
```

**Princípios:**
- ✅ Define apenas rotas e middlewares
- ✅ Não contém lógica de negócio
- ✅ Delega processamento para Controllers

---

### 2. **Controllers** (Camada de Controle)

**Responsabilidade:** Processar requisições HTTP, validar entrada e retornar respostas.

**Arquivos:**
- `controllers/urlController.js` - Controller de URLs

**Exemplo:**
```javascript
// controllers/urlController.js
static async createShortUrl(req, res) {
  try {
    const result = await UrlService.createShortUrl(req.body, req.user);
    res.status(200).json(result);
  } catch (error) {
    UrlController.handleError(res, error);
  }
}
```

**Princípios:**
- ✅ Processa requisições e envia respostas
- ✅ Valida parâmetros de entrada
- ✅ Trata erros e formata respostas HTTP
- ❌ NÃO contém lógica de negócio
- ❌ NÃO acessa banco de dados diretamente

---

### 3. **Services** (Camada de Lógica de Negócio)

**Responsabilidade:** Implementar regras de negócio e coordenar operações.

**Arquivos:**
- `services/urlService.js` - Lógica de negócio de URLs

**Exemplo:**
```javascript
// services/urlService.js
static async createShortUrl(data, user) {
  // Aplicar regras de negócio
  if (!user) {
    data.expiresIn = 7; // Forçar 7 dias para guests
    data.customCode = null;
  }

  // Validar dados
  const validation = validateCreateUrl(data, !!user);
  if (!validation.isValid) throw new ValidationError();

  // Coordenar operações
  const shortCode = await this.generateUniqueShortCode();
  const qrCode = await this.generateQRCode(shortCode);
  await UrlModel.create({ ... });

  return formatUrlResponse();
}
```

**Princípios:**
- ✅ Contém toda a lógica de negócio
- ✅ Coordena múltiplas operações
- ✅ Valida regras de negócio
- ✅ Independente de HTTP (pode ser reutilizado)
- ❌ NÃO conhece detalhes de HTTP (req, res)
- ❌ NÃO acessa banco diretamente (usa Models)

---

### 4. **Models** (Camada de Acesso a Dados)

**Responsabilidade:** Executar operações no banco de dados.

**Arquivos:**
- `models/Url.js` - Operações de URLs no banco

**Exemplo:**
```javascript
// models/Url.js
static async create(data) {
  const [result] = await pool.query(`
    INSERT INTO urls (user_id, original_url, short_code, ...)
    VALUES (?, ?, ?, ...)
  `, [data.userId, data.originalUrl, ...]);

  return result;
}

static async findByShortCode(shortCode) {
  const [rows] = await pool.query(
    'SELECT * FROM urls WHERE short_code = ?',
    [shortCode]
  );
  return rows.length > 0 ? rows[0] : null;
}
```

**Princípios:**
- ✅ Único lugar que executa queries SQL
- ✅ Retorna dados brutos do banco
- ✅ Usa prepared statements (segurança)
- ❌ NÃO contém lógica de negócio
- ❌ NÃO conhece HTTP ou Services

---

### 5. **Validators** (Camada de Validação)

**Responsabilidade:** Validar e sanitizar dados de entrada.

**Arquivos:**
- `validators/urlValidator.js` - Validadores de URLs

**Exemplo:**
```javascript
// validators/urlValidator.js
function validateUrl(urlString) {
  if (!urlString) {
    return { isValid: false, error: 'URL obrigatória' };
  }

  const url = new URL(urlString);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { isValid: false, error: 'Apenas HTTP/HTTPS' };
  }

  return { isValid: true };
}
```

**Princípios:**
- ✅ Validação pura (sem efeitos colaterais)
- ✅ Retorna objeto com isValid e error
- ✅ Reutilizável em múltiplos lugares
- ❌ NÃO acessa banco ou APIs externas

---

### 6. **Utils** (Utilitários)

**Responsabilidade:** Constantes e funções auxiliares reutilizáveis.

**Arquivos:**
- `utils/constants.js` - Constantes do sistema

**Exemplo:**
```javascript
// utils/constants.js
const LIMITS = {
  SHORT_CODE_MIN_LENGTH: 3,
  SHORT_CODE_MAX_LENGTH: 30,
  GUEST_EXPIRATION_DAYS: 7
};

const ERROR_MESSAGES = {
  INVALID_URL: 'URL inválida',
  UNAUTHORIZED: 'Autenticação necessária'
};
```

---

## 🔄 Fluxo de Dados Completo

### Exemplo: Criar URL Encurtada

```
1. Frontend faz POST /api/shorten
   ↓
2. Route aplica rate limiter e chama Controller
   ↓
3. Controller:
   - Extrai dados da requisição
   - Chama Service
   ↓
4. Service:
   - Valida dados (usa Validator)
   - Aplica regras de negócio (guest vs autenticado)
   - Gera código curto único
   - Gera QR code
   - Salva no banco (usa Model)
   - Formata resposta
   ↓
5. Model:
   - Executa INSERT no MySQL
   - Retorna resultado
   ↓
6. Service retorna dados formatados
   ↓
7. Controller retorna HTTP 200 + JSON
   ↓
8. Frontend recebe resposta e atualiza UI
```

---

## ✅ Benefícios desta Arquitetura

### 1. **Separação de Responsabilidades**
Cada camada tem uma função específica e bem definida.

### 2. **Testabilidade**
```javascript
// Fácil testar Service isoladamente
const result = await UrlService.createShortUrl({
  url: 'https://example.com'
}, null);

expect(result).toHaveProperty('short_code');
```

### 3. **Manutenibilidade**
- Mudanças no banco? → Apenas Models
- Nova regra de negócio? → Apenas Services
- Novo endpoint? → Apenas Routes/Controllers

### 4. **Reutilização**
Services podem ser usados por:
- Controllers HTTP
- Cron jobs
- Workers
- CLI tools
- Testes

### 5. **Escalabilidade**
Fácil adicionar:
- Novos controllers (ex: analytics, users)
- Novos services (ex: email, notifications)
- Novos models (ex: Analytics, Subscriptions)

---

## 📦 Dependências entre Camadas

```
Routes → Controllers → Services → Models → Database
  ↓                      ↓
Middleware           Validators
                        ↓
                     Utils
```

**Regra de Ouro:** Camadas superiores podem chamar inferiores, mas NUNCA o contrário.

✅ Controller pode chamar Service
✅ Service pode chamar Model
✅ Service pode chamar Validator
❌ Model NÃO pode chamar Service
❌ Service NÃO pode chamar Controller

---

## 🚀 Próximos Passos

Com essa arquitetura estabelecida, é fácil adicionar:

### Analytics Service
```javascript
// services/analyticsService.js
class AnalyticsService {
  static async trackClick(urlId, metadata) { ... }
  static async getClicksByCountry(urlId) { ... }
  static async getClickTrends(urlId, period) { ... }
}
```

### Email Service
```javascript
// services/emailService.js
class EmailService {
  static async sendExpirationWarning(user, url) { ... }
  static async sendWeeklyReport(user, stats) { ... }
}
```

### API v2
```javascript
// routes/api/v2.js
router.post('/bulk-shorten', BulkController.shortenMany);
router.get('/analytics/:code', AnalyticsController.getStats);
```

---

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
