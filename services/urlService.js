/**
 * Service para lógica de negócio de URLs
 */

const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const UrlModel = require('../models/Url');
const {
  validateUrl,
  validateShortCode,
  validateCreateUrl
} = require('../validators/urlValidator');
const {
  ERROR_MESSAGES,
  LIMITS
} = require('../utils/constants');

class UrlService {
  /**
   * Cria uma nova URL encurtada
   * @param {Object} data - Dados da URL
   * @param {Object} user - Usuário autenticado (opcional)
   * @returns {Promise<Object>} URL criada
   */
  static async createShortUrl(data, user = null) {
    const isAuthenticated = user !== null;

    // Aplicar restrições para não autenticados
    let { url, customCode, expiresIn, description } = data;

    if (!isAuthenticated) {
      customCode = null;
      description = null;
      expiresIn = LIMITS.GUEST_EXPIRATION_DAYS;
    }

    // Validar dados
    const validation = validateCreateUrl(
      { url, customCode, expiresIn, description },
      isAuthenticated
    );

    if (!validation.isValid) {
      throw new ValidationError('Dados inválidos', validation.errors);
    }

    // Processar código curto
    let shortCode = customCode;
    let isCustom = false;

    if (shortCode) {
      // Verificar se código já existe
      const existing = await UrlModel.findByShortCode(shortCode);
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.SHORT_CODE_IN_USE);
      }
      isCustom = true;
    } else {
      // Verificar se URL já existe (evitar duplicatas para não customizados)
      const duplicate = await UrlModel.findDuplicate(url);

      if (duplicate) {
        // Se expirou, deletar e criar nova
        if (UrlModel.isExpired(duplicate)) {
          await UrlModel.deleteById(duplicate.id);
        } else {
          // Retornar URL existente
          return this.formatUrlResponse(duplicate, data.baseUrl);
        }
      }

      // Gerar código único
      shortCode = await this.generateUniqueShortCode();
    }

    // Calcular expiração
    const expiresAt = this.calculateExpiration(expiresIn);

    // Gerar QR Code
    const qrCodeDataURL = await this.generateQRCode(shortCode, data.baseUrl);

    // Criar no banco
    await UrlModel.create({
      userId: user?.id || null,
      originalUrl: url,
      shortCode,
      description: description || null,
      qrCode: qrCodeDataURL,
      isCustom,
      expiresAt
    });

    // Buscar URL criada
    const createdUrl = await UrlModel.findByShortCode(shortCode);

    return this.formatUrlResponse(createdUrl, data.baseUrl);
  }

  /**
   * Gera um código curto único
   * @param {number} attempts - Tentativas restantes
   * @returns {Promise<string>} Código único
   */
  static async generateUniqueShortCode(attempts = 5) {
    for (let i = 0; i < attempts; i++) {
      const code = nanoid(LIMITS.DEFAULT_SHORT_CODE_LENGTH);
      const existing = await UrlModel.findByShortCode(code);

      if (!existing) {
        return code;
      }
    }

    // Se falhar após tentativas, usar código mais longo
    return nanoid(LIMITS.DEFAULT_SHORT_CODE_LENGTH + 2);
  }

  /**
   * Gera QR Code para uma URL
   * @param {string} shortCode - Código curto
   * @param {string} baseUrl - URL base (protocolo + host)
   * @returns {Promise<string>} Data URL do QR Code
   */
  static async generateQRCode(shortCode, baseUrl) {
    const fullUrl = `${baseUrl}/${shortCode}`;
    return await QRCode.toDataURL(fullUrl);
  }

  /**
   * Calcula data de expiração
   * @param {number|string} expiresIn - Dias até expiração
   * @returns {Date|null} Data de expiração ou null
   */
  static calculateExpiration(expiresIn) {
    if (!expiresIn || expiresIn === '' || expiresIn === '0') {
      return null;
    }

    const days = parseInt(expiresIn);
    if (isNaN(days) || days <= 0) {
      return null;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }

  /**
   * Formata resposta da URL
   * @param {Object} url - URL do banco
   * @param {string} baseUrl - URL base
   * @returns {Object} URL formatada
   */
  static formatUrlResponse(url, baseUrl) {
    return {
      original_url: url.original_url,
      short_url: `${baseUrl}/${url.short_code}`,
      short_code: url.short_code,
      description: url.description,
      qr_code: url.qr_code,
      clicks: url.clicks,
      is_custom: url.is_custom,
      expires_at: url.expires_at,
      created_at: url.created_at
    };
  }

  /**
   * Lista URLs com paginação e filtros
   * @param {Object} params - Parâmetros de busca
   * @param {Object} user - Usuário autenticado (opcional)
   * @returns {Promise<Object>} URLs e paginação
   */
  static async listUrls(params, user = null) {
    const { page, limit, offset, search, month, year } = params;

    // Usuários não autenticados não veem histórico
    if (!user) {
      return {
        urls: [],
        pagination: {
          page: 1,
          limit: LIMITS.DEFAULT_PAGINATION_LIMIT,
          total: 0,
          totalPages: 0
        }
      };
    }

    const result = await UrlModel.findMany({
      userId: user.id,
      search,
      month,
      year,
      limit,
      offset
    });

    const baseUrl = params.baseUrl;
    const urls = result.urls.map(url => this.formatUrlResponse(url, baseUrl));

    return {
      urls,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  /**
   * Processa redirecionamento de URL curta
   * @param {string} shortCode - Código curto
   * @returns {Promise<string>} URL original
   */
  static async processRedirect(shortCode) {
    const url = await UrlModel.findByShortCode(shortCode);

    if (!url) {
      throw new NotFoundError(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Verificar expiração
    if (UrlModel.isExpired(url)) {
      await UrlModel.deleteById(url.id);
      throw new GoneError(ERROR_MESSAGES.URL_EXPIRED);
    }

    // Incrementar cliques em background (não bloquear redirecionamento)
    UrlModel.incrementClicks(url.id).catch(err => {
      console.error('Erro ao incrementar cliques:', err);
    });

    return url.original_url;
  }

  /**
   * Busca estatísticas de uma URL
   * @param {string} shortCode - Código curto
   * @param {string} baseUrl - URL base
   * @returns {Promise<Object>} Estatísticas
   */
  static async getStats(shortCode, baseUrl) {
    const stats = await UrlModel.getStats(shortCode);

    if (!stats) {
      throw new NotFoundError(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    return {
      original_url: stats.original_url,
      short_url: `${baseUrl}/${stats.short_code}`,
      short_code: stats.short_code,
      description: stats.description,
      clicks: stats.clicks,
      created_at: stats.created_at,
      last_accessed: stats.last_accessed,
      expires_at: stats.expires_at,
      is_custom: stats.is_custom
    };
  }

  /**
   * Deleta uma URL
   * @param {string} shortCode - Código curto
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<void>}
   */
  static async deleteUrl(shortCode, user) {
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const url = await UrlModel.findByShortCode(shortCode);

    if (!url) {
      throw new NotFoundError(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Verificar ownership (URLs sem dono podem ser deletadas)
    if (url.user_id && url.user_id !== user.id) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    const result = await UrlModel.deleteByShortCode(shortCode);

    if (result.affectedRows === 0) {
      throw new NotFoundError(ERROR_MESSAGES.URL_NOT_FOUND);
    }
  }
}

// Erros customizados
class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class GoneError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoneError';
    this.statusCode = 410;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

module.exports = UrlService;
module.exports.ValidationError = ValidationError;
module.exports.ConflictError = ConflictError;
module.exports.NotFoundError = NotFoundError;
module.exports.GoneError = GoneError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
