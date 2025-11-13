/**
 * Controller de Administração
 *
 * Controladores HTTP para rotas administrativas
 */

const AdminService = require('../services/adminService');
const { HTTP_STATUS } = require('../utils/constants');

class AdminController {
    /**
     * Renderizar página do painel admin
     */
    static async renderAdminPage(req, res) {
        try {
            res.sendFile('admin.html', { root: './public' });
        } catch (error) {
            console.error('Erro ao renderizar página admin:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erro ao carregar página');
        }
    }

    /**
     * Obter dashboard completo
     */
    static async getDashboard(req, res) {
        try {
            const dashboard = await AdminService.getDashboard();
            res.status(HTTP_STATUS.OK).json(dashboard);
        } catch (error) {
            console.error('Erro ao obter dashboard:', error);
            AdminController.handleError(res, error);
        }
    }

    /**
     * Obter lista de usuários
     */
    static async getUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await AdminService.getUsers(page, limit);
            res.status(HTTP_STATUS.OK).json(result);
        } catch (error) {
            console.error('Erro ao obter usuários:', error);
            AdminController.handleError(res, error);
        }
    }

    /**
     * Deletar usuário
     */
    static async deleteUser(req, res) {
        try {
            const { userId } = req.params;

            // Verificar se não está tentando deletar a si mesmo
            if (parseInt(userId) === req.user.id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Você não pode deletar sua própria conta'
                });
            }

            await AdminService.deleteUser(userId);
            res.status(HTTP_STATUS.OK).json({
                message: 'Usuário deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            AdminController.handleError(res, error);
        }
    }

    /**
     * Deletar link
     */
    static async deleteLink(req, res) {
        try {
            const { linkId } = req.params;

            await AdminService.deleteLink(linkId);
            res.status(HTTP_STATUS.OK).json({
                message: 'Link deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar link:', error);
            AdminController.handleError(res, error);
        }
    }

    /**
     * Limpar links expirados
     */
    static async cleanExpiredLinks(req, res) {
        try {
            const result = await AdminService.cleanExpiredLinks();
            res.status(HTTP_STATUS.OK).json({
                message: `${result.deleted} links expirados foram removidos`,
                deleted: result.deleted
            });
        } catch (error) {
            console.error('Erro ao limpar links expirados:', error);
            AdminController.handleError(res, error);
        }
    }

    /**
     * Handler de erros genérico
     */
    static handleError(res, error) {
        const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(statusCode).json({
            error: error.message || 'Erro ao processar requisição'
        });
    }
}

module.exports = AdminController;
