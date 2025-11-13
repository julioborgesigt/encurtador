# Painel Administrativo

## 📊 Visão Geral

O painel administrativo oferece uma interface completa para gerenciar o sistema de encurtamento de URLs, com métricas detalhadas, gerenciamento de usuários e ferramentas de manutenção.

## 🔐 Configuração de Acesso

### 1. Definir Administradores

Adicione os emails dos administradores no arquivo `.env`:

```env
ADMIN_EMAILS=seu-email@gmail.com,outro-admin@gmail.com
```

**Importante:**
- Use vírgula para separar múltiplos emails
- Os emails devem corresponder aos cadastrados via Google OAuth
- Sem espaços extras entre os emails

### 2. Acessar o Painel

Acesse: `http://seu-dominio.com/admin`

**Requisitos:**
- Estar logado com Google OAuth
- Email estar na lista de `ADMIN_EMAILS`

Se não tiver permissão, você verá uma mensagem de erro 403.

## 📈 Funcionalidades

### Dashboard

**Métricas Gerais:**
- Total de usuários cadastrados
- Total de links criados
- Total de cliques acumulados
- Tamanho do banco de dados
- Novos usuários (últimos 30 dias)
- Novos links (últimos 30 dias)

**Estatísticas Adicionais:**
- Links ativos vs expirados
- Links customizados vs gerados automaticamente
- Top 10 links mais clicados
- Atividade recente (últimos 20 links criados)

### Usuários

**Visualização:**
- Lista completa de usuários
- Total de links por usuário
- Total de cliques por usuário
- Data do último link criado
- Data de cadastro

**Ações:**
- Deletar usuário (e todos seus links)
- Paginação (50 usuários por página)

### Banco de Dados

**Informações:**
- Nome do banco
- Tamanho total em MB e bytes
- Estatísticas por tabela:
  - Número de registros
  - Tamanho dos dados
  - Tamanho dos índices
  - Tamanho total

### Manutenção

**Ferramentas:**
- Limpar links expirados
- Retorna quantidade de links removidos

## 🔒 Segurança

### Middleware de Autenticação

O painel possui dupla camada de proteção:

1. **Autenticação**: Usuário deve estar logado
2. **Autorização**: Email deve estar na lista de admins

### Exemplo de Código (middleware/admin.js):

```javascript
function ensureAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: 'Autenticação necessária'
        });
    }

    if (!isAdmin(req.user)) {
        return res.status(403).json({
            error: 'Acesso negado'
        });
    }

    next();
}
```

## 🗂️ Estrutura de Arquivos

```
/middleware
  admin.js              # Middleware de autenticação admin

/models
  Admin.js              # Queries SQL para métricas

/services
  adminService.js       # Lógica de negócio

/controllers
  adminController.js    # Handlers HTTP

/routes
  admin.js              # Rotas do painel

/public
  admin.html            # Interface do painel
  admin-styles.css      # Estilos
  admin-script.js       # JavaScript do frontend
```

## 🎯 Rotas da API

### GET /admin
Renderiza a página do painel administrativo

### GET /admin/api/dashboard
Retorna todas as métricas do sistema

**Resposta:**
```json
{
  "general": {
    "totalUsers": 10,
    "totalLinks": 150,
    "totalClicks": 3500,
    "recentLinks": 25,
    "recentUsers": 3,
    "activeLinks": 140,
    "expiredLinks": 10,
    "customLinks": 45,
    "generatedLinks": 105
  },
  "topLinks": [...],
  "recentActivity": [...],
  "database": {
    "database_name": "url_shortener",
    "size_bytes": 12345678,
    "size_mb": 11.77,
    "tables": [...]
  },
  "activityByDay": [...]
}
```

### GET /admin/api/users
Lista usuários com paginação

**Query params:**
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 50)

### DELETE /admin/api/users/:userId
Deleta usuário e todos seus links

### DELETE /admin/api/links/:linkId
Deleta link específico

### POST /admin/api/maintenance/clean-expired
Remove todos os links expirados

## 💡 Dicas de Uso

1. **Primeiro Acesso:**
   - Certifique-se de que seu email está no `.env`
   - Faça login via Google
   - Acesse `/admin`

2. **Segurança:**
   - Não compartilhe acesso admin com pessoas não autorizadas
   - Revise periodicamente a lista de admins no `.env`
   - Use HTTPS em produção

3. **Performance:**
   - O dashboard carrega todas as métricas de uma vez
   - Use o botão "Atualizar" para obter dados atualizados
   - Paginação automática na lista de usuários

4. **Manutenção:**
   - Execute limpeza de links expirados periodicamente
   - Monitore o tamanho do banco de dados
   - Acompanhe o crescimento de usuários e links

## 🐛 Troubleshooting

### Erro 401 (Não Autenticado)
- Faça login via Google OAuth primeiro
- Certifique-se de que a sessão não expirou

### Erro 403 (Acesso Negado)
- Verifique se seu email está em `ADMIN_EMAILS`
- Confirme que não há espaços extras no `.env`
- Reinicie o servidor após alterar o `.env`

### Dashboard não carrega
- Verifique conexão com o banco de dados
- Veja logs do servidor para erros SQL
- Certifique-se de que as tabelas existem

## 📊 Queries SQL Utilizadas

O painel executa queries otimizadas:

- Estatísticas com `COUNT`, `SUM`, `MAX`
- JOINs entre `users` e `urls`
- GROUP BY para agregações
- Date functions para filtros temporais
- Information_schema para métricas do BD

Todas as queries usam conexão pool para performance.

## 🚀 Melhorias Futuras

Possíveis expansões:

- [ ] Gráficos com Chart.js
- [ ] Export de relatórios (CSV, PDF)
- [ ] Notificações por email
- [ ] Logs de ações administrativas
- [ ] Filtros avançados de usuários
- [ ] Busca por links
- [ ] Estatísticas geográficas
- [ ] API rate limiting personalizado por usuário
