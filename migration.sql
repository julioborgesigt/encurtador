-- ============================================================
-- SCRIPT DE MIGRAÇÃO - URL Shortener v2.0.0
-- ============================================================
-- Execute este script no phpMyAdmin para atualizar a estrutura
-- do banco de dados com as novas funcionalidades
-- ============================================================

USE url_shortener;

-- Verificar e adicionar coluna is_custom
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urls'
    AND COLUMN_NAME = 'is_custom'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE urls ADD COLUMN is_custom BOOLEAN DEFAULT FALSE AFTER clicks',
    'SELECT "Coluna is_custom já existe" as Info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna expires_at
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urls'
    AND COLUMN_NAME = 'expires_at'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE urls ADD COLUMN expires_at TIMESTAMP NULL AFTER is_custom',
    'SELECT "Coluna expires_at já existe" as Info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar índice idx_expires_at
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urls'
    AND INDEX_NAME = 'idx_expires_at'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE urls ADD INDEX idx_expires_at (expires_at)',
    'SELECT "Índice idx_expires_at já existe" as Info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e aumentar tamanho da coluna short_code
SET @col_size = (
    SELECT CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urls'
    AND COLUMN_NAME = 'short_code'
);

SET @sql = IF(@col_size < 50,
    'ALTER TABLE urls MODIFY COLUMN short_code VARCHAR(50) UNIQUE NOT NULL',
    'SELECT "Coluna short_code já tem tamanho adequado" as Info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Exibir estrutura final da tabela
DESCRIBE urls;

SELECT
    '✅ Migração concluída com sucesso!' as Status,
    'Tabela atualizada com novos campos: is_custom, expires_at' as Detalhes;
