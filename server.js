const express = require('express');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('./config/passport');
const pool = require('./database');
const path = require('path');
require('dotenv').config();

// Controllers
const UrlController = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para funcionar com Render, Heroku, etc.
app.set('trust proxy', 1);

// Configurar session store com MySQL
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutos
  expiration: 86400000, // 24 horas
  createDatabaseTable: true,
  endConnectionOnClose: false, // Manter pool ativo
  disableTouch: false, // Permitir atualização de sessão
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

// Handler de erro para o session store
sessionStore.on('error', (error) => {
  console.error('❌ Erro no session store:', error.message);
  // Não derrubar o servidor por erro de sessão
});

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false // Desabilitar para permitir inline scripts do QR Code
}));
app.use(compression());

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por janela
  message: { error: 'Muitas requisições, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configurar sessões
app.use(session({
  key: 'url_shortener_session',
  secret: process.env.SESSION_SECRET || 'seu-secret-super-secreto-aqui-mude-em-producao',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS em produção
    sameSite: 'lax'
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// ========================================
// ROTAS
// ========================================

// Rotas de autenticação
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Rotas de API (URLs)
const urlRoutes = require('./routes/urls');
app.use('/api', urlRoutes);

// Rotas de administração
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Healthcheck endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Rota principal (frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de redirecionamento (deve ser a última para não capturar outras rotas)
app.get('/:shortCode', UrlController.redirect);

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Usando MySQL/MariaDB como banco de dados`);
  console.log(`🏗️  Arquitetura: Controllers + Services + Models`);
});
