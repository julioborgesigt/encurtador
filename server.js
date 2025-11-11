const express = require('express');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const validator = require('validator');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('./config/passport');
const pool = require('./database');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para funcionar com Render, Heroku, etc.
// Isso é necessário para que express-rate-limit e sessões funcionem corretamente
app.set('trust proxy', 1);

// Configurar session store com MySQL
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutos
  expiration: 86400000, // 24 horas
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false // Desabilitar para permitir inline scripts do QR Code
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por janela
  message: { error: 'Muitas requisições, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // limite de 10 criações por minuto
  message: { error: 'Você está criando links muito rápido. Aguarde um momento.' },
});

app.use('/api/', limiter);

// Middleware
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

// Rotas de autenticação
const authRoutes = require('./routes/auth');
const { ensureAuthenticated, ensureOwnership } = require('./middleware/auth');
app.use('/auth', authRoutes);

// Função auxiliar para validar URL
function isValidUrl(string) {
  try {
    const url = new URL(string);

    // Permitir apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Usar validator.js para validação adicional
    if (!validator.isURL(string, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true
    })) {
      return false;
    }

    // Bloquear URLs suspeitas (localhost, IPs privados em produção)
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

    if (process.env.NODE_ENV === 'production' && blockedHosts.includes(hostname)) {
      return false;
    }

    // Bloquear IPs privados em produção
    if (process.env.NODE_ENV === 'production') {
      const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
      if (privateIPRegex.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch (_) {
    return false;
  }
}

// Função para validar custom short code
function isValidShortCode(code) {
  if (!code) return true; // Código vazio é válido (será gerado automaticamente)

  // Apenas letras, números e hífens, entre 3 e 30 caracteres
  const regex = /^[a-zA-Z0-9-]{3,30}$/;

  if (!regex.test(code)) {
    return false;
  }

  // Bloquear códigos reservados
  const reserved = ['api', 'admin', 'public', 'static', 'assets', 'health', 'status'];
  if (reserved.includes(code.toLowerCase())) {
    return false;
  }

  return true;
}

// Healthcheck endpoint
app.get('/health', async (req, res) => {
  try {
    // Testar conexão com o banco
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

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Criar link curto
app.post('/api/shorten', createLimiter, async (req, res) => {
  let { url, customCode, expiresIn, description } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'URL inválida. Por favor, forneça uma URL válida.'
    });
  }

  // Restrições para usuários não autenticados
  const isAuthenticated = req.isAuthenticated();

  if (!isAuthenticated) {
    // Usuários não autenticados: forçar 7 dias de expiração e bloquear opções avançadas
    customCode = null;
    description = null;
    expiresIn = 7; // Forçar 7 dias
  } else {
    // Validar custom code se fornecido (apenas para usuários autenticados)
    if (customCode && !isValidShortCode(customCode)) {
      return res.status(400).json({
        error: 'Código personalizado inválido. Use apenas letras, números e hífens (3-30 caracteres).'
      });
    }
  }

  try {
    let shortCode = customCode;
    let isCustom = false;

    // Se código customizado foi fornecido, verificar se já existe
    if (shortCode) {
      const [existing] = await pool.query(
        'SELECT * FROM urls WHERE short_code = ?',
        [shortCode]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          error: 'Este código já está em uso. Por favor, escolha outro.'
        });
      }
      isCustom = true;
    } else {
      // Verificar se a URL já existe (sem código customizado)
      const [rows] = await pool.query(
        'SELECT * FROM urls WHERE original_url = ? AND is_custom = FALSE',
        [url]
      );

      if (rows.length > 0) {
        const row = rows[0];

        // Verificar se não expirou
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          // URL expirada, deletar e criar nova
          await pool.query('DELETE FROM urls WHERE id = ?', [row.id]);
        } else {
          const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;

          return res.json({
            original_url: row.original_url,
            short_url: shortUrl,
            short_code: row.short_code,
            description: row.description,
            qr_code: row.qr_code,
            clicks: row.clicks,
            is_custom: row.is_custom,
            expires_at: row.expires_at,
            created_at: row.created_at
          });
        }
      }

      // Gerar código curto único
      shortCode = nanoid(7);
    }

    // Calcular data de expiração se fornecida (em dias)
    let expiresAt = null;
    if (expiresIn && !isNaN(expiresIn) && expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }

    // Gerar QR Code
    const qrCodeDataURL = await QRCode.toDataURL(
      `${req.protocol}://${req.get('host')}/${shortCode}`
    );

    // Obter user_id se autenticado
    const userId = req.isAuthenticated() ? req.user.id : null;

    // Salvar no banco de dados
    await pool.query(
      'INSERT INTO urls (user_id, original_url, short_code, description, qr_code, is_custom, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, url, shortCode, description || null, qrCodeDataURL, isCustom, expiresAt]
    );

    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

    res.json({
      original_url: url,
      short_url: shortUrl,
      short_code: shortCode,
      description: description || null,
      qr_code: qrCodeDataURL,
      clicks: 0,
      is_custom: isCustom,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// API: Listar todas as URLs com paginação e busca
app.get('/api/urls', async (req, res) => {
  try {
    // Usuários não autenticados não veem histórico
    if (!req.isAuthenticated()) {
      return res.json({
        urls: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const month = req.query.month || '';
    const year = req.query.year || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM urls';
    let countQuery = 'SELECT COUNT(*) as total FROM urls';
    const params = [];
    const countParams = [];
    const conditions = [];

    // Mostrar apenas URLs do usuário autenticado (e URLs sem dono para compatibilidade)
    conditions.push('(user_id = ? OR user_id IS NULL)');
    params.push(req.user.id);
    countParams.push(req.user.id);

    // Adicionar busca se fornecida (incluindo description)
    if (search) {
      conditions.push('(original_url LIKE ? OR short_code LIKE ? OR description LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    // Filtrar por mês e ano
    if (year) {
      if (month) {
        conditions.push('YEAR(created_at) = ? AND MONTH(created_at) = ?');
        params.push(parseInt(year), parseInt(month));
        countParams.push(parseInt(year), parseInt(month));
      } else {
        conditions.push('YEAR(created_at) = ?');
        params.push(parseInt(year));
        countParams.push(parseInt(year));
      }
    }

    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Adicionar ordenação e paginação
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Executar queries
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    const urls = rows.map(row => ({
      id: row.id,
      original_url: row.original_url,
      short_url: `${req.protocol}://${req.get('host')}/${row.short_code}`,
      short_code: row.short_code,
      description: row.description,
      qr_code: row.qr_code,
      clicks: row.clicks,
      is_custom: row.is_custom,
      expires_at: row.expires_at,
      created_at: row.created_at,
      last_accessed: row.last_accessed
    }));

    res.json({
      urls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar URLs' });
  }
});

// API: Obter estatísticas de uma URL específica
app.get('/api/stats/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_code = ?',
      [shortCode]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
    
    const row = rows[0];
    
    res.json({
      original_url: row.original_url,
      short_url: `${req.protocol}://${req.get('host')}/${row.short_code}`,
      short_code: row.short_code,
      description: row.description,
      clicks: row.clicks,
      created_at: row.created_at,
      last_accessed: row.last_accessed
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// API: Deletar URL (requer autenticação e ownership)
app.delete('/api/urls/:shortCode', ensureAuthenticated, async (req, res) => {
  const { shortCode } = req.params;

  try {
    // Verificar se a URL existe e se o usuário é o dono
    const [urls] = await pool.query(
      'SELECT user_id FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (urls.length === 0) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }

    const url = urls[0];

    // Se a URL não tem dono (criada antes do auth), permitir deletar
    // Caso contrário, verificar se o usuário é o dono
    if (url.user_id && url.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para deletar este link'
      });
    }

    // Deletar a URL
    await pool.query(
      'DELETE FROM urls WHERE short_code = ?',
      [shortCode]
    );

    res.json({ message: 'URL deletada com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar URL' });
  }
});

// Rota de redirecionamento
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (rows.length === 0) {
      return res.status(404).send('URL não encontrada');
    }

    const row = rows[0];

    // Verificar se a URL expirou
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      // Deletar URL expirada
      await pool.query('DELETE FROM urls WHERE id = ?', [row.id]);
      return res.status(410).send('Este link expirou e não está mais disponível');
    }

    // Atualizar contador de cliques
    await pool.query(
      'UPDATE urls SET clicks = clicks + 1, last_accessed = NOW() WHERE short_code = ?',
      [shortCode]
    );

    // Redirecionar
    res.redirect(row.original_url);

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Usando MySQL/MariaDB como banco de dados`);
});
