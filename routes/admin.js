/**
 * Rotas Administrativas
 *
 * Rotas protegidas para o painel de administração
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/admin');

// Aplicar middleware de admin em todas as rotas
router.use(ensureAdmin);

// Página do painel admin
router.get('/', AdminController.renderAdminPage);

// API - Dashboard completo
router.get('/api/dashboard', AdminController.getDashboard);

// API - Usuários
router.get('/api/users', AdminController.getUsers);
router.delete('/api/users/:userId', AdminController.deleteUser);

// API - Links
router.delete('/api/links/:linkId', AdminController.deleteLink);

// API - Manutenção
router.post('/api/maintenance/clean-expired', AdminController.cleanExpiredLinks);

module.exports = router;
