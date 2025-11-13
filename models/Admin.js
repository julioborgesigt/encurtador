/**
 * Model de Administração
 *
 * Queries SQL para obter métricas e estatísticas do sistema
 */

const pool = require('../database');

class AdminModel {
    /**
     * Obter estatísticas gerais do sistema
     */
    static async getGeneralStats() {
        // Total de usuários
        const [usersCount] = await pool.query('SELECT COUNT(*) as total FROM users');

        // Total de links
        const [linksCount] = await pool.query('SELECT COUNT(*) as total FROM urls');

        // Total de cliques
        const [clicksCount] = await pool.query('SELECT SUM(clicks) as total FROM urls');

        // Links criados nos últimos 30 dias
        const [recentLinks] = await pool.query(`
            SELECT COUNT(*) as total
            FROM urls
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // Usuários criados nos últimos 30 dias
        const [recentUsers] = await pool.query(`
            SELECT COUNT(*) as total
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // Links ativos vs expirados
        const [activeLinks] = await pool.query(`
            SELECT COUNT(*) as total
            FROM urls
            WHERE expires_at IS NULL OR expires_at > NOW()
        `);

        const [expiredLinks] = await pool.query(`
            SELECT COUNT(*) as total
            FROM urls
            WHERE expires_at IS NOT NULL AND expires_at <= NOW()
        `);

        // Links customizados vs gerados
        const [customLinks] = await pool.query(`
            SELECT COUNT(*) as total
            FROM urls
            WHERE is_custom = 1
        `);

        return {
            totalUsers: usersCount[0].total,
            totalLinks: linksCount[0].total,
            totalClicks: clicksCount[0].total || 0,
            recentLinks: recentLinks[0].total,
            recentUsers: recentUsers[0].total,
            activeLinks: activeLinks[0].total,
            expiredLinks: expiredLinks[0].total,
            customLinks: customLinks[0].total,
            generatedLinks: linksCount[0].total - customLinks[0].total
        };
    }

    /**
     * Obter lista de usuários com estatísticas
     * @param {number} limit - Limite de resultados
     * @param {number} offset - Offset para paginação
     */
    static async getUsersWithStats(limit = 50, offset = 0) {
        const [users] = await pool.query(`
            SELECT
                u.id,
                u.google_id,
                u.email,
                u.name,
                u.picture,
                u.created_at,
                COUNT(url.id) as total_links,
                COALESCE(SUM(url.clicks), 0) as total_clicks,
                MAX(url.created_at) as last_link_created
            FROM users u
            LEFT JOIN urls url ON u.id = url.user_id
            GROUP BY u.id
            ORDER BY total_links DESC, total_clicks DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');

        return {
            users,
            total: countResult[0].total
        };
    }

    /**
     * Obter top 10 links mais clicados
     */
    static async getTopLinks(limit = 10) {
        const [links] = await pool.query(`
            SELECT
                u.id,
                u.short_code,
                u.original_url,
                u.description,
                u.clicks,
                u.created_at,
                u.last_accessed,
                usr.email as user_email,
                usr.name as user_name
            FROM urls u
            LEFT JOIN users usr ON u.user_id = usr.id
            ORDER BY u.clicks DESC
            LIMIT ?
        `, [limit]);

        return links;
    }

    /**
     * Obter atividade recente (últimos links criados)
     */
    static async getRecentActivity(limit = 20) {
        const [activity] = await pool.query(`
            SELECT
                u.id,
                u.short_code,
                u.original_url,
                u.description,
                u.clicks,
                u.created_at,
                u.is_custom,
                usr.email as user_email,
                usr.name as user_name
            FROM urls u
            LEFT JOIN users usr ON u.user_id = usr.id
            ORDER BY u.created_at DESC
            LIMIT ?
        `, [limit]);

        return activity;
    }

    /**
     * Obter tamanho do banco de dados
     */
    static async getDatabaseSize() {
        const [result] = await pool.query(`
            SELECT
                table_schema as database_name,
                SUM(data_length + index_length) as size_bytes,
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            GROUP BY table_schema
        `);

        if (result.length === 0) {
            return { size_bytes: 0, size_mb: 0 };
        }

        return {
            database_name: result[0].database_name,
            size_bytes: result[0].size_bytes,
            size_mb: result[0].size_mb
        };
    }

    /**
     * Obter estatísticas de tabelas
     */
    static async getTableStats() {
        const [tables] = await pool.query(`
            SELECT
                table_name,
                table_rows,
                ROUND(data_length / 1024 / 1024, 2) as data_mb,
                ROUND(index_length / 1024 / 1024, 2) as index_mb,
                ROUND((data_length + index_length) / 1024 / 1024, 2) as total_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
        `);

        return tables;
    }

    /**
     * Obter estatísticas por dia (últimos 30 dias)
     */
    static async getActivityByDay() {
        const [stats] = await pool.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as links_created,
                SUM(clicks) as total_clicks
            FROM urls
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        return stats;
    }

    /**
     * Deletar usuário e seus links
     * @param {number} userId - ID do usuário
     */
    static async deleteUser(userId) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Deletar links do usuário
            await connection.query('DELETE FROM urls WHERE user_id = ?', [userId]);

            // Deletar usuário
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);

            await connection.commit();

            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Deletar link específico
     * @param {number} linkId - ID do link
     */
    static async deleteLink(linkId) {
        await pool.query('DELETE FROM urls WHERE id = ?', [linkId]);
        return { success: true };
    }

    /**
     * Limpar links expirados
     */
    static async cleanExpiredLinks() {
        const [result] = await pool.query(`
            DELETE FROM urls
            WHERE expires_at IS NOT NULL AND expires_at <= NOW()
        `);

        return {
            deleted: result.affectedRows
        };
    }
}

module.exports = AdminModel;
