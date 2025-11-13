// Estado global
let dashboardData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

// Navegar entre seções
function showSection(section) {
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Usuários',
        'database': 'Banco de Dados',
        'maintenance': 'Manutenção'
    };
    document.getElementById('page-title').textContent = titles[section];

    // Carregar dados da seção se necessário
    if (section === 'users') {
        loadUsers();
    } else if (section === 'database') {
        loadDatabaseInfo();
    }
}

// Carregar dashboard
async function loadDashboard() {
    try {
        const response = await fetch('/admin/api/dashboard');

        if (!response.ok) {
            if (response.status === 403) {
                showToast('Você não tem permissão para acessar o painel admin', 'error');
                setTimeout(() => window.location.href = '/', 2000);
                return;
            }
            throw new Error('Erro ao carregar dashboard');
        }

        dashboardData = await response.json();
        displayDashboard(dashboardData);
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar dashboard', 'error');
    }
}

// Exibir dashboard
function displayDashboard(data) {
    // Estatísticas gerais
    document.getElementById('total-users').textContent = formatNumber(data.general.totalUsers);
    document.getElementById('recent-users').textContent = `+${data.general.recentUsers} últimos 30 dias`;

    document.getElementById('total-links').textContent = formatNumber(data.general.totalLinks);
    document.getElementById('recent-links').textContent = `+${data.general.recentLinks} últimos 30 dias`;

    document.getElementById('total-clicks').textContent = formatNumber(data.general.totalClicks);

    document.getElementById('db-size').textContent = `${data.database.size_mb} MB`;
    document.getElementById('db-name').textContent = data.database.database_name || 'Database';

    // Estatísticas secundárias
    document.getElementById('active-links').textContent = formatNumber(data.general.activeLinks);
    document.getElementById('expired-links').textContent = formatNumber(data.general.expiredLinks);
    document.getElementById('custom-links').textContent = formatNumber(data.general.customLinks);
    document.getElementById('generated-links').textContent = formatNumber(data.general.generatedLinks);

    // Top links
    displayTopLinks(data.topLinks);

    // Atividade recente
    displayRecentActivity(data.recentActivity);
}

// Exibir top links
function displayTopLinks(links) {
    const container = document.getElementById('top-links-container');

    if (links.length === 0) {
        container.innerHTML = '<p class="loading">Nenhum link encontrado</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Posição</th>
                    <th>Código</th>
                    <th>URL</th>
                    <th>Cliques</th>
                    <th>Usuário</th>
                    <th>Criado</th>
                </tr>
            </thead>
            <tbody>
                ${links.map((link, index) => `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td><span class="badge badge-success">${link.short_code}</span></td>
                        <td>
                            ${link.description ? `<strong>${link.description}</strong><br>` : ''}
                            <span style="font-size: 0.75rem; color: var(--gray);">${truncateUrl(link.original_url, 50)}</span>
                        </td>
                        <td><strong>${formatNumber(link.clicks)}</strong></td>
                        <td>
                            ${link.user_email ? `
                                <div class="user-details">
                                    <span class="user-name">${link.user_name || 'Usuário'}</span>
                                    <span class="user-email">${link.user_email}</span>
                                </div>
                            ` : '<span style="color: var(--gray);">Guest</span>'}
                        </td>
                        <td>${formatDate(link.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Exibir atividade recente
function displayRecentActivity(activity) {
    const container = document.getElementById('recent-activity-container');

    if (activity.length === 0) {
        container.innerHTML = '<p class="loading">Nenhuma atividade recente</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>URL</th>
                    <th>Tipo</th>
                    <th>Cliques</th>
                    <th>Usuário</th>
                    <th>Criado</th>
                </tr>
            </thead>
            <tbody>
                ${activity.map(link => `
                    <tr>
                        <td><span class="badge badge-success">${link.short_code}</span></td>
                        <td>
                            ${link.description ? `<strong>${link.description}</strong><br>` : ''}
                            <span style="font-size: 0.75rem; color: var(--gray);">${truncateUrl(link.original_url, 50)}</span>
                        </td>
                        <td>
                            ${link.is_custom ?
                                '<span class="badge badge-warning">✨ Custom</span>' :
                                '<span class="badge badge-success">🤖 Auto</span>'}
                        </td>
                        <td>${formatNumber(link.clicks)}</td>
                        <td>
                            ${link.user_email ? `
                                <div class="user-details">
                                    <span class="user-name">${link.user_name || 'Usuário'}</span>
                                    <span class="user-email">${link.user_email}</span>
                                </div>
                            ` : '<span style="color: var(--gray);">Guest</span>'}
                        </td>
                        <td>${formatDate(link.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Carregar usuários
async function loadUsers() {
    const container = document.getElementById('users-container');
    container.innerHTML = '<p class="loading">Carregando...</p>';

    try {
        const response = await fetch('/admin/api/users');
        if (!response.ok) throw new Error('Erro ao carregar usuários');

        const data = await response.json();
        displayUsers(data.users);
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="loading">Erro ao carregar usuários</p>';
    }
}

// Exibir usuários
function displayUsers(users) {
    const container = document.getElementById('users-container');

    if (users.length === 0) {
        container.innerHTML = '<p class="loading">Nenhum usuário encontrado</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Usuário</th>
                    <th>Total de Links</th>
                    <th>Total de Cliques</th>
                    <th>Último Link</th>
                    <th>Cadastrado em</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>
                            <div class="user-info">
                                <img src="${user.picture}" alt="${user.name}" class="user-avatar">
                                <div class="user-details">
                                    <span class="user-name">${user.name}</span>
                                    <span class="user-email">${user.email}</span>
                                </div>
                            </div>
                        </td>
                        <td><strong>${formatNumber(user.total_links)}</strong></td>
                        <td><strong>${formatNumber(user.total_clicks)}</strong></td>
                        <td>${user.last_link_created ? formatDate(user.last_link_created) : 'Nunca'}</td>
                        <td>${formatDate(user.created_at)}</td>
                        <td>
                            <button class="btn-small btn-danger" onclick="deleteUser(${user.id}, '${user.name}')">
                                🗑️ Deletar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Carregar informações do banco
function loadDatabaseInfo() {
    if (!dashboardData) return;

    const container = document.getElementById('database-info');
    const db = dashboardData.database;

    const html = `
        <div class="db-stat">
            <div class="db-stat-label">Banco de Dados</div>
            <div class="db-stat-value">${db.database_name}</div>
        </div>
        <div class="db-stat">
            <div class="db-stat-label">Tamanho Total</div>
            <div class="db-stat-value">${db.size_mb} MB</div>
        </div>
        <div class="db-stat">
            <div class="db-stat-label">Tamanho (Bytes)</div>
            <div class="db-stat-value">${formatNumber(db.size_bytes)}</div>
        </div>
    `;

    container.innerHTML = html;

    // Tabelas
    displayTables(db.tables);
}

// Exibir tabelas
function displayTables(tables) {
    const container = document.getElementById('tables-container');

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Tabela</th>
                    <th>Registros</th>
                    <th>Dados (MB)</th>
                    <th>Índices (MB)</th>
                    <th>Total (MB)</th>
                </tr>
            </thead>
            <tbody>
                ${tables.map(t => `
                    <tr>
                        <td><strong>${t.table_name}</strong></td>
                        <td>${formatNumber(t.table_rows)}</td>
                        <td>${t.data_mb}</td>
                        <td>${t.index_mb}</td>
                        <td><strong>${t.total_mb}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Deletar usuário
async function deleteUser(userId, userName) {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${userName}"?\n\nTodos os links deste usuário também serão deletados.\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const response = await fetch(`/admin/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao deletar usuário');
        }

        showToast('Usuário deletado com sucesso', 'success');
        loadUsers();
        loadDashboard();
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message, 'error');
    }
}

// Limpar links expirados
async function cleanExpiredLinks() {
    if (!confirm('Tem certeza que deseja remover todos os links expirados?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch('/admin/api/maintenance/clean-expired', {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Erro ao limpar links');

        const data = await response.json();
        showToast(data.message, 'success');
        loadDashboard();
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao limpar links expirados', 'error');
    }
}

// Atualizar dados
function refreshData() {
    loadDashboard();
    showToast('Dados atualizados', 'success');
}

// Utilitários
function formatNumber(num) {
    return num.toLocaleString('pt-BR');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
