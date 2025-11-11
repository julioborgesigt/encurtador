/**
 * Controller para rotas de URLs
 */

const UrlService = require('../services/urlService');
const {
  validatePaginationParams,
  validateSearchParams
} = require('../validators/urlValidator');
const { HTTP_STATUS } = require('../utils/constants');

class UrlController {
  /**
   * Cria uma URL encurtada
   * POST /api/shorten
   */
  static async createShortUrl(req, res) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const user = req.isAuthenticated() ? req.user : null;

      const result = await UrlService.createShortUrl(
        {
          ...req.body,
          baseUrl
        },
        user
      );

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      UrlController.handleError(res, error);
    }
  }

  /**
   * Lista URLs do usuário com paginação e filtros
   * GET /api/urls
   */
  static async listUrls(req, res) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const user = req.isAuthenticated() ? req.user : null;

      const paginationParams = validatePaginationParams(req.query);
      const searchParams = validateSearchParams(req.query);

      const result = await UrlService.listUrls(
        {
          ...paginationParams,
          ...searchParams,
          baseUrl
        },
        user
      );

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      UrlController.handleError(res, error);
    }
  }

  /**
   * Busca estatísticas de uma URL específica
   * GET /api/stats/:shortCode
   */
  static async getStats(req, res) {
    try {
      const { shortCode } = req.params;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const stats = await UrlService.getStats(shortCode, baseUrl);

      res.status(HTTP_STATUS.OK).json(stats);
    } catch (error) {
      UrlController.handleError(res, error);
    }
  }

  /**
   * Deleta uma URL
   * DELETE /api/urls/:shortCode
   */
  static async deleteUrl(req, res) {
    try {
      const { shortCode } = req.params;
      const user = req.isAuthenticated() ? req.user : null;

      await UrlService.deleteUrl(shortCode, user);

      res.status(HTTP_STATUS.OK).json({
        message: 'URL deletada com sucesso'
      });
    } catch (error) {
      UrlController.handleError(res, error);
    }
  }

  /**
   * Processa redirecionamento para URL original
   * GET /:shortCode
   */
  static async redirect(req, res) {
    try {
      const { shortCode } = req.params;

      const originalUrl = await UrlService.processRedirect(shortCode);

      res.redirect(originalUrl);
    } catch (error) {
      // Erros de redirecionamento são enviados como HTML
      if (error.name === 'NotFoundError') {
        return res.status(HTTP_STATUS.NOT_FOUND).send(
          '<h1>404 - URL não encontrada</h1>' +
          '<p>Este link não existe ou foi removido.</p>'
        );
      }

      if (error.name === 'GoneError') {
        return res.status(HTTP_STATUS.GONE).send(
          '<h1>410 - Link Expirado</h1>' +
          '<p>Este link expirou e não está mais disponível.</p>'
        );
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(
        '<h1>500 - Erro no Servidor</h1>' +
        '<p>Ocorreu um erro ao processar sua solicitação.</p>'
      );
    }
  }

  /**
   * Trata erros e retorna resposta apropriada
   * @param {Object} res - Objeto de resposta Express
   * @param {Error} error - Erro capturado
   */
  static handleError(res, error) {
    console.error('Erro no controller:', error);

    // Erros conhecidos com statusCode
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        ...(error.errors && { errors: error.errors })
      });
    }

    // Erros do banco de dados
    if (error.code) {
      // Duplicated entry
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Este código já está em uso'
        });
      }

      // Foreign key constraint
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Referência inválida'
        });
      }
    }

    // Erro genérico
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Erro ao processar requisição',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
}

module.exports = UrlController;
