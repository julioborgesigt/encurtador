/**
 * Middleware de autenticação
 */

/**
 * Verificar se o usuário está autenticado
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // Se for uma requisição API, retornar JSON
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária. Por favor, faça login.'
    });
  }

  // Se for página HTML, redirecionar para login
  res.redirect('/?login=required');
}

/**
 * Verificar se o usuário NÃO está autenticado (para páginas de login)
 */
function ensureNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }

  // Usuário já autenticado, redirecionar
  res.redirect('/');
}

/**
 * Middleware opcional - disponibiliza dados do usuário mas não bloqueia
 */
function optionalAuth(req, res, next) {
  // Apenas passa adiante, mas o req.user estará disponível se autenticado
  next();
}

/**
 * Verificar se o usuário é dono do recurso (para URLs)
 */
async function ensureOwnership(req, res, next) {
  const pool = require('../database');
  const shortCode = req.params.code || req.body.code;

  if (!shortCode) {
    return res.status(400).json({
      success: false,
      error: 'Código do link não fornecido'
    });
  }

  try {
    const [urls] = await pool.query(
      'SELECT user_id FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (urls.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Link não encontrado'
      });
    }

    const url = urls[0];

    // Se a URL não tem dono (criada antes da autenticação), permitir
    if (!url.user_id) {
      return next();
    }

    // Verificar se o usuário é o dono
    if (url.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para modificar este link'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar propriedade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissões'
    });
  }
}

module.exports = {
  ensureAuthenticated,
  ensureNotAuthenticated,
  optionalAuth,
  ensureOwnership
};
