-- ============================================================
-- MIGRAÇÃO - Sistema de Autenticação Google OAuth 2.0
-- ============================================================
-- Execute este script no phpMyAdmin para adicionar suporte
-- a autenticação de usuários
-- ============================================================

USE url_shortener;

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

-- Adicionar coluna user_id na tabela urls (se não existir)
ALTER TABLE urls
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL AFTER id,
ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Adicionar índice em user_id
ALTER TABLE urls
ADD INDEX IF NOT EXISTS idx_user_id (user_id);

-- Verificar estrutura final
DESCRIBE users;
DESCRIBE sessions;
DESCRIBE urls;

SELECT '✅ Migração de autenticação concluída!' as Status;
