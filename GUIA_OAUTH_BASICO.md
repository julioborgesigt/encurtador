# 🔐 Guia Básico - Configurar Google OAuth 2.0

Guia rápido e prático para configurar autenticação com Google no seu encurtador de URLs.

---

## 📋 O que você precisa

- Conta Google (Gmail)
- 15-20 minutos
- Acesso ao phpMyAdmin ou MySQL

---

## 🚀 Passo 1: Instalar Dependências (2 minutos)

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Aguarde a instalação das novas dependências:
- `passport`
- `passport-google-oauth20`
- `express-session`
- `express-mysql-session`

---

## 🗄️ Passo 2: Atualizar Banco de Dados (3 minutos)

### Se você tem MySQL local:

```bash
node migrate-auth.js
```

### Se você usa phpMyAdmin (recomendado):

1. Acesse seu **phpMyAdmin**
2. Selecione o banco **`url_shortener`**
3. Clique na aba **"SQL"** (no topo)
4. **Copie e cole** o código abaixo:

```sql
-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  expires INT(11) UNSIGNED NOT NULL,
  data MEDIUMTEXT,
  INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna user_id na tabela urls
ALTER TABLE urls ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL AFTER id;

-- Adicionar foreign key
ALTER TABLE urls ADD CONSTRAINT fk_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Adicionar índice
ALTER TABLE urls ADD INDEX IF NOT EXISTS idx_user_id (user_id);
```

5. Clique em **"Executar"**
6. Confirme que apareceu **"✅ Sucesso"**

---

## 🔑 Passo 3: Criar Projeto no Google Cloud (8 minutos)

### 3.1 - Acessar Google Cloud Console

Vá para: **https://console.cloud.google.com/**

### 3.2 - Criar Novo Projeto

1. Clique em **"Selecionar um projeto"** (topo da página)
2. Clique em **"NOVO PROJETO"**
3. **Nome do projeto**: `Encurtador de URLs` (ou qualquer nome)
4. Clique em **"Criar"**
5. Aguarde 5-10 segundos
6. Selecione o projeto criado no menu dropdown

### 3.3 - Configurar Tela de Consentimento

1. No menu lateral esquerdo: **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"**
3. Clique em **"CRIAR"**

**Preencha o formulário:**

| Campo | O que colocar |
|-------|---------------|
| **Nome do app** | `Encurtador de URLs` |
| **E-mail de suporte do usuário** | seu-email@gmail.com |
| **Informações de contato do desenvolvedor** | seu-email@gmail.com |

4. Clique em **"SALVAR E CONTINUAR"** (3 vezes até chegar no resumo)
5. Clique em **"VOLTAR PARA O PAINEL"**

### 3.4 - Criar Credenciais OAuth

1. Menu lateral: **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** (topo)
3. Selecione **"ID do cliente OAuth"**

**Configure:**

| Campo | Valor |
|-------|-------|
| **Tipo de aplicativo** | Aplicativo da Web |
| **Nome** | `Encurtador Web Client` |

**Origens JavaScript autorizadas:**
```
http://localhost:3000
```

**URIs de redirecionamento autorizados:**
```
http://localhost:3000/auth/google/callback
```

4. Clique em **"CRIAR"**

### 3.5 - Copiar Credenciais

Aparecerá uma janela com:

- **ID do cliente**: `123456789-abc...apps.googleusercontent.com`
- **Chave secreta do cliente**: `GOCSPX-abc123...`

⚠️ **COPIE ESTES VALORES** - você vai usar no próximo passo!

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente (2 minutos)

### 4.1 - Criar arquivo .env

Na pasta do projeto, **crie um arquivo chamado `.env`** (sem extensão)

Ou copie o exemplo:
```bash
cp .env.example .env
```

### 4.2 - Editar o arquivo .env

Abra o arquivo `.env` e cole:

```env
# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Configuração do MySQL/MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_NAME=url_shortener
DB_USER=root
DB_PASSWORD=SUA_SENHA_DO_MYSQL_AQUI

# Configuração de Sessão
SESSION_SECRET=mude-isso-para-uma-string-aleatoria-muito-longa-123456

# Configuração do Google OAuth 2.0
GOOGLE_CLIENT_ID=COLE_AQUI_O_CLIENT_ID_DO_PASSO_3.5
GOOGLE_CLIENT_SECRET=COLE_AQUI_O_CLIENT_SECRET_DO_PASSO_3.5
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Substitua:**
- `SUA_SENHA_DO_MYSQL_AQUI` → senha do seu MySQL/phpMyAdmin
- `GOOGLE_CLIENT_ID` → Client ID copiado no passo 3.5
- `GOOGLE_CLIENT_SECRET` → Client Secret copiado no passo 3.5

**Dica:** Para gerar um SESSION_SECRET forte, use: https://randomkeygen.com/

---

## ▶️ Passo 5: Testar (2 minutos)

### 5.1 - Iniciar o servidor

```bash
node server.js
```

Deve aparecer:
```
🚀 Servidor rodando em http://localhost:3000
📊 Usando MySQL/MariaDB como banco de dados
```

### 5.2 - Acessar no navegador

Abra: **http://localhost:3000**

### 5.3 - Testar login

1. **Clique no botão "Entrar com Google"** (canto superior direito)
2. **Selecione sua conta Google**
3. **Clique em "Permitir"** quando pedir permissões
4. Você será redirecionado de volta para o site
5. **Verifique:** seu nome e foto devem aparecer no canto superior direito ✅

### 5.4 - Testar funcionalidades

- ✅ Criar um link curto (ficará associado à sua conta)
- ✅ Clicar na sua foto para ver o menu dropdown
- ✅ Fazer logout
- ✅ Fazer login novamente

---

## ✅ Pronto!

Se tudo funcionou, seu encurtador agora tem:

- 🔐 Login com Google
- 👤 Sessões de usuário
- 🔗 Links associados a usuários
- 🗑️ Proteção de delete (só você pode deletar seus links)
- 📊 Visualização filtrada (só vê seus próprios links)

---

## ❌ Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Solução:**
1. Volte no Google Cloud Console
2. Verifique se a URL está **exatamente assim**: `http://localhost:3000/auth/google/callback`
3. Não pode ter espaços ou caracteres extras

### Erro: "Session secret is not set"

**Solução:**
1. Verifique se o arquivo `.env` existe na pasta do projeto
2. Verifique se tem a linha `SESSION_SECRET=...`
3. Reinicie o servidor após editar o `.env`

### Erro: "Table 'users' doesn't exist"

**Solução:**
1. Volte no **Passo 2** e execute a migração SQL
2. Confirme no phpMyAdmin que as tabelas `users` e `sessions` foram criadas

### Login não mantém sessão

**Solução:**
1. Verifique se a tabela `sessions` existe no banco
2. Verifique as credenciais do MySQL no arquivo `.env`
3. Reinicie o servidor

### Erro: "Access blocked: Authorization Error"

**Solução:**
1. No Google Cloud Console, vá em "Tela de consentimento OAuth"
2. Clique em "Adicionar usuários" na seção "Usuários de teste"
3. Adicione seu email do Gmail
4. Salve e tente fazer login novamente

---

## 🔒 Segurança - Checklist

Antes de colocar em produção:

- [ ] Mudar `SESSION_SECRET` para algo forte e aleatório
- [ ] Mudar `NODE_ENV` para `production`
- [ ] Usar HTTPS (obrigatório em produção)
- [ ] Atualizar callback URL no Google Cloud para `https://seudominio.com/auth/google/callback`
- [ ] Nunca commitar o arquivo `.env` no Git

---

## 📱 Testando em Produção

Quando colocar online:

1. **Atualize o `.env` de produção:**
   ```env
   NODE_ENV=production
   GOOGLE_CALLBACK_URL=https://seudominio.com/auth/google/callback
   ```

2. **Adicione no Google Cloud Console:**
   - Origem autorizada: `https://seudominio.com`
   - Callback: `https://seudominio.com/auth/google/callback`

3. **Obtenha um certificado SSL:**
   - Use Let's Encrypt (gratuito): https://letsencrypt.org/

---

## 📞 Precisa de Ajuda?

**Documentação oficial:**
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Passport.js: http://www.passportjs.org/

**Arquivo criado com sucesso?**
- Teste fazendo login com sua conta Google
- Crie alguns links para ver a associação funcionando
- Faça logout e login novamente para testar as sessões

---

**Parabéns! 🎉** Seu encurtador agora tem autenticação profissional!
