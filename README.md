# 🔗 URL Shortener - Versão MySQL/MariaDB

Sistema web completo para criar links curtos e QR codes usando MySQL ou MariaDB como banco de dados.

## 🎯 Características desta Versão

- ✅ **MySQL/MariaDB** como banco de dados
- ✅ Compatível com MySQL 5.7+ e MariaDB 10.3+
- ✅ Pool de conexões otimizado
- ✅ Configuração via variáveis de ambiente
- ✅ Suporte UTF-8 completo

## 📋 Pré-requisitos

- Node.js (versão 14+)
- MySQL 5.7+ ou MariaDB 10.3+

## 🚀 Instalação

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

## 🎨 Funcionalidades

- Encurtar URLs
- Gerar QR codes automaticamente
- Rastrear cliques
- Ver estatísticas
- Interface responsiva
- API REST completa

## 🔌 API Endpoints

| Método | Endpoint              | Descrição           |
|--------|-----------------------|---------------------|
| POST   | /api/shorten          | Criar link curto    |
| GET    | /api/urls             | Listar todas URLs   |
| GET    | /api/stats/:code      | Ver estatísticas    |
| DELETE | /api/urls/:code       | Deletar URL         |
| GET    | /:shortCode           | Redirecionar        |

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
