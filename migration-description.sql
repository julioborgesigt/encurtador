-- ============================================================
-- MIGRAÇÃO - Adicionar campo DESCRIPTION
-- ============================================================
-- Execute este script no phpMyAdmin para adicionar o campo
-- de descrição à tabela existente
-- ============================================================

USE url_shortener;

-- Adicionar coluna description (se não existir)
ALTER TABLE urls
ADD COLUMN IF NOT EXISTS description VARCHAR(255) DEFAULT NULL AFTER short_code;

-- Adicionar índice em created_at para otimizar filtros de data
ALTER TABLE urls
ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Verificar estrutura final
DESCRIBE urls;

SELECT '✅ Migração concluída! Campo description adicionado.' as Status;
