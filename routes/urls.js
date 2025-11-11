/**
 * Rotas para URLs encurtadas
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const UrlController = require('../controllers/urlController');
const { ensureAuthenticated } = require('../middleware/auth');

// Rate limiters específicos
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 criações por minuto
  message: {
    error: 'Você está criando links muito rápido. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/shorten
 * @desc    Cria uma nova URL encurtada
 * @access  Public (limitado para não autenticados)
 * @body    {
 *   url: string (required),
 *   customCode?: string,
 *   description?: string,
 *   expiresIn?: number
 * }
 */
router.post('/shorten', createLimiter, UrlController.createShortUrl);

/**
 * @route   GET /api/urls
 * @desc    Lista URLs do usuário com paginação e filtros
 * @access  Private (apenas usuários autenticados)
 * @query   {
 *   page?: number,
 *   limit?: number,
 *   search?: string,
 *   month?: number,
 *   year?: number
 * }
 */
router.get('/urls', UrlController.listUrls);

/**
 * @route   GET /api/stats/:shortCode
 * @desc    Busca estatísticas de uma URL específica
 * @access  Public
 * @params  shortCode - Código curto da URL
 */
router.get('/stats/:shortCode', UrlController.getStats);

/**
 * @route   DELETE /api/urls/:shortCode
 * @desc    Deleta uma URL
 * @access  Private (apenas dono pode deletar)
 * @params  shortCode - Código curto da URL
 */
router.delete('/urls/:shortCode', ensureAuthenticated, UrlController.deleteUrl);

module.exports = router;
