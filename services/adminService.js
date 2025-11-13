/**
 * Service de Administração
 *
 * Lógica de negócio para o painel administrativo
 */

const AdminModel = require('../models/Admin');

class AdminService {
    /**
     * Obter dashboard completo com todas as métricas
     */
    static async getDashboard() {
        const [
            generalStats,
            topLinks,
            recentActivity,
            databaseSize,
            tableStats,
            activityByDay
        ] = await Promise.all([
            AdminModel.getGeneralStats(),
            AdminModel.getTopLinks(10),
            AdminModel.getRecentActivity(10),
            AdminModel.getDatabaseSize(),
            AdminModel.getTableStats(),
            AdminModel.getActivityByDay()
        ]);

        return {
            general: generalStats,
            topLinks,
            recentActivity,
            database: {
                ...databaseSize,
                tables: tableStats
            },
            activityByDay
        };
    }

    /**
     * Obter lista de usuários com paginação
     */
    static async getUsers(page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const result = await AdminModel.getUsersWithStats(limit, offset);

        return {
            users: result.users,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        };
    }

    /**
     * Deletar usuário
     */
    static async deleteUser(userId) {
        if (!userId || isNaN(userId)) {
            throw new Error('ID de usuário inválido');
        }

        return await AdminModel.deleteUser(userId);
    }

    /**
     * Deletar link
     */
    static async deleteLink(linkId) {
        if (!linkId || isNaN(linkId)) {
            throw new Error('ID de link inválido');
        }

        return await AdminModel.deleteLink(linkId);
    }

    /**
     * Limpar links expirados
     */
    static async cleanExpiredLinks() {
        return await AdminModel.cleanExpiredLinks();
    }

    /**
     * Obter estatísticas detalhadas de um usuário específico
     */
    static async getUserDetails(userId) {
        const result = await AdminModel.getUsersWithStats(1, 0);
        const user = result.users.find(u => u.id === parseInt(userId));

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }
}

module.exports = AdminService;
