# 🔄 Guia de Migração - v2.0.0

## Problema
Você está vendo o erro: `Unknown column 'is_custom' in 'INSERT INTO'`

Isso acontece porque o banco de dados foi criado com a versão antiga e precisa ser atualizado.

## Solução Rápida

### Opção 1: Via phpMyAdmin (Recomendado para MySQL Remoto)

1. **Acesse seu phpMyAdmin** em https://sao.domcloud.co/phpmyadmin/

2. **Selecione o banco de dados** `url_shortener` no menu lateral

3. **Clique na aba "SQL"** no topo

4. **Copie e cole** o conteúdo do arquivo `migration.sql` na caixa de texto

5. **Clique em "Executar"** (botão "Go" ou "Executar")

6. **Verifique o resultado**:
   - Você deverá ver mensagens de sucesso
   - A última query mostrará a estrutura atualizada da tabela

### Opção 2: Via Linha de Comando (MySQL Local)

Se você tiver MySQL instalado localmente e configurado no `.env`:

```bash
# Execute o script de migração JavaScript
node migrate.js

# OU execute o SQL diretamente
mysql -u seu_usuario -p url_shortener < migration.sql
```

## O Que a Migração Faz?

A migração adiciona os seguintes campos à tabela `urls`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `is_custom` | BOOLEAN | Indica se o código foi personalizado pelo usuário |
| `expires_at` | TIMESTAMP | Data de expiração do link (NULL = sem expiração) |
| `idx_expires_at` | INDEX | Índice para otimizar queries de expiração |

E também:
- Aumenta o tamanho de `short_code` de VARCHAR(10) para VARCHAR(50)

## Verificar se a Migração Foi Bem-Sucedida

Após executar a migração, você pode verificar se funcionou:

1. **No phpMyAdmin**:
   - Selecione a tabela `urls`
   - Clique em "Estrutura"
   - Verifique se as colunas `is_custom` e `expires_at` aparecem

2. **Testando a aplicação**:
   ```bash
   node server.js
   ```
   - Acesse http://localhost:3000
   - Tente criar um link com código personalizado
   - Se funcionar sem erros, a migração foi bem-sucedida!

## Estrutura Final Esperada

```sql
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  qr_code LONGTEXT,
  clicks INT DEFAULT 0,
  is_custom BOOLEAN DEFAULT FALSE,        -- NOVO
  expires_at TIMESTAMP NULL,              -- NOVO
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP NULL,
  INDEX idx_short_code (short_code),
  INDEX idx_expires_at (expires_at)       -- NOVO
);
```

## Problemas Comuns

### Erro: "Table doesn't exist"
**Solução**: O banco de dados não foi criado. Execute primeiro:
```sql
CREATE DATABASE url_shortener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro: "Access denied"
**Solução**: Verifique suas credenciais no arquivo `.env`

### Erro: "Duplicate column name"
**Solução**: A migração já foi executada antes. Você pode ignorar este erro.

## Backup (Recomendado)

Antes de executar a migração, faça um backup:

### No phpMyAdmin:
1. Selecione o banco `url_shortener`
2. Clique em "Exportar"
3. Escolha "Rápido" e "SQL"
4. Clique em "Executar"
5. Salve o arquivo .sql

### Via linha de comando:
```bash
mysqldump -u seu_usuario -p url_shortener > backup_antes_migracao.sql
```

## Restaurar Backup (se algo der errado)

### No phpMyAdmin:
1. Selecione o banco `url_shortener`
2. Clique em "Importar"
3. Escolha o arquivo de backup
4. Clique em "Executar"

### Via linha de comando:
```bash
mysql -u seu_usuario -p url_shortener < backup_antes_migracao.sql
```

## Suporte

Se encontrar problemas:
1. Verifique os logs de erro do MySQL
2. Certifique-se de que tem permissões para ALTER TABLE
3. Verifique se o banco de dados correto está selecionado
4. Tente executar os comandos SQL um por um no phpMyAdmin

## Próximos Passos

Após a migração bem-sucedida:
1. Reinicie o servidor Node.js
2. Teste as novas funcionalidades:
   - Códigos personalizados
   - Expiração de links
   - Busca e paginação
3. Aproveite! 🎉
