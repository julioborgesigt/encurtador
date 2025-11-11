/**
 * Validadores para URLs e códigos curtos
 */

const validator = require('validator');
const {
  RESERVED_CODES,
  VALIDATION_PATTERNS,
  LIMITS,
  ERROR_MESSAGES,
  BLOCKED_HOSTS,
  PRIVATE_IP_REGEX
} = require('../utils/constants');

/**
 * Valida se uma string é uma URL válida
 * @param {string} urlString - URL a ser validada
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_URL
    };
  }

  try {
    const url = new URL(urlString);

    // Permitir apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'Apenas URLs HTTP e HTTPS são permitidas.'
      };
    }

    // Validação adicional com validator.js
    if (!validator.isURL(urlString, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true
    })) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_URL
      };
    }

    // Bloquear URLs suspeitas em produção
    const hostname = url.hostname.toLowerCase();

    if (process.env.NODE_ENV === 'production') {
      // Bloquear localhost e similares
      if (BLOCKED_HOSTS.production.includes(hostname)) {
        return {
          isValid: false,
          error: 'URLs localhost não são permitidas em produção.'
        };
      }

      // Bloquear IPs privados
      if (PRIVATE_IP_REGEX.test(hostname)) {
        return {
          isValid: false,
          error: 'URLs com IPs privados não são permitidas.'
        };
      }
    }

    return { isValid: true, error: null };

  } catch (error) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_URL
    };
  }
}

/**
 * Valida um código curto personalizado
 * @param {string} code - Código a ser validado
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateShortCode(code) {
  // Código vazio é válido (será gerado automaticamente)
  if (!code) {
    return { isValid: true, error: null };
  }

  // Validar formato
  if (!VALIDATION_PATTERNS.SHORT_CODE.test(code)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_SHORT_CODE
    };
  }

  // Validar comprimento
  if (code.length < LIMITS.SHORT_CODE_MIN_LENGTH ||
      code.length > LIMITS.SHORT_CODE_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Código deve ter entre ${LIMITS.SHORT_CODE_MIN_LENGTH} e ${LIMITS.SHORT_CODE_MAX_LENGTH} caracteres.`
    };
  }

  // Bloquear códigos reservados
  if (RESERVED_CODES.includes(code.toLowerCase())) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.SHORT_CODE_RESERVED
    };
  }

  return { isValid: true, error: null };
}

/**
 * Valida dados de criação de URL encurtada
 * @param {Object} data - Dados da URL
 * @param {boolean} isAuthenticated - Se o usuário está autenticado
 * @returns {Object} { isValid: boolean, errors: Object }
 */
function validateCreateUrl(data, isAuthenticated = false) {
  const errors = {};

  // Validar URL
  const urlValidation = validateUrl(data.url);
  if (!urlValidation.isValid) {
    errors.url = urlValidation.error;
  }

  // Validar código personalizado (apenas para autenticados)
  if (data.customCode) {
    if (!isAuthenticated) {
      errors.customCode = 'Códigos personalizados requerem autenticação.';
    } else {
      const codeValidation = validateShortCode(data.customCode);
      if (!codeValidation.isValid) {
        errors.customCode = codeValidation.error;
      }
    }
  }

  // Validar descrição
  if (data.description) {
    if (!isAuthenticated) {
      errors.description = 'Descrições requerem autenticação.';
    } else if (data.description.length > LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.description = `Descrição não pode ter mais de ${LIMITS.DESCRIPTION_MAX_LENGTH} caracteres.`;
    }
  }

  // Validar expiração
  if (data.expiresIn !== undefined && data.expiresIn !== null && data.expiresIn !== '') {
    const expiration = parseInt(data.expiresIn);
    if (isNaN(expiration) || expiration < 0) {
      errors.expiresIn = 'Valor de expiração inválido.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida parâmetros de paginação
 * @param {Object} params - Parâmetros de paginação
 * @returns {Object} Parâmetros validados e sanitizados
 */
function validatePaginationParams(params = {}) {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(
    LIMITS.MAX_PAGINATION_LIMIT,
    Math.max(1, parseInt(params.limit) || LIMITS.DEFAULT_PAGINATION_LIMIT)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Valida e sanitiza parâmetros de busca
 * @param {Object} params - Parâmetros de busca
 * @returns {Object} Parâmetros sanitizados
 */
function validateSearchParams(params = {}) {
  return {
    search: params.search ? String(params.search).trim().slice(0, 255) : '',
    month: params.month ? parseInt(params.month) : null,
    year: params.year ? parseInt(params.year) : null
  };
}

module.exports = {
  validateUrl,
  validateShortCode,
  validateCreateUrl,
  validatePaginationParams,
  validateSearchParams
};
