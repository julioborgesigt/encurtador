/**
 * Model para operações de URLs no banco de dados
 */

const pool = require('../database');

class UrlModel {
  /**
   * Cria uma nova URL encurtada no banco
   * @param {Object} data - Dados da URL
   * @returns {Promise<Object>} Resultado da inserção
   */
  static async create(data) {
    const {
      userId,
      originalUrl,
      shortCode,
      description,
      qrCode,
      isCustom,
      expiresAt
    } = data;

    const [result] = await pool.query(
      `INSERT INTO urls (
        user_id, original_url, short_code, description,
        qr_code, is_custom, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, originalUrl, shortCode, description, qrCode, isCustom, expiresAt]
    );

    return result;
  }

  /**
   * Busca uma URL pelo código curto
   * @param {string} shortCode - Código curto
   * @returns {Promise<Object|null>} URL encontrada ou null
   */
  static async findByShortCode(shortCode) {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_code = ?',
      [shortCode]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Busca uma URL duplicada (mesma URL original, não customizada)
   * @param {string} originalUrl - URL original
   * @returns {Promise<Object|null>} URL encontrada ou null
   */
  static async findDuplicate(originalUrl) {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE original_url = ? AND is_custom = FALSE',
      [originalUrl]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Busca URLs com paginação e filtros
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} URLs e total
   */
  static async findMany(params) {
    const {
      userId,
      search,
      month,
      year,
      limit,
      offset
    } = params;

    let query = 'SELECT * FROM urls';
    let countQuery = 'SELECT COUNT(*) as total FROM urls';
    const queryParams = [];
    const countParams = [];
    const conditions = [];

    // Filtrar por usuário
    if (userId !== undefined) {
      if (userId === null) {
        // Guest user: apenas links sem user_id
        conditions.push('user_id IS NULL');
      } else {
        // Authenticated user: apenas links deste usuário
        conditions.push('user_id = ?');
        queryParams.push(userId);
        countParams.push(userId);
      }
    }

    // Busca por texto
    if (search) {
      conditions.push('(original_url LIKE ? OR short_code LIKE ? OR description LIKE ?)');
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    // Filtro por data
    if (year) {
      if (month) {
        conditions.push('YEAR(created_at) = ? AND MONTH(created_at) = ?');
        queryParams.push(year, month);
        countParams.push(year, month);
      } else {
        conditions.push('YEAR(created_at) = ?');
        queryParams.push(year);
        countParams.push(year);
      }
    }

    // Aplicar condições
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Ordenação e paginação
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Executar queries
    const [rows] = await pool.query(query, queryParams);
    const [countResult] = await pool.query(countQuery, countParams);

    return {
      urls: rows,
      total: countResult[0].total
    };
  }

  /**
   * Incrementa o contador de cliques e atualiza last_accessed
   * @param {number} id - ID da URL
   * @returns {Promise<void>}
   */
  static async incrementClicks(id) {
    await pool.query(
      'UPDATE urls SET clicks = clicks + 1, last_accessed = NOW() WHERE id = ?',
      [id]
    );
  }

  /**
   * Deleta uma URL pelo código curto
   * @param {string} shortCode - Código curto
   * @returns {Promise<Object>} Resultado da deleção
   */
  static async deleteByShortCode(shortCode) {
    const [result] = await pool.query(
      'DELETE FROM urls WHERE short_code = ?',
      [shortCode]
    );

    return result;
  }

  /**
   * Deleta uma URL pelo ID
   * @param {number} id - ID da URL
   * @returns {Promise<Object>} Resultado da deleção
   */
  static async deleteById(id) {
    const [result] = await pool.query(
      'DELETE FROM urls WHERE id = ?',
      [id]
    );

    return result;
  }

  /**
   * Verifica se uma URL expirou
   * @param {Object} url - Objeto da URL
   * @returns {boolean} True se expirou
   */
  static isExpired(url) {
    if (!url.expires_at) {
      return false;
    }

    return new Date(url.expires_at) < new Date();
  }

  /**
   * Busca estatísticas de uma URL
   * @param {string} shortCode - Código curto
   * @returns {Promise<Object|null>} Estatísticas ou null
   */
  static async getStats(shortCode) {
    const [rows] = await pool.query(
      `SELECT
        original_url,
        short_code,
        description,
        clicks,
        created_at,
        last_accessed,
        expires_at,
        is_custom
      FROM urls
      WHERE short_code = ?`,
      [shortCode]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Conta URLs por usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<number>} Total de URLs
   */
  static async countByUser(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total FROM urls WHERE user_id = ?',
      [userId]
    );

    return rows[0].total;
  }

  /**
   * Busca URLs expirando em breve
   * @param {number} days - Dias até expiração
   * @returns {Promise<Array>} URLs expirando
   */
  static async findExpiringSoon(days = 3) {
    const [rows] = await pool.query(
      `SELECT * FROM urls
       WHERE expires_at IS NOT NULL
       AND expires_at > NOW()
       AND expires_at <= DATE_ADD(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    return rows;
  }

  /**
   * Remove URLs expiradas
   * @returns {Promise<number>} Número de URLs removidas
   */
  static async cleanupExpired() {
    const [result] = await pool.query(
      'DELETE FROM urls WHERE expires_at IS NOT NULL AND expires_at < NOW()'
    );

    return result.affectedRows;
  }
}

module.exports = UrlModel;
