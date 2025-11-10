-- ============================================================
-- MIGRAÇÃO SIMPLIFICADA - URL Shortener v2.0.0
-- ============================================================
-- INSTRUÇÕES:
-- 1. Acesse seu phpMyAdmin
-- 2. Selecione o banco 'url_shortener'
-- 3. Vá na aba SQL
-- 4. Cole ESTE CÓDIGO COMPLETO
-- 5. Clique em "Executar"
-- ============================================================

-- Adicionar coluna is_custom (se não existir)
ALTER TABLE urls
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE AFTER clicks;

-- Adicionar coluna expires_at (se não existir)
ALTER TABLE urls
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL AFTER is_custom;

-- Adicionar índice em expires_at (se não existir)
ALTER TABLE urls
ADD INDEX IF NOT EXISTS idx_expires_at (expires_at);

-- Aumentar tamanho do short_code
ALTER TABLE urls
MODIFY COLUMN short_code VARCHAR(50) UNIQUE NOT NULL;

-- Verificar estrutura final
DESCRIBE urls;
