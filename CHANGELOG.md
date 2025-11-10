# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2025-11-10

### ✨ Novas Funcionalidades

#### Códigos Personalizados
- Usuários podem escolher seus próprios códigos curtos (ex: `meu-link`)
- Validação: 3-30 caracteres, apenas letras, números e hífens
- Códigos reservados protegidos (api, admin, public, etc.)
- Verificação de disponibilidade em tempo real
- Badge visual "✨ Personalizado" na interface

#### Sistema de Expiração
- Links podem ter prazo de validade: 1, 7, 30 ou 90 dias
- Links expirados são automaticamente removidos ao serem acessados
- Mensagem HTTP 410 (Gone) para links expirados
- Indicador visual "⏰ Expira" com data na interface
- Sem expiração por padrão

#### Busca e Paginação
- Campo de busca em tempo real (debounce de 500ms)
- Busca por URL original ou código curto
- Paginação de 10 itens por página
- Navegação completa: primeira, anterior, próxima, última
- Contador de páginas e total de resultados
- Query params: `page`, `limit`, `search`

#### Modal de Estatísticas
- Interface visual moderna e elegante
- Substitui alerts por modal interativo
- Informações detalhadas e organizadas
- Fechar ao clicar fora ou no botão X
- Design responsivo

#### Healthcheck
- Endpoint `/health` para monitoramento
- Retorna status da aplicação e conexão com banco
- Útil para load balancers e orquestradores
- Integrado com Docker healthcheck

#### Opções Avançadas
- Seção expansível no formulário
- Campos organizados e intuitivos
- Tooltips e validação em tempo real
- Design limpo e minimalista

### 🔒 Segurança

#### Rate Limiting
- Limite geral: 100 requisições por 15 minutos
- Criação de links: 10 por minuto
- Mensagens de erro personalizadas
- Headers padrão: `RateLimit-*`

#### Validação Avançada de URLs
- Bloqueia IPs privados em produção (10.x, 192.168.x, 172.16-31.x)
- Bloqueia localhost em produção (127.0.0.1, 0.0.0.0)
- Valida protocolo (apenas HTTP/HTTPS)
- Usa biblioteca validator.js para validação robusta
- Previne ataques SSRF (Server-Side Request Forgery)

#### Helmet.js
- Cabeçalhos de segurança HTTP automatizados
- Proteção contra XSS, clickjacking, MIME sniffing
- Content Security Policy configurável
- Configuração otimizada para QR Codes inline

#### Compressão HTTP
- Respostas comprimidas automaticamente
- Reduz uso de banda em até 70%
- Melhora performance de rede
- Transparente para o cliente

### 🚀 Infraestrutura

#### Docker e Docker Compose
- `Dockerfile` otimizado com Node 18 Alpine
- Multi-stage build para menor tamanho
- `docker-compose.yml` completo com MySQL
- Networking automático entre containers
- Volumes persistentes para dados
- Healthcheck nativo
- Variáveis de ambiente configuráveis
- Deploy com um comando: `docker-compose up -d`

#### Banco de Dados
- Novo campo `is_custom` (BOOLEAN)
- Novo campo `expires_at` (TIMESTAMP)
- Índice em `expires_at` para queries rápidas
- `short_code` aumentado para VARCHAR(50)
- Script de migração (`migrate.js`) para atualizar tabelas existentes

### 🎨 Interface

#### Melhorias Visuais
- Badges para links personalizados (✨)
- Badges para links com expiração (⏰)
- Cores e ícones informativos
- Animações suaves e transições
- Feedback visual para todas as ações
- Loading states aprimorados

#### UX Aprimorada
- Busca com debounce (500ms)
- Paginação intuitiva
- Modal moderna para estatísticas
- Opções avançadas expansíveis
- Validação em tempo real
- Mensagens de erro claras
- Auto-limpeza de campos após criar link

### 📊 API

#### Novos Parâmetros
- `POST /api/shorten`:
  - `customCode` (opcional): código personalizado
  - `expiresIn` (opcional): dias até expiração
- `GET /api/urls`:
  - `page` (query param): número da página
  - `limit` (query param): itens por página
  - `search` (query param): termo de busca
- `GET /health`: novo endpoint de healthcheck

#### Mudanças na Resposta
- Todas as respostas de URLs agora incluem:
  - `is_custom`: boolean
  - `expires_at`: timestamp ou null
- Response de `/api/urls` agora retorna objeto com:
  - `urls`: array de URLs
  - `pagination`: objeto com page, limit, total, totalPages

### 📝 Documentação

- README completamente reescrito
- Instruções detalhadas de instalação
- Guia completo de funcionalidades
- Exemplos de uso da API com curl
- Troubleshooting expandido
- Comandos Docker documentados
- Arquitetura explicada

### 🛠️ Dependências Adicionadas

```json
{
  "express-rate-limit": "^7.1.5",
  "compression": "^1.7.4",
  "helmet": "^7.1.0",
  "validator": "^13.11.0"
}
```

### ⚠️ Breaking Changes

1. **Estrutura do Banco de Dados**: Novos campos adicionados
   - **Solução**: Execute `node migrate.js` para atualizar tabelas existentes

2. **API Response Format**: `/api/urls` agora retorna objeto com paginação
   - **Antes**: `[{url1}, {url2}, ...]`
   - **Depois**: `{urls: [...], pagination: {...}}`
   - **Solução**: Atualize clients para usar `response.urls`

3. **Rate Limiting**: Novos limites podem afetar integrações
   - **Solução**: Ajuste `windowMs` e `max` em `server.js` se necessário

### 🔧 Migração

Para usuários existentes:

```bash
# 1. Fazer backup do banco de dados
mysqldump -u root -p url_shortener > backup.sql

# 2. Atualizar código
git pull origin main

# 3. Instalar novas dependências
npm install

# 4. Executar migração
node migrate.js

# 5. Reiniciar servidor
npm start
```

### 📈 Estatísticas

- **10 arquivos modificados**
- **944 linhas adicionadas**
- **114 linhas removidas**
- **4 novos arquivos criados**
- **4 novas funcionalidades principais**
- **4 melhorias de segurança**
- **0 vulnerabilidades encontradas**

## [1.0.0] - 2025-11-09

### Versão Inicial

- Encurtamento básico de URLs
- Geração automática de QR Codes
- Listagem de URLs criadas
- Contador de cliques
- Interface web responsiva
- MySQL/MariaDB como banco de dados
- API REST básica
