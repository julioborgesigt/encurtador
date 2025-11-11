// Elementos do DOM
const urlInput = document.getElementById('urlInput');
const descriptionInput = document.getElementById('descriptionInput');
const customCodeInput = document.getElementById('customCodeInput');
const expiresInInput = document.getElementById('expiresInInput');
const shortenBtn = document.getElementById('shortenBtn');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const shortUrlDisplay = document.getElementById('shortUrlDisplay');
const originalUrlDisplay = document.getElementById('originalUrlDisplay');
const qrCodeImage = document.getElementById('qrCodeImage');
const clickCount = document.getElementById('clickCount');
const createdDate = document.getElementById('createdDate');
const urlsList = document.getElementById('urlsList');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');

// Dados da URL atual
let currentUrlData = null;
let currentPage = 1;
let currentSearch = '';
let currentMonth = '';
let currentYear = '';
let searchTimeout = null;

// Estado de autenticação
let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadUrls();
    populateYearFilter();
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenu && !userMenu.contains(e.target) && userDropdown) {
        userDropdown.style.display = 'none';
    }
});

shortenBtn.addEventListener('click', shortenUrl);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

// ========================================
// Funções de Autenticação
// ========================================

/**
 * Verificar status de autenticação
 */
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();

        if (data.authenticated && data.user) {
            currentUser = data.user;
            showUserMenu(data.user);
        } else {
            currentUser = null;
            showLoginButton();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showLoginButton();
    }
}

/**
 * Mostrar botão de login
 */
function showLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');

    if (loginBtn) loginBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';

    // Desabilitar opções avançadas para usuários não autenticados
    restrictGuestAccess();
}

/**
 * Mostrar menu do usuário
 */
function showUserMenu(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';

    // Atualizar informações do usuário
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userNameDropdown = document.getElementById('userNameDropdown');
    const userEmailDropdown = document.getElementById('userEmailDropdown');
    const userAvatarDropdown = document.getElementById('userAvatarDropdown');

    if (userName) userName.textContent = user.name.split(' ')[0]; // Primeiro nome
    if (userAvatar) userAvatar.src = user.picture || '/default-avatar.png';
    if (userNameDropdown) userNameDropdown.textContent = user.name;
    if (userEmailDropdown) userEmailDropdown.textContent = user.email;
    if (userAvatarDropdown) userAvatarDropdown.src = user.picture || '/default-avatar.png';

    // Habilitar opções avançadas para usuários autenticados
    enablePremiumAccess();
}

/**
 * Restringir acesso para usuários não autenticados (guest)
 */
function restrictGuestAccess() {
    // Mostrar aviso de login necessário nas opções avançadas
    const loginNotice = document.getElementById('loginRequiredNotice');
    if (loginNotice) loginNotice.style.display = 'block';

    // Mostrar badges premium
    const badges = ['descriptionBadge', 'customCodeBadge', 'expiresBadge'];
    badges.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) badge.style.display = 'inline';
    });

    // Mostrar aviso de expiração automática em 7 dias
    const guestNotice = document.getElementById('guestExpirationNotice');
    if (guestNotice) guestNotice.style.display = 'block';

    // Desabilitar campos avançados
    const descriptionInput = document.getElementById('descriptionInput');
    const customCodeInput = document.getElementById('customCodeInput');
    const expiresInInput = document.getElementById('expiresInInput');

    if (descriptionInput) {
        descriptionInput.disabled = true;
        descriptionInput.placeholder = '🔒 Faça login para adicionar descrição';
    }

    if (customCodeInput) {
        customCodeInput.disabled = true;
        customCodeInput.placeholder = '🔒 Faça login para código personalizado';
    }

    if (expiresInInput) {
        expiresInInput.disabled = true;
    }

    // Ocultar histórico e mostrar aviso
    const guestHistoryNotice = document.getElementById('guestHistoryNotice');
    const authenticatedHistory = document.getElementById('authenticatedHistory');

    if (guestHistoryNotice) guestHistoryNotice.style.display = 'block';
    if (authenticatedHistory) authenticatedHistory.style.display = 'none';
}

/**
 * Habilitar acesso premium para usuários autenticados
 */
function enablePremiumAccess() {
    // Ocultar aviso de login necessário
    const loginNotice = document.getElementById('loginRequiredNotice');
    if (loginNotice) loginNotice.style.display = 'none';

    // Ocultar badges premium
    const badges = ['descriptionBadge', 'customCodeBadge', 'expiresBadge'];
    badges.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) badge.style.display = 'none';
    });

    // Ocultar aviso de expiração
    const guestNotice = document.getElementById('guestExpirationNotice');
    if (guestNotice) guestNotice.style.display = 'none';

    // Habilitar campos avançados
    const descriptionInput = document.getElementById('descriptionInput');
    const customCodeInput = document.getElementById('customCodeInput');
    const expiresInInput = document.getElementById('expiresInInput');

    if (descriptionInput) {
        descriptionInput.disabled = false;
        descriptionInput.placeholder = 'ex: Site da empresa, Link do produto...';
    }

    if (customCodeInput) {
        customCodeInput.disabled = false;
        customCodeInput.placeholder = 'ex: meu-link';
    }

    if (expiresInInput) {
        expiresInInput.disabled = false;
    }

    // Mostrar histórico e ocultar aviso
    const guestHistoryNotice = document.getElementById('guestHistoryNotice');
    const authenticatedHistory = document.getElementById('authenticatedHistory');

    if (guestHistoryNotice) guestHistoryNotice.style.display = 'none';
    if (authenticatedHistory) authenticatedHistory.style.display = 'block';
}

/**
 * Iniciar login com Google
 */
function login() {
    window.location.href = '/auth/google';
}

/**
 * Fazer logout
 */
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = '/auth/logout';
    }
}

/**
 * Toggle do dropdown do usuário
 */
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// ========================================
// Funções da Aplicação
// ========================================

// Função para toggle das opções avançadas
function toggleAdvancedOptions() {
    const content = document.getElementById('advancedOptionsContent');
    if (content.style.display === 'none') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

// Função principal: Encurtar URL
async function shortenUrl() {
    const url = urlInput.value.trim();
    const description = descriptionInput.value.trim();
    const customCode = customCodeInput.value.trim();
    const expiresIn = expiresInInput.value;

    // Validação
    if (!url) {
        showError('Por favor, insira uma URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('Por favor, insira uma URL válida (deve começar com http:// ou https://)');
        return;
    }

    // Validar custom code se fornecido
    if (customCode && !isValidCustomCode(customCode)) {
        showError('Código personalizado inválido. Use apenas letras, números e hífens (3-30 caracteres)');
        return;
    }

    // Desabilitar botão e mostrar loading
    shortenBtn.disabled = true;
    document.querySelector('.btn-text').style.display = 'none';
    document.querySelector('.btn-loading').style.display = 'inline';
    hideError();

    try {
        const body = { url };
        if (description) body.description = description;
        if (customCode) body.customCode = customCode;
        if (expiresIn) body.expiresIn = expiresIn;

        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao encurtar URL');
        }

        // Armazenar dados e mostrar resultado
        currentUrlData = data;
        displayResult(data);

        // Limpar campos
        descriptionInput.value = '';
        customCodeInput.value = '';
        expiresInInput.value = '';

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

// Validar custom code
function isValidCustomCode(code) {
    const regex = /^[a-zA-Z0-9-]{3,30}$/;
    return regex.test(code);
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

    // Mostrar seção de resultado
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Fechar resultado
function closeResult() {
    resultSection.style.display = 'none';
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

// Busca com debounce
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        loadUrls();
    }, 500);
}

// Carregar lista de URLs com paginação e busca
async function loadUrls(page = currentPage) {
    urlsList.innerHTML = '<p class="loading">Carregando...</p>';

    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });

        if (currentSearch) {
            params.append('search', currentSearch);
        }

        if (currentMonth) {
            params.append('month', currentMonth);
        }

        if (currentYear) {
            params.append('year', currentYear);
        }

        const response = await fetch(`/api/urls?${params}`);
        const data = await response.json();

        if (data.urls.length === 0) {
            urlsList.innerHTML = `
                <div class="empty-state">
                    <p>📭</p>
                    <p>${currentSearch ? 'Nenhum link encontrado' : 'Nenhum link criado ainda'}</p>
                </div>
            `;
            document.getElementById('pagination').style.display = 'none';
            return;
        }

        urlsList.innerHTML = data.urls.map(url => `
            <div class="url-item">
                <div class="url-item-header">
                    <div class="url-info">
                        ${url.description ? `<div class="url-description">📝 ${url.description}</div>` : ''}
                        <div class="url-short">
                            ${url.short_url}
                            ${url.is_custom ? '<span style="color: var(--success-color); margin-left: 5px;">✨ Personalizado</span>' : ''}
                            ${url.expires_at ? `<span style="color: var(--danger-color); margin-left: 5px;">⏰ Expira: ${formatDate(url.expires_at)}</span>` : ''}
                        </div>
                        <div class="url-original" title="${url.original_url}">
                            ${url.original_url}
                        </div>
                    </div>
                    <div class="url-actions">
                        <button class="btn-icon" onclick="copyUrlToClipboard('${url.short_url}', event)" title="Copiar">
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

        // Renderizar paginação
        renderPagination(data.pagination);
        currentPage = page;

    } catch (error) {
        urlsList.innerHTML = `
            <div class="empty-state">
                <p>❌</p>
                <p>Erro ao carregar URLs: ${error.message}</p>
            </div>
        `;
        document.getElementById('pagination').style.display = 'none';
    }
}

// Renderizar paginação
function renderPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');

    if (pagination.totalPages <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }

    paginationDiv.style.display = 'flex';

    let html = `
        <button onclick="loadUrls(1)" ${pagination.page === 1 ? 'disabled' : ''}>Primeira</button>
        <button onclick="loadUrls(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>Anterior</button>
        <span class="page-info">Página ${pagination.page} de ${pagination.totalPages}</span>
        <button onclick="loadUrls(${pagination.page + 1})" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>Próxima</button>
        <button onclick="loadUrls(${pagination.totalPages})" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>Última</button>
    `;

    paginationDiv.innerHTML = html;
}

// Copiar URL da lista
async function copyUrlToClipboard(url, event) {
    try {
        await navigator.clipboard.writeText(url);

        // Feedback elegante no botão
        const button = event ? event.currentTarget : event;
        if (button) {
            const originalText = button.textContent;
            const originalBg = button.style.backgroundColor;

            button.textContent = '✅ Copiado!';
            button.style.backgroundColor = '#10b981';
            button.style.transform = 'scale(1.1)';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = originalBg;
                button.style.transform = '';
            }, 2000);
        }

        // Toast notification elegante
        showToast('✅ Link copiado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao copiar:', error);

        // Fallback: tentar copiar de outra forma
        try {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            showToast('✅ Link copiado!', 'success');
        } catch (fallbackError) {
            showToast('❌ Não foi possível copiar automaticamente', 'error');
        }
    }
}

// Ver estatísticas com modal
async function viewStats(shortCode) {
    const modal = document.getElementById('statsModal');
    const content = document.getElementById('statsContent');

    modal.style.display = 'flex';
    content.innerHTML = '<p class="loading">Carregando...</p>';

    try {
        const response = await fetch(`/api/stats/${shortCode}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        content.innerHTML = `
            <div class="stat-row">
                <label>🔗 Link Curto:</label>
                <div class="value">${data.short_url}</div>
            </div>
            <div class="stat-row">
                <label>🌐 URL Original:</label>
                <div class="value" style="word-break: break-all;">${data.original_url}</div>
            </div>
            <div class="stat-row">
                <label>👆 Total de Cliques:</label>
                <div class="value">${data.clicks}</div>
            </div>
            <div class="stat-row">
                <label>📅 Criado em:</label>
                <div class="value">${formatDate(data.created_at)}</div>
            </div>
            ${data.last_accessed ? `
            <div class="stat-row">
                <label>🕐 Último acesso:</label>
                <div class="value">${formatDate(data.last_accessed)}</div>
            </div>
            ` : `
            <div class="stat-row">
                <label>🕐 Status:</label>
                <div class="value">Ainda não foi acessado</div>
            </div>
            `}
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="empty-state">
                <p>❌</p>
                <p>Erro ao carregar estatísticas: ${error.message}</p>
            </div>
        `;
    }
}

// Fechar modal de estatísticas
function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const statsModal = document.getElementById('statsModal');
    const pdfModal = document.getElementById('pdfCustomizerModal');

    if (event.target === statsModal) {
        closeStatsModal();
    }
    if (event.target === pdfModal) {
        closePdfCustomizer();
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

// Mostrar toast notification elegante
function showToast(message, type = 'success') {
    // Remover toasts anteriores
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    // Criar toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // Adicionar ao body
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Popular filtro de anos
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // Ano inicial do sistema

    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}

// Manipular mudança de filtros
function handleFilterChange() {
    currentMonth = monthFilter.value;
    currentYear = yearFilter.value;
    currentPage = 1;
    loadUrls();
}

// Limpar filtros
function clearFilters() {
    searchInput.value = '';
    monthFilter.value = '';
    yearFilter.value = '';
    currentSearch = '';
    currentMonth = '';
    currentYear = '';
    currentPage = 1;
    loadUrls();
}

// Abrir modal de personalização de PDF
function openPdfCustomizer() {
    document.getElementById('pdfCustomizerModal').style.display = 'flex';
    // Inicializar drag and drop após abrir o modal
    setTimeout(() => initializePdfDragAndDrop(), 100);
}

// Fechar modal de personalização de PDF
function closePdfCustomizer() {
    document.getElementById('pdfCustomizerModal').style.display = 'none';
}

// Variáveis para drag and drop
let draggedElement = null;

// Inicializar drag and drop quando o modal abrir
function initializePdfDragAndDrop() {
    const options = document.querySelectorAll('.checkbox-option');

    options.forEach(option => {
        option.addEventListener('dragstart', handleDragStart);
        option.addEventListener('dragend', handleDragEnd);
        option.addEventListener('dragover', handleDragOver);
        option.addEventListener('drop', handleDrop);
        option.addEventListener('dragenter', handleDragEnter);
        option.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');

    // Remover classe de todos os elementos
    document.querySelectorAll('.checkbox-option').forEach(option => {
        option.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== this) {
        // Obter o container pai
        const container = document.getElementById('pdfOptions');
        const allOptions = [...container.children];
        const draggedIndex = allOptions.indexOf(draggedElement);
        const targetIndex = allOptions.indexOf(this);

        // Reordenar elementos
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }

    this.classList.remove('drag-over');
    return false;
}

// Gerar PDF personalizado com opções selecionadas
async function generateCustomPDF() {
    if (!currentUrlData) return;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPosition = 20;

        // Obter todas as opções na ordem do DOM
        const container = document.getElementById('pdfOptions');
        const options = [...container.children];

        // Verificar se pelo menos uma opção está marcada
        const hasCheckedOption = options.some(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            return checkbox && checkbox.checked;
        });

        if (!hasCheckedOption) {
            alert('Por favor, selecione pelo menos uma informação para incluir no PDF.');
            return;
        }

        // Processar cada opção na ordem que aparecem no DOM
        for (const option of options) {
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (!checkbox || !checkbox.checked) continue;

            const field = option.dataset.field;

            switch (field) {
                case 'title':
                    const title = currentUrlData.description || 'Link Encurtado';
                    doc.setFontSize(20);
                    doc.setFont(undefined, 'bold');
                    doc.text(title, 105, yPosition, { align: 'center' });
                    yPosition += 10;

                    // Linha decorativa
                    doc.setLineWidth(0.5);
                    doc.line(20, yPosition, 190, yPosition);
                    yPosition += 15;
                    break;

                case 'shortUrl':
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('Link Curto:', 20, yPosition);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.text(currentUrlData.short_url, 20, yPosition + 8);
                    yPosition += 20;
                    break;

                case 'originalUrl':
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('URL Original:', 20, yPosition);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    const originalUrlLines = doc.splitTextToSize(currentUrlData.original_url, 170);
                    doc.text(originalUrlLines, 20, yPosition + 8);
                    yPosition += 8 + (originalUrlLines.length * 7) + 12;
                    break;

                case 'stats':
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('Estatísticas:', 20, yPosition);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.text(`Cliques: ${currentUrlData.clicks}`, 20, yPosition + 8);
                    doc.text(`Criado em: ${formatDate(currentUrlData.created_at)}`, 20, yPosition + 16);
                    yPosition += 28;
                    break;

                case 'qrCode':
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('QR Code:', 20, yPosition);
                    yPosition += 5;

                    // Adicionar imagem do QR Code centralizada
                    const qrCodeSize = 80;
                    doc.addImage(currentUrlData.qr_code, 'PNG', 65, yPosition, qrCodeSize, qrCodeSize);
                    yPosition += qrCodeSize + 10;
                    break;
            }
        }

        // Rodapé discreto
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado pelo Encurtador de URLs', 105, yPosition, { align: 'center' });

        // Salvar PDF
        const fileName = currentUrlData.description
            ? `${currentUrlData.description.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            : `link_${currentUrlData.short_code}.pdf`;

        doc.save(fileName);

        // Fechar modal
        closePdfCustomizer();

        // Mostrar toast de sucesso
        showToast('✅ PDF gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Por favor, tente novamente.');
    }
}
