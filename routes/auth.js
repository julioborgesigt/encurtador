/**
 * Rotas de autenticação com Google OAuth 2.0
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

/**
 * Iniciar autenticação com Google
 * GET /auth/google
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * Callback do Google após autenticação
 * GET /auth/google/callback
 */
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?login=failed',
    successRedirect: '/'
  })
);

/**
 * Logout do usuário
 * GET /auth/logout
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer logout'
      });
    }
    res.redirect('/');
  });
});

/**
 * Obter informações do usuário atual
 * GET /auth/user
 */
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
      }
    });
  } else {
    res.json({
      success: false,
      user: null
    });
  }
});

/**
 * Verificar status de autenticação
 * GET /auth/status
 */
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    } : null
  });
});

module.exports = router;
