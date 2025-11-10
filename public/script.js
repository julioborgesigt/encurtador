// Elementos do DOM
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const shortUrlDisplay = document.getElementById('shortUrlDisplay');
const originalUrlDisplay = document.getElementById('originalUrlDisplay');
const qrCodeImage = document.getElementById('qrCodeImage');
const clickCount = document.getElementById('clickCount');
const createdDate = document.getElementById('createdDate');
const urlsList = document.getElementById('urlsList');

// Dados da URL atual
let currentUrlData = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUrls();
});

shortenBtn.addEventListener('click', shortenUrl);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

// Função principal: Encurtar URL
async function shortenUrl() {
    const url = urlInput.value.trim();
    
    // Validação
    if (!url) {
        showError('Por favor, insira uma URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Por favor, insira uma URL válida (deve começar com http:// ou https://)');
        return;
    }
    
    // Desabilitar botão e mostrar loading
    shortenBtn.disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.btn-loading').style.display = 'inline';
    hideError();
    
    try {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao encurtar URL');
        }
        
        // Armazenar dados e mostrar resultado
        currentUrlData = data;
        displayResult(data);
        
        // Recarregar lista de URLs
        loadUrls();
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Reabilitar botão
        shortenBtn.disabled = false;
        document.querySelector('.btn-text').style.display = 'inline';
        document.querySelector('.btn-loading').style.display = 'none';
    }
}

// Validar URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Mostrar resultado
function displayResult(data) {
    shortUrlDisplay.value = data.short_url;
    originalUrlDisplay.value = data.original_url;
    qrCodeImage.src = data.qr_code;
    clickCount.textContent = data.clicks;
    createdDate.textContent = formatDate(data.created_at);
    
    // Mostrar seção de resultado
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Copiar para clipboard
async function copyToClipboard(elementId) {
    const input = document.getElementById(elementId);
    const text = input.value;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Feedback visual
        const button = input.nextElementSibling;
        const originalText = button.textContent;
        button.textContent = '✅ Copiado!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (error) {
        alert('Erro ao copiar. Por favor, copie manualmente.');
    }
}

// Baixar QR Code
function downloadQRCode() {
    if (!currentUrlData) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${currentUrlData.short_code}.png`;
    link.href = currentUrlData.qr_code;
    link.click();
}

// Criar novo link
function createNew() {
    urlInput.value = '';
    resultSection.style.display = 'none';
    currentUrlData = null;
    urlInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Carregar lista de URLs
async function loadUrls() {
    urlsList.innerHTML = '<p class="loading">Carregando...</p>';
    
    try {
        const response = await fetch('/api/urls');
        const urls = await response.json();
        
        if (urls.length === 0) {
            urlsList.innerHTML = `
                <div class="empty-state">
                    <p>📭</p>
                    <p>Nenhum link criado ainda</p>
                </div>
            `;
            return;
        }
        
        urlsList.innerHTML = urls.map(url => `
            <div class="url-item">
                <div class="url-item-header">
                    <div class="url-info">
                        <div class="url-short">${url.short_url}</div>
                        <div class="url-original" title="${url.original_url}">
                            ${url.original_url}
                        </div>
                    </div>
                    <div class="url-actions">
                        <button class="btn-icon" onclick="copyUrlToClipboard('${url.short_url}')" title="Copiar">
                            📋
                        </button>
                        <button class="btn-icon" onclick="viewStats('${url.short_code}')" title="Ver estatísticas">
                            📊
                        </button>
                        <button class="btn-icon delete" onclick="deleteUrl('${url.short_code}')" title="Deletar">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="url-item-footer">
                    <span>👆 ${url.clicks} cliques</span>
                    <span>📅 ${formatDate(url.created_at)}</span>
                    ${url.last_accessed ? `<span>🕐 Último acesso: ${formatDate(url.last_accessed)}</span>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        urlsList.innerHTML = `
            <div class="empty-state">
                <p>❌</p>
                <p>Erro ao carregar URLs: ${error.message}</p>
            </div>
        `;
    }
}

// Copiar URL da lista
async function copyUrlToClipboard(url) {
    try {
        await navigator.clipboard.writeText(url);
        
        // Feedback simples
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅';
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } catch (error) {
        alert('Erro ao copiar URL');
    }
}

// Ver estatísticas
async function viewStats(shortCode) {
    try {
        const response = await fetch(`/api/stats/${shortCode}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        alert(`
📊 Estatísticas do Link

🔗 Link Curto: ${data.short_url}
🌐 URL Original: ${data.original_url}
👆 Total de Cliques: ${data.clicks}
📅 Criado em: ${formatDate(data.created_at)}
${data.last_accessed ? `🕐 Último acesso: ${formatDate(data.last_accessed)}` : '🕐 Ainda não foi acessado'}
        `);
    } catch (error) {
        alert('Erro ao carregar estatísticas: ' + error.message);
    }
}

// Deletar URL
async function deleteUrl(shortCode) {
    if (!confirm('Tem certeza que deseja deletar este link? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/urls/${shortCode}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        // Recarregar lista
        loadUrls();
        
        // Se era o link atual sendo exibido, esconder
        if (currentUrlData && currentUrlData.short_code === shortCode) {
            resultSection.style.display = 'none';
            currentUrlData = null;
        }
        
    } catch (error) {
        alert('Erro ao deletar URL: ' + error.message);
    }
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mostrar erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Esconder erro
function hideError() {
    errorMessage.style.display = 'none';
}
