/**
 * Script de migração para adicionar novos campos à tabela existente
 * Execute este script se você já tem dados no banco de dados
 *
 * Uso: node migrate.js
 */

const pool = require('./database');
require('dotenv').config();

async function migrate() {
  console.log('🔄 Iniciando migração do banco de dados...\n');

  try {
    const connection = await pool.getConnection();

    // Verificar se a coluna is_custom existe
    console.log('📝 Verificando coluna is_custom...');
    const [isCustomExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND COLUMN_NAME = 'is_custom'
    `);

    if (isCustomExists[0].count === 0) {
      console.log('   ➕ Adicionando coluna is_custom...');
      await connection.query(`
        ALTER TABLE urls
        ADD COLUMN is_custom BOOLEAN DEFAULT FALSE AFTER clicks
      `);
      console.log('   ✅ Coluna is_custom adicionada com sucesso!');
    } else {
      console.log('   ℹ️  Coluna is_custom já existe');
    }

    // Verificar se a coluna expires_at existe
    console.log('\n📝 Verificando coluna expires_at...');
    const [expiresAtExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND COLUMN_NAME = 'expires_at'
    `);

    if (expiresAtExists[0].count === 0) {
      console.log('   ➕ Adicionando coluna expires_at...');
      await connection.query(`
        ALTER TABLE urls
        ADD COLUMN expires_at TIMESTAMP NULL AFTER is_custom
      `);
      console.log('   ✅ Coluna expires_at adicionada com sucesso!');
    } else {
      console.log('   ℹ️  Coluna expires_at já existe');
    }

    // Verificar se o índice em expires_at existe
    console.log('\n📝 Verificando índice idx_expires_at...');
    const [indexExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND INDEX_NAME = 'idx_expires_at'
    `);

    if (indexExists[0].count === 0) {
      console.log('   ➕ Criando índice idx_expires_at...');
      await connection.query(`
        ALTER TABLE urls
        ADD INDEX idx_expires_at (expires_at)
      `);
      console.log('   ✅ Índice idx_expires_at criado com sucesso!');
    } else {
      console.log('   ℹ️  Índice idx_expires_at já existe');
    }

    // Verificar o tamanho da coluna short_code
    console.log('\n📝 Verificando tamanho da coluna short_code...');
    const [shortCodeSize] = await connection.query(`
      SELECT CHARACTER_MAXIMUM_LENGTH as size FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND COLUMN_NAME = 'short_code'
    `);

    if (shortCodeSize[0].size < 50) {
      console.log('   📏 Aumentando tamanho da coluna short_code para VARCHAR(50)...');
      await connection.query(`
        ALTER TABLE urls
        MODIFY COLUMN short_code VARCHAR(50) UNIQUE NOT NULL
      `);
      console.log('   ✅ Coluna short_code atualizada com sucesso!');
    } else {
      console.log('   ℹ️  Coluna short_code já tem tamanho adequado');
    }

    // Verificar se a coluna description existe
    console.log('\n📝 Verificando coluna description...');
    const [descriptionExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND COLUMN_NAME = 'description'
    `);

    if (descriptionExists[0].count === 0) {
      console.log('   ➕ Adicionando coluna description...');
      await connection.query(`
        ALTER TABLE urls
        ADD COLUMN description VARCHAR(255) DEFAULT NULL AFTER short_code
      `);
      console.log('   ✅ Coluna description adicionada com sucesso!');
    } else {
      console.log('   ℹ️  Coluna description já existe');
    }

    // Verificar se o índice em created_at existe
    console.log('\n📝 Verificando índice idx_created_at...');
    const [createdAtIndexExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'urls'
      AND INDEX_NAME = 'idx_created_at'
    `);

    if (createdAtIndexExists[0].count === 0) {
      console.log('   ➕ Criando índice idx_created_at...');
      await connection.query(`
        ALTER TABLE urls
        ADD INDEX idx_created_at (created_at)
      `);
      console.log('   ✅ Índice idx_created_at criado com sucesso!');
    } else {
      console.log('   ℹ️  Índice idx_created_at já existe');
    }

    connection.release();

    console.log('\n✅ Migração concluída com sucesso!\n');
    console.log('📊 Estrutura da tabela atualizada:');
    console.log('   - is_custom: BOOLEAN (indica se o código é personalizado)');
    console.log('   - expires_at: TIMESTAMP (data de expiração do link)');
    console.log('   - description: VARCHAR(255) (descrição do link)');
    console.log('   - short_code: VARCHAR(50) (suporta códigos maiores)');
    console.log('   - idx_expires_at: INDEX (otimização de queries)');
    console.log('   - idx_created_at: INDEX (otimização de filtros de data)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  }
}

// Executar migração
migrate();
