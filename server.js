const express = require('express');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const pool = require('./database');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Função auxiliar para validar URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Criar link curto
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ 
      error: 'URL inválida. Por favor, forneça uma URL válida.' 
    });
  }
  
  try {
    // Verificar se a URL já existe
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE original_url = ?',
      [url]
    );
    
    if (rows.length > 0) {
      const row = rows[0];
      const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;
      
      return res.json({
        original_url: row.original_url,
        short_url: shortUrl,
        short_code: row.short_code,
        qr_code: row.qr_code,
        clicks: row.clicks,
        created_at: row.created_at
      });
    }
    
    // Gerar código curto único
    const shortCode = nanoid(7);
    
    // Gerar QR Code
    const qrCodeDataURL = await QRCode.toDataURL(
      `${req.protocol}://${req.get('host')}/${shortCode}`
    );
    
    // Salvar no banco de dados
    await pool.query(
      'INSERT INTO urls (original_url, short_code, qr_code) VALUES (?, ?, ?)',
      [url, shortCode, qrCodeDataURL]
    );
    
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
    
    res.json({
      original_url: url,
      short_url: shortUrl,
      short_code: shortCode,
      qr_code: qrCodeDataURL,
      clicks: 0,
      created_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// API: Listar todas as URLs
app.get('/api/urls', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM urls ORDER BY created_at DESC'
    );
    
    const urls = rows.map(row => ({
      id: row.id,
      original_url: row.original_url,
      short_url: `${req.protocol}://${req.get('host')}/${row.short_code}`,
      short_code: row.short_code,
      qr_code: row.qr_code,
      clicks: row.clicks,
      created_at: row.created_at,
      last_accessed: row.last_accessed
    }));
    
    res.json(urls);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar URLs' });
  }
});

// API: Obter estatísticas de uma URL específica
app.get('/api/stats/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_code = ?',
      [shortCode]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
    
    const row = rows[0];
    
    res.json({
      original_url: row.original_url,
      short_url: `${req.protocol}://${req.get('host')}/${row.short_code}`,
      short_code: row.short_code,
      clicks: row.clicks,
      created_at: row.created_at,
      last_accessed: row.last_accessed
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// API: Deletar URL
app.delete('/api/urls/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM urls WHERE short_code = ?',
      [shortCode]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }
    
    res.json({ message: 'URL deletada com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar URL' });
  }
});

// Rota de redirecionamento
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_code = ?',
      [shortCode]
    );
    
    if (rows.length === 0) {
      return res.status(404).send('URL não encontrada');
    }
    
    const row = rows[0];
    
    // Atualizar contador de cliques
    await pool.query(
      'UPDATE urls SET clicks = clicks + 1, last_accessed = NOW() WHERE short_code = ?',
      [shortCode]
    );
    
    // Redirecionar
    res.redirect(row.original_url);
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Usando MySQL/MariaDB como banco de dados`);
});
