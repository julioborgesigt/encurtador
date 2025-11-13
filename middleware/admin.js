/**
 * Middleware de Autenticação de Administrador
 *
 * Verifica se o usuário está autenticado e se tem permissão de administrador.
 * Administradores são definidos por uma lista de emails no .env
 */

/**
 * Middleware para verificar se o usuário é administrador
 */
function ensureAdmin(req, res, next) {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: 'Autenticação necessária',
            message: 'Você precisa fazer login para acessar esta área.'
        });
    }

    // Verificar se o usuário é admin
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você não tem permissão para acessar esta área.'
        });
    }

    next();
}

/**
 * Verifica se um usuário é administrador
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
function isAdmin(user) {
    if (!user || !user.email) {
        return false;
    }

    // Obter lista de emails de admins do .env
    const adminEmails = process.env.ADMIN_EMAILS ?
        process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase()) :
        [];

    // Verificar se o email do usuário está na lista
    return adminEmails.includes(user.email.toLowerCase());
}

module.exports = {
    ensureAdmin,
    isAdmin
};
