const mysql = require('mysql2/promise');
require('dotenv').config();

// Criar pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'url_shortener',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Criar tabela se não existir
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_url TEXT NOT NULL,
        short_code VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        qr_code LONGTEXT,
        clicks INT DEFAULT 0,
        is_custom BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP NULL,
        INDEX idx_short_code (short_code),
        INDEX idx_expires_at (expires_at),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    connection.release();
    console.log('✅ Banco de dados MySQL/MariaDB configurado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
  }
};

// Inicializar banco ao carregar o módulo
initDatabase();

module.exports = pool;
