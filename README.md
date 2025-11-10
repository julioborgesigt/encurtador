# 🔗 URL Shortener - Versão Avançada

Sistema web completo e profissional para criar links curtos e QR codes usando MySQL ou MariaDB como banco de dados.

## ✨ Características Principais

### Funcionalidades
- ✅ **Encurtamento de URLs** com geração automática de códigos
- ✅ **Códigos Personalizados** - escolha seu próprio código curto
- ✅ **QR Codes** gerados automaticamente para cada link
- ✅ **Expiração de Links** - defina prazo de validade (1, 7, 30, 90 dias)
- ✅ **Estatísticas Detalhadas** - rastreamento de cliques e acessos
- ✅ **Busca e Paginação** - encontre seus links facilmente
- ✅ **Interface Responsiva** - funciona em desktop e mobile

### Segurança
- 🔒 **Rate Limiting** - proteção contra spam e abuso
- 🔒 **Validação Avançada de URLs** - bloqueia URLs maliciosas e IPs privados
- 🔒 **Helmet.js** - cabeçalhos de segurança HTTP
- 🔒 **Compressão** - respostas otimizadas

### Infraestrutura
- 🚀 **Docker/Docker Compose** - deploy simplificado
- 🚀 **Healthcheck** - monitoramento de saúde da aplicação
- 🚀 **Pool de Conexões** - otimização de banco de dados
- 🚀 **MySQL/MariaDB** compatível com versões 5.7+ e 10.3+

## 📋 Pré-requisitos

**Opção 1 - Docker (Recomendado):**
- Docker
- Docker Compose

**Opção 2 - Manual:**
- Node.js (versão 14+)
- MySQL 5.7+ ou MariaDB 10.3+

## 🚀 Instalação

### Opção 1: Docker (Recomendado)

A forma mais rápida e fácil de rodar o projeto:

```bash
# 1. Clonar o repositório
git clone <seu-repositorio>
cd encurtador

# 2. Copiar arquivo de configuração
cp .env.example .env

# 3. Editar .env com suas configurações (opcional)
nano .env

# 4. Iniciar com Docker Compose
docker-compose up -d

# 5. Verificar logs
docker-compose logs -f

# 6. Acessar
# http://localhost:3000
```

O Docker Compose irá:
- Criar e configurar o banco de dados MySQL automaticamente
- Instalar todas as dependências
- Iniciar a aplicação
- Configurar a rede entre os containers
- Criar volumes persistentes para os dados

**Comandos úteis:**
```bash
# Parar os containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga os dados)
docker-compose down -v

# Ver logs
docker-compose logs -f app

# Reiniciar apenas a aplicação
docker-compose restart app

# Entrar no container
docker-compose exec app sh
```

### Opção 2: Instalação Manual

**⚠️ Se você já tem o projeto rodando com dados:**
```bash
# 1. Instalar novas dependências
npm install

# 2. Executar migração do banco de dados
node migrate.js

# 3. Reiniciar o servidor
npm start
```

### 1. Instalar MySQL/MariaDB

**Windows:**
- MySQL: https://dev.mysql.com/downloads/installer/
- MariaDB: https://mariadb.org/download/

**Linux (Ubuntu/Debian):**
```bash
# MySQL
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql

# OU MariaDB
sudo apt install mariadb-server
sudo systemctl start mariadb
```

**macOS:**
```bash
# MySQL
brew install mysql
brew services start mysql

# OU MariaDB
brew install mariadb
brew services start mariadb
```

### 2. Criar o Banco de Dados

```bash
# Conectar ao MySQL/MariaDB
mysql -u root -p

# Criar banco de dados
CREATE DATABASE url_shortener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (opcional, mas recomendado)
CREATE USER 'urlshort_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON url_shortener.* TO 'urlshort_user'@'localhost';
FLUSH PRIVILEGES;

# Sair
EXIT;
```

### 3. Configurar o Projeto

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

Edite o arquivo `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=url_shortener
DB_USER=root
DB_PASSWORD=sua_senha_aqui
```

### 4. Iniciar o Servidor

```bash
npm start
```

Acesse: http://localhost:3000

## 🗄️ Estrutura do Banco de Dados

```sql
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  qr_code LONGTEXT,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP NULL,
  INDEX idx_short_code (short_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🔧 Configuração para Produção

### PlanetScale (MySQL na nuvem)

```bash
# Instalar CLI
brew install planetscale/tap/pscale

# Conectar
pscale auth login
pscale database create url-shortener

# Obter string de conexão
pscale connect url-shortener main
```

### DigitalOcean Managed MySQL

1. Crie um Managed MySQL Cluster
2. Configure o firewall
3. Use a connection string fornecida

### AWS RDS MySQL

1. Crie uma instância RDS MySQL
2. Configure security groups
3. Use o endpoint fornecido

## 🎨 Funcionalidades Detalhadas

### 1. Encurtamento de URLs
- Gera códigos curtos automaticamente (7 caracteres)
- Validação robusta de URLs
- Bloqueia URLs maliciosas e IPs privados
- Detecta URLs duplicadas

### 2. Códigos Personalizados
- Escolha seu próprio código curto (ex: `meu-link`)
- Validação de formato (3-30 caracteres, letras, números e hífens)
- Códigos reservados protegidos (api, admin, etc.)
- Verifica disponibilidade em tempo real

### 3. Expiração de Links
- Defina prazo de validade: 1, 7, 30 ou 90 dias
- Links expirados são automaticamente removidos
- Mensagem personalizada para links expirados
- Sem expiração por padrão

### 4. QR Codes
- Gerados automaticamente para cada link
- Download em formato PNG
- Alta qualidade e escaneáveis
- Armazenados no banco de dados

### 5. Estatísticas
- Contador de cliques
- Data/hora do último acesso
- Data de criação
- Modal visual com todas as informações
- Histórico completo de cada link

### 6. Busca e Paginação
- Busca por URL ou código curto
- Paginação de 10 itens por página
- Navegação rápida (primeira, anterior, próxima, última)
- Filtros em tempo real

### 7. Interface Moderna
- Design responsivo (mobile-first)
- Animações suaves
- Feedback visual para todas as ações
- Opções avançadas expansíveis
- Modal para estatísticas
- Copiar para área de transferência
- Tema moderno com gradientes

## 🔌 API Endpoints

| Método | Endpoint              | Descrição                           | Parâmetros                                      |
|--------|-----------------------|-------------------------------------|-------------------------------------------------|
| GET    | /health               | Healthcheck da aplicação            | -                                               |
| POST   | /api/shorten          | Criar link curto                    | `url`, `customCode` (opcional), `expiresIn` (opcional) |
| GET    | /api/urls             | Listar URLs com paginação e busca   | `page`, `limit`, `search` (query params)        |
| GET    | /api/stats/:code      | Ver estatísticas detalhadas         | -                                               |
| DELETE | /api/urls/:code       | Deletar URL                         | -                                               |
| GET    | /:shortCode           | Redirecionar para URL original      | -                                               |

### Exemplos de uso da API:

**Criar link simples:**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://exemplo.com"}'
```

**Criar link com código personalizado:**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://exemplo.com", "customCode": "meu-link"}'
```

**Criar link com expiração (7 dias):**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://exemplo.com", "expiresIn": 7}'
```

**Listar URLs com paginação:**
```bash
curl "http://localhost:3000/api/urls?page=1&limit=10"
```

**Buscar URLs:**
```bash
curl "http://localhost:3000/api/urls?search=exemplo"
```

**Ver estatísticas:**
```bash
curl http://localhost:3000/api/stats/abc123
```

**Healthcheck:**
```bash
curl http://localhost:3000/health
```

## 🐛 Troubleshooting

### Erro: "Access denied for user"
```bash
# Resetar senha do MySQL
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova_senha';
FLUSH PRIVILEGES;
```

### Erro: "Unknown database"
```bash
mysql -u root -p
CREATE DATABASE url_shortener;
```

### Erro: "Can't connect to MySQL server"
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql    # Linux
brew services list             # macOS

# Iniciar MySQL
sudo systemctl start mysql     # Linux
brew services start mysql      # macOS
```

### Erro: "Too many connections"
```sql
-- Aumentar limite de conexões
SET GLOBAL max_connections = 200;

-- Ou edite my.cnf:
[mysqld]
max_connections = 200
```

## 📊 MySQL vs MariaDB

**Ambos funcionam igualmente bem!**

**MySQL:**
- Mais popular
- Melhor para compatibilidade
- Propriedade Oracle

**MariaDB:**
- Open source completo
- Melhor performance em alguns casos
- Fork do MySQL

## ⚡ Otimizações

### Melhorar Performance

```sql
-- Otimizar tabela
OPTIMIZE TABLE urls;

-- Analisar tabela
ANALYZE TABLE urls;

-- Ver índices
SHOW INDEX FROM urls;
```

### Backup do Banco

```bash
# Fazer backup
mysqldump -u root -p url_shortener > backup.sql

# Restaurar backup
mysql -u root -p url_shortener < backup.sql
```

## 📝 Licença

MIT
