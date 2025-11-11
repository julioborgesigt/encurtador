# 🔐 Guia de Configuração - Google OAuth 2.0

Este guia mostra como configurar a autenticação com Google OAuth 2.0 no seu encurtador de URLs.

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Node.js instalado
- Banco de dados MySQL/MariaDB configurado
- Aplicação já funcionando sem autenticação

## 🚀 Passo a Passo

### 1️⃣ Instalar Dependências

Execute no terminal:

```bash
npm install
```

Isso instalará as novas dependências:
- `passport` - Framework de autenticação
- `passport-google-oauth20` - Estratégia Google OAuth
- `express-session` - Gerenciamento de sessões
- `express-mysql-session` - Armazenamento de sessões no MySQL

### 2️⃣ Executar Migração do Banco de Dados

Você tem duas opções:

#### Opção A: Via Script Node.js (Recomendado para MySQL local)

```bash
node migrate-auth.js
```

#### Opção B: Via phpMyAdmin (Para MySQL remoto)

1. Acesse seu phpMyAdmin
2. Selecione o banco `url_shortener`
3. Clique na aba "SQL"
4. Copie e cole o conteúdo de `migration-auth.sql`
5. Clique em "Executar"

**O que a migração faz:**
- Cria tabela `users` para armazenar dados dos usuários
- Cria tabela `sessions` para gerenciar sessões
- Adiciona coluna `user_id` na tabela `urls` para relacionar URLs com usuários
- Cria índices para otimizar consultas

### 3️⃣ Criar Projeto no Google Cloud Console

1. **Acesse o Google Cloud Console**
   - Vá para: https://console.cloud.google.com/

2. **Criar Novo Projeto**
   - Clique em "Selecionar um projeto" no topo
   - Clique em "NOVO PROJETO"
   - Nome: `URL Shortener` (ou o nome que preferir)
   - Clique em "Criar"
   - Aguarde alguns segundos e selecione o projeto criado

3. **Ativar a API do Google+**
   - No menu lateral, vá em "APIs e serviços" > "Biblioteca"
   - Procure por "Google+ API"
   - Clique em "Google+ API"
   - Clique em "ATIVAR"

### 4️⃣ Configurar Tela de Consentimento OAuth

1. **Acessar Configurações**
   - Menu lateral: "APIs e serviços" > "Tela de consentimento OAuth"

2. **Escolher Tipo de Usuário**
   - Selecione "Externo" (permite que qualquer pessoa com conta Google faça login)
   - Clique em "CRIAR"

3. **Preencher Informações do App**
   - **Nome do app**: URL Shortener
   - **E-mail de suporte do usuário**: seu-email@gmail.com
   - **Logotipo do app**: (opcional)
   - **Domínio do app**: (deixe em branco por enquanto)
   - **Domínio autorizado**: (deixe em branco por enquanto)
   - **Informações de contato do desenvolvedor**: seu-email@gmail.com
   - Clique em "SALVAR E CONTINUAR"

4. **Escopos (Scopes)**
   - Clique em "ADICIONAR OU REMOVER ESCOPOS"
   - Selecione:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Clique em "ATUALIZAR"
   - Clique em "SALVAR E CONTINUAR"

5. **Usuários de teste** (opcional no modo desenvolvimento)
   - Adicione seu e-mail como usuário de teste
   - Clique em "SALVAR E CONTINUAR"

6. **Resumo**
   - Revise as informações
   - Clique em "VOLTAR PARA O PAINEL"

### 5️⃣ Criar Credenciais OAuth 2.0

1. **Criar Credenciais**
   - Menu lateral: "APIs e serviços" > "Credenciais"
   - Clique em "+ CRIAR CREDENCIAIS"
   - Selecione "ID do cliente OAuth"

2. **Configurar Client ID**
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: URL Shortener Web Client

3. **Configurar URIs Autorizados**

   **Para Desenvolvimento (localhost):**
   - **Origens JavaScript autorizadas:**
     ```
     http://localhost:3000
     ```

   - **URIs de redirecionamento autorizados:**
     ```
     http://localhost:3000/auth/google/callback
     ```

   **Para Produção (substitua pelo seu domínio):**
   - **Origens JavaScript autorizadas:**
     ```
     https://seudominio.com
     ```

   - **URIs de redirecionamento autorizados:**
     ```
     https://seudominio.com/auth/google/callback
     ```

4. **Criar e Copiar Credenciais**
   - Clique em "CRIAR"
   - Uma janela aparecerá com:
     - **ID do cliente** (Client ID)
     - **Chave secreta do cliente** (Client Secret)
   - **COPIE ESTES VALORES** (você vai precisar deles no próximo passo)

### 6️⃣ Configurar Variáveis de Ambiente

1. **Criar arquivo `.env`**

   Se ainda não existe, copie o exemplo:
   ```bash
   cp .env.example .env
   ```

2. **Editar arquivo `.env`**

   Abra o arquivo `.env` e adicione/atualize:

   ```env
   # Configuração do Servidor
   PORT=3000
   NODE_ENV=development

   # Configuração do MySQL/MariaDB
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=url_shortener
   DB_USER=root
   DB_PASSWORD=sua_senha_aqui

   # Configuração de Sessão
   # IMPORTANTE: Gere um secret forte em produção!
   SESSION_SECRET=cole-aqui-uma-string-aleatoria-muito-longa-e-secreta

   # Configuração do Google OAuth 2.0
   GOOGLE_CLIENT_ID=cole-aqui-o-client-id-copiado
   GOOGLE_CLIENT_SECRET=cole-aqui-o-client-secret-copiado
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

   **Dicas importantes:**
   - O `SESSION_SECRET` deve ser uma string aleatória longa
   - Você pode gerar um secret forte em: https://randomkeygen.com/
   - Em produção, use HTTPS e atualize a `GOOGLE_CALLBACK_URL`

### 7️⃣ Testar a Aplicação

1. **Iniciar o servidor**
   ```bash
   node server.js
   ```

2. **Acessar no navegador**
   ```
   http://localhost:3000
   ```

3. **Testar login**
   - Clique no botão "Entrar com Google"
   - Selecione sua conta Google
   - Autorize o acesso
   - Você será redirecionado de volta para a aplicação

4. **Verificar autenticação**
   - Você deve ver seu nome e foto no canto superior direito
   - Clique na sua foto para ver o menu
   - Teste criar um link curto (agora ficará associado à sua conta)
   - Teste fazer logout

## 🔒 Segurança e Boas Práticas

### Em Desenvolvimento

✅ Pode usar HTTP (http://localhost:3000)
✅ Pode usar credenciais de teste
✅ SESSION_SECRET pode ser simples

### Em Produção

⚠️ **OBRIGATÓRIO usar HTTPS** (https://seudominio.com)
⚠️ **Gerar SESSION_SECRET forte e único**
⚠️ **Atualizar URIs no Google Cloud Console**
⚠️ **Publicar app OAuth** (remover status de teste)
⚠️ **Nunca commitar o arquivo `.env`** no Git

### Configuração em Produção

1. **Atualizar `.env` em produção:**
   ```env
   NODE_ENV=production
   SESSION_SECRET=secret-super-forte-aleatorio-diferente-do-desenvolvimento
   GOOGLE_CALLBACK_URL=https://seudominio.com/auth/google/callback
   ```

2. **Atualizar Google Cloud Console:**
   - Adicionar domínio de produção nas origens autorizadas
   - Adicionar callback URL de produção
   - Publicar o app OAuth (para permitir qualquer usuário)

3. **Certificado SSL:**
   - Obtenha um certificado SSL/TLS (Let's Encrypt é grátis)
   - Configure seu servidor web (nginx, Apache) para usar HTTPS

## 🐛 Solução de Problemas

### Erro: "redirect_uri_mismatch"

**Causa:** A URL de callback não está registrada no Google Cloud Console

**Solução:**
1. Verifique se a URL no `.env` está exatamente igual à registrada no Google
2. Não esqueça do `/auth/google/callback` no final
3. Verifique se o protocolo (http/https) está correto
4. Em produção, certifique-se de estar usando HTTPS

### Erro: "Access blocked: Authorization Error"

**Causa:** App OAuth ainda está em modo de teste e o e-mail não está na lista

**Solução:**
- Adicione seu e-mail nos "Usuários de teste" no Google Cloud Console
- OU publique o app OAuth para permitir qualquer usuário

### Erro: "Session secret is not set"

**Causa:** Variável `SESSION_SECRET` não está configurada no `.env`

**Solução:**
- Adicione `SESSION_SECRET=seu-secret-aqui` no arquivo `.env`
- Reinicie o servidor

### Erro: "Table 'users' doesn't exist"

**Causa:** Migração do banco de dados não foi executada

**Solução:**
- Execute `node migrate-auth.js`
- OU execute `migration-auth.sql` no phpMyAdmin

### Login funciona mas não mantém sessão

**Causa:** Problema com armazenamento de sessões

**Solução:**
1. Verifique se a tabela `sessions` foi criada no banco
2. Verifique as credenciais do banco no `.env`
3. Reinicie o servidor após mudar o `.env`

## 📚 Estrutura de Arquivos Criados

```
encurtador/
├── config/
│   └── passport.js              # Configuração do Passport e Google OAuth
├── middleware/
│   └── auth.js                  # Middlewares de autenticação
├── routes/
│   └── auth.js                  # Rotas de autenticação (/auth/*)
├── migration-auth.sql           # Migração SQL para autenticação
├── migrate-auth.js              # Script Node.js para migração
├── SETUP_GOOGLE_OAUTH.md        # Este arquivo
└── .env.example                 # Exemplo de variáveis de ambiente
```

## 🎯 Funcionalidades Implementadas

✅ Login com Google (OAuth 2.0)
✅ Logout
✅ Sessões persistentes no MySQL
✅ URLs associadas a usuários
✅ Proteção de rotas (delete requer autenticação)
✅ Menu de usuário com foto e nome
✅ Interface responsiva para mobile
✅ Compatibilidade com URLs criadas antes do sistema de auth

## 📊 Como Funciona

1. **Usuário não autenticado:**
   - Vê botão "Entrar com Google"
   - Pode criar links, mas não ficam associados a nenhum usuário
   - Pode ver apenas links sem dono (criados antes do auth)

2. **Usuário autenticado:**
   - Vê menu com nome e foto
   - Links criados ficam associados ao seu usuário
   - Pode ver apenas seus próprios links (e links sem dono)
   - Pode deletar apenas seus próprios links

3. **Sessão:**
   - Duração: 24 horas
   - Armazenada no MySQL (tabela `sessions`)
   - Renovada automaticamente a cada interação

## 🆘 Precisa de Ajuda?

- **Documentação oficial do Google OAuth:**
  https://developers.google.com/identity/protocols/oauth2

- **Documentação do Passport.js:**
  http://www.passportjs.org/

- **Problemas com o código:**
  Abra uma issue no repositório do projeto

## ✨ Próximos Passos (Opcional)

Funcionalidades que você pode adicionar:

- [ ] Dashboard de estatísticas por usuário
- [ ] Limite de links por usuário (free vs premium)
- [ ] Compartilhamento de links entre usuários
- [ ] API com autenticação JWT
- [ ] Notificações por e-mail
- [ ] Múltiplos provedores OAuth (Facebook, GitHub, etc.)
- [ ] Autenticação de dois fatores (2FA)

---

**Parabéns! 🎉** Seu encurtador de URLs agora tem autenticação profissional com Google OAuth 2.0!
