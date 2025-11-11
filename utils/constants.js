/**
 * Constantes da aplicação
 */

// Códigos reservados que não podem ser usados como short codes
const RESERVED_CODES = [
  'api',
  'admin',
  'public',
  'static',
  'assets',
  'health',
  'status',
  'auth',
  'dashboard',
  'settings',
  'login',
  'logout',
  'register',
  'bio',
  'docs',
  'swagger'
];

// Padrões de validação
const VALIDATION_PATTERNS = {
  SHORT_CODE: /^[a-zA-Z0-9-]{3,30}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Limites
const LIMITS = {
  SHORT_CODE_MIN_LENGTH: 3,
  SHORT_CODE_MAX_LENGTH: 30,
  DESCRIPTION_MAX_LENGTH: 255,
  DEFAULT_SHORT_CODE_LENGTH: 7,
  GUEST_EXPIRATION_DAYS: 7,
  MAX_PAGINATION_LIMIT: 100,
  DEFAULT_PAGINATION_LIMIT: 10
};

// Mensagens de erro
const ERROR_MESSAGES = {
  INVALID_URL: 'URL inválida. Por favor, forneça uma URL válida.',
  INVALID_SHORT_CODE: 'Código personalizado inválido. Use apenas letras, números e hífens (3-30 caracteres).',
  SHORT_CODE_IN_USE: 'Este código já está em uso. Por favor, escolha outro.',
  SHORT_CODE_RESERVED: 'Este código está reservado e não pode ser usado.',
  URL_NOT_FOUND: 'URL não encontrada',
  URL_EXPIRED: 'Este link expirou e não está mais disponível',
  UNAUTHORIZED: 'Autenticação necessária. Por favor, faça login.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso',
  RATE_LIMIT_GENERAL: 'Muitas requisições, tente novamente mais tarde.',
  RATE_LIMIT_CREATE: 'Você está criando links muito rápido. Aguarde um momento.'
};

// Status HTTP
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Hosts bloqueados em produção
const BLOCKED_HOSTS = {
  production: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1'
  ]
};

// Regex para IPs privados
const PRIVATE_IP_REGEX = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;

module.exports = {
  RESERVED_CODES,
  VALIDATION_PATTERNS,
  LIMITS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  BLOCKED_HOSTS,
  PRIVATE_IP_REGEX
};
