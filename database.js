const mysql = require('mysql2/promise');
require('dotenv').config();

// Criar pool de conexões com configurações para produção
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'url_shortener',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',

  // Configurações do pool
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // Máximo de conexões idle
  idleTimeout: 60000, // 60 segundos antes de fechar conexão idle
  queueLimit: 0,

  // Configurações para prevenir ECONNRESET
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 segundos

  // Charset
  charset: 'utf8mb4_unicode_ci'
});

// Handler de erros do pool
pool.on('error', (err) => {
  console.error('❌ Erro no pool MySQL:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.log('🔄 Conexão perdida, pool vai criar nova conexão automaticamente');
  }
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
