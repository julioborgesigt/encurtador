/**
 * Keep-Alive Service
 *
 * Mantém o servidor ativo fazendo auto-ping periódico
 * Previne que o Render "adormeça" o serviço em planos gratuitos
 */

const https = require('https');
const http = require('http');

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.pingInterval = 12 * 60 * 1000; // 12 minutos (antes dos 15 min do Render)
    this.enabled = false;
  }

  /**
   * Inicia o serviço de keep-alive
   * @param {string} url - URL completa para fazer ping (ex: https://meusite.com)
   */
  start(url) {
    // Só ativar em produção
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏸️  Keep-Alive: Desabilitado (desenvolvimento)');
      return;
    }

    // Verificar se URL foi fornecida
    if (!url) {
      console.log('⚠️  Keep-Alive: URL não configurada, serviço desabilitado');
      return;
    }

    this.enabled = true;
    const healthUrl = `${url}/health`;

    console.log('🔄 Keep-Alive: Iniciado');
    console.log(`📍 Endpoint: ${healthUrl}`);
    console.log(`⏱️  Intervalo: ${this.pingInterval / 1000 / 60} minutos`);

    // Fazer primeiro ping após 1 minuto
    setTimeout(() => {
      this.ping(healthUrl);
    }, 60000);

    // Configurar pings periódicos
    this.intervalId = setInterval(() => {
      this.ping(healthUrl);
    }, this.pingInterval);
  }

  /**
   * Faz ping no endpoint
   * @param {string} url - URL para ping
   */
  ping(url) {
    const protocol = url.startsWith('https') ? https : http;
    const timestamp = new Date().toISOString();

    protocol.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Keep-Alive ping: OK [${timestamp}]`);
      } else {
        console.log(`⚠️  Keep-Alive ping: Status ${res.statusCode} [${timestamp}]`);
      }
    }).on('error', (err) => {
      console.error(`❌ Keep-Alive ping falhou: ${err.message} [${timestamp}]`);
    });
  }

  /**
   * Para o serviço de keep-alive
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.enabled = false;
      console.log('⏸️  Keep-Alive: Parado');
    }
  }

  /**
   * Verifica se o serviço está ativo
   */
  isEnabled() {
    return this.enabled;
  }
}

// Exportar instância singleton
module.exports = new KeepAliveService();
