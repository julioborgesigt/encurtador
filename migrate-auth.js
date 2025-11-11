/**
 * Script de migração para adicionar sistema de autenticação
 * Execute este script se você já tem dados no banco de dados
 *
 * Uso: node migrate-auth.js
 */

const pool = require('./database');
require('dotenv').config();

async function migrateAuth() {
  console.log('🔄 Iniciando migração do sistema de autenticação...\n');

  try {
    const connection = await pool.getConnection();

    // Criar tabela de usuários
    console.log('📝 Criando tabela users...');
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Tabela users criada/verificada com sucesso!');

    // Criar tabela de sessões
    console.log('\n📝 Criando tabela sessions...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL PRIMARY KEY,
        expires INT(11) UNSIGNED NOT NULL,
        data MEDIUMTEXT,
        INDEX idx_expires (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Tabela sessions criada/verificada com sucesso!');

    // Verificar se a coluna user_id existe na tabela urls
    console.log('\n📝 Verificando coluna user_id na tabela urls...');
    const [userIdExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND COLUMN_NAME = 'user_id'
    `);

    if (userIdExists[0].count === 0) {
      console.log('   ➕ Adicionando coluna user_id...');
      await connection.query(`
        ALTER TABLE urls
        ADD COLUMN user_id INT DEFAULT NULL AFTER id
      `);
      console.log('   ✅ Coluna user_id adicionada com sucesso!');
    } else {
      console.log('   ℹ️  Coluna user_id já existe');
    }

    // Verificar se a foreign key existe
    console.log('\n📝 Verificando foreign key fk_user_id...');
    const [fkExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND CONSTRAINT_NAME = 'fk_user_id'
    `);

    if (fkExists[0].count === 0) {
      console.log('   ➕ Adicionando foreign key fk_user_id...');
      await connection.query(`
        ALTER TABLE urls
        ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Foreign key fk_user_id adicionada com sucesso!');
    } else {
      console.log('   ℹ️  Foreign key fk_user_id já existe');
    }

    // Verificar se o índice em user_id existe
    console.log('\n📝 Verificando índice idx_user_id...');
    const [indexExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND INDEX_NAME = 'idx_user_id'
    `);

    if (indexExists[0].count === 0) {
      console.log('   ➕ Criando índice idx_user_id...');
      await connection.query(`
        ALTER TABLE urls
        ADD INDEX idx_user_id (user_id)
      `);
      console.log('   ✅ Índice idx_user_id criado com sucesso!');
    } else {
      console.log('   ℹ️  Índice idx_user_id já existe');
    }

    connection.release();

    console.log('\n✅ Migração de autenticação concluída com sucesso!\n');
    console.log('📊 Novas estruturas criadas:');
    console.log('   - users: tabela de usuários do Google OAuth');
    console.log('   - sessions: tabela de sessões');
    console.log('   - urls.user_id: relacionamento com usuários\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  }
}

// Executar migração
migrateAuth();
