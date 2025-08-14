
document.addEventListener('DOMContentLoaded', () => {

    let allServers = [];
    let currentServerData = null; // Store data for the current manage page

    // --- УПРАВЛЕНИЕ UI АВТОРИЗАЦИИ И ВЫПАДАЮЩиМ МЕНЮ ---
    async function updateAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return false;

        try {
            const response = await fetch('/api/user');

            if (response.ok) {
                const user = await response.json();
                const isManagePage = document.body.classList.contains('manage-page');

                let dropdownLinks = `
                    <a href="https://discord.gg/pzD2w4x5Hk" target="_blank" class="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span>Сервер поддержки</span>
                        <svg class="external-link-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                `;

                const panelLink = isManagePage
                    ? `<a href="/dashboard.html" class="dropdown-item">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                           <span>Выбор сервера</span>
                       </a>`
                    : `<a href="/dashboard.html" class="dropdown-item">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                           <span>Панель управления</span>
                       </a>`;

                dropdownLinks = panelLink + dropdownLinks;


                authContainer.innerHTML = `
                    <div class="profile-dropdown-container">
                        <button class="profile-avatar-btn" id="avatar-button" aria-label="Открыть меню профиля">
                            <img src="${user.avatar}" alt="Ваш аватар" class="profile-avatar-small">
                        </button>
                        <div class="profile-dropdown" id="profile-dropdown">
                             <div class="dropdown-user-info">
                                <img src="${user.avatar}" alt="Аватар" class="dropdown-user-avatar">
                                <span class="dropdown-user-name">${user.username}</span>
                            </div>
                            <div class="dropdown-links">
                                ${dropdownLinks}
                            </div>
                            <a href="/logout" class="dropdown-logout">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                <span>Выйти</span>
                            </a>
                        </div>
                    </div>
                `;
                setupDropdown();
                return true;

            } else {
                authContainer.innerHTML = '<a href="/login" class="cta-login-button">Войти</a>';
                return false;
            }
        } catch (error) {
            authContainer.innerHTML = '<a href="/login" class="cta-login-button">Войти</a>';
            console.warn("Сервер не доступен. Отображается стандартная кнопка входа.");
            return false;
        }
    }

    function setupDropdown() {
        const avatarButton = document.getElementById('avatar-button');
        const dropdown = document.getElementById('profile-dropdown');
        if (avatarButton && dropdown) {
            avatarButton.addEventListener('click', (event) => {
                event.stopPropagation();
                dropdown.classList.toggle('active');
            });
            document.addEventListener('click', (event) => {
                if (dropdown.classList.contains('active') && !dropdown.contains(event.target) && !avatarButton.contains(event.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    }

    // ======================================================= //
    // ==         DASHBOARD (ВЫБОР СЕРВЕРА)                 == //
    // ======================================================= //

    function renderServers(servers) {
        const grid = document.getElementById('servers-grid');
        if (!grid) return;

        grid.innerHTML = ''; // Clear loader
        if (servers.length === 0) {
             const searchInput = document.getElementById('server-search-input');
             const isSearching = searchInput && searchInput.value.length > 0;
             grid.innerHTML = `<div class="loader-container"><p class="loader">${isSearching ? 'Сервер не найден.' : 'Нет доступных серверов.'}</p></div>`;
             return;
        }

        servers.forEach(server => {
            const card = document.createElement('a');
            card.className = `server-card ${server.isManaged ? 'is-managed' : 'is-available'}`;
            const actionText = server.isManaged ? 'Управлять' : 'Пригласить';
            const actionIcon = server.isManaged
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

            if (server.isManaged) {
                card.href = `/manage.html?id=${server.id}`;
            } else {
                card.href = `https://discord.com/oauth2/authorize?client_id=${'1336778419199021118'}&permissions=8&scope=bot&guild_id=${server.id}`;
                card.target = '_blank';
            }
            card.innerHTML = `
                <div class="server-card-content">
                    <img src="${server.icon}" alt="Иконка сервера ${server.name}" class="server-card-avatar">
                    <h3 class="server-card-name">${server.name}</h3>
                </div>
                <div class="server-card-action">
                    <span>${actionText}</span>
                    ${actionIcon}
                </div>`;
            grid.appendChild(card);
        });
    }

    function setupServerSearch() {
        const searchInput = document.getElementById('server-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filteredServers = allServers.filter(server => server.name.toLowerCase().includes(query));
            renderServers(filteredServers);
        });
    }

    async function loadDashboard() {
        if (!document.body.classList.contains('dashboard-page')) return;

        const preloader = document.getElementById('dashboard-preloader');
        const mainContent = document.querySelector('.dashboard-main');

        try {
            const response = await fetch('/api/servers');
            if (!response.ok) throw new Error('Не удалось получить данные с сервера.');

            const { managed, available } = await response.json();

            allServers = [
                ...managed.map(s => ({ ...s, isManaged: true })),
                ...available.map(s => ({ ...s, isManaged: false }))
            ];

            // Sort servers: managed first, then by name
            allServers.sort((a, b) => {
                if (a.isManaged !== b.isManaged) {
                    return a.isManaged ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            renderServers(allServers);
            setupServerSearch();

        } catch (error) {
            console.error(error);
            const grid = document.getElementById('servers-grid');
            if (grid) grid.innerHTML = `<div class="loader-container"><p class="loader">Ошибка загрузки серверов. Попробуйте обновить страницу.</p></div>`;
        } finally {
            if (preloader && mainContent) {
                preloader.classList.add('hidden');
                mainContent.classList.add('visible');
            }
        }
    }

    // ========================================================= //
    // ==         MANAGE PAGE (УПРАВЛЕНИЕ СЕРВЕРОМ)           == //
    // ========================================================= //

    const moduleInfo = {
        welcome: {
            name: 'Приветствия',
            description: 'Автоматически приветствует новых участников на сервере.',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`
        },
        moderation: {
            name: 'Модерация',
            description: 'Набор инструментов для автоматической модерации чата.',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
        },
        logging: {
            name: 'Логирование',
            description: 'Записывает все важные действия на сервере в специальный канал.',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
        },
        autorole: {
            name: 'Авто-роль',
            description: 'Автоматически выдает роль новым участникам сервера.',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>`
        }
    };

    // --- Render Functions for Manage Page Views ---

    function renderOverviewView(serverData) {
        return `
            <div class="view-header">
                <h2>Обзор</h2>
                <p>Ключевая информация и статистика вашего сервера "${serverData.name}".</p>
            </div>
            <div class="overview-grid">
                <div class="stat-card">
                    <div class="stat-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    <div class="stat-card-info">
                        <span class="stat-card-value">${serverData.members.toLocaleString('ru-RU')}</span>
                        <span class="stat-card-label">Всего участников</span>
                    </div>
                </div>
                 <div class="stat-card">
                    <div class="stat-card-icon online"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 14 1.45-2.9A2 2 0 0 1 11.24 10h1.52a2 2 0 0 1 1.79 1.1L16 14" /><path d="M8.5 17.5h7" /></svg></div>
                    <div class="stat-card-info">
                        <span class="stat-card-value">${serverData.onlineCount.toLocaleString('ru-RU')}</span>
                        <span class="stat-card-label">Участников онлайн</span>
                    </div>
                </div>
                 <div class="stat-card">
                    <div class="stat-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
                    <div class="stat-card-info">
                        <span class="stat-card-value">${Object.values(serverData.config.modules).filter(m => m.enabled).length} / ${Object.keys(moduleInfo).length}</span>
                        <span class="stat-card-label">Активных модулей</span>
                    </div>
                </div>
            </div>
            `;
    }

    function renderModulesView(serverData) {
        const createChannelOptions = (channels, selectedId) =>
            channels.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}># ${c.name}</option>`).join('');

        const createRoleOptions = (roles, selectedId) =>
            roles.map(r => `<option value="${r.id}" ${r.id === selectedId ? 'selected' : ''}>@ ${r.name}</option>`).join('');

        const modulePanels = Object.keys(moduleInfo).map(key => {
            const info = moduleInfo[key];
            const moduleConfig = serverData.config.modules[key];
            if (!moduleConfig) return '';

            let settingsHtml = '';
            switch(key) {
                case 'welcome':
                    settingsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label for="welcome-channel">Канал для приветствий</label>
                                <select name="channel" id="welcome-channel">${createChannelOptions(serverData.channels, moduleConfig.channel)}</select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="welcome-message">Сообщение</label>
                            <textarea name="message" id="welcome-message" rows="4">${moduleConfig.message}</textarea>
                            <small>Используйте <code>{user}</code> для упоминания и <code>{server}</code> для названия сервера.</small>
                        </div>
                        <div class="live-preview-container">
                             <h4>Предпросмотр:</h4>
                             <div class="discord-chat-preview">
                                 <div class="discord-message">
                                    <img src="logo.png" alt="Bot Avatar" class="discord-avatar">
                                    <div class="discord-message-content">
                                        <div class="discord-username">
                                            Vlesnix Guard
                                            <span class="discord-bot-tag">БОТ</span>
                                        </div>
                                        <div class="discord-text" id="welcome-preview-text">
                                            <!-- JS will update this -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    break;
                case 'moderation':
                    settingsHtml = `<div class="form-group">
                        <label for="mod-log-channel">Канал для логов модерации</label>
                        <select name="logChannel" id="mod-log-channel">${createChannelOptions(serverData.channels, moduleConfig.logChannel)}</select>
                    </div>`;
                    break;
                case 'logging':
                    settingsHtml = `<div class="form-group">
                        <label for="log-event-channel">Канал для логов событий</label>
                        <select name="eventLogChannel" id="log-event-channel">${createChannelOptions(serverData.channels, moduleConfig.eventLogChannel)}</select>
                    </div>`;
                    break;
                case 'autorole':
                    settingsHtml = `<div class="form-group">
                        <label for="autorole-role">Роль для новых участников</label>
                        <select name="roleId" id="autorole-role">${createRoleOptions(serverData.roles, moduleConfig.roleId)}</select>
                    </div>`;
                    break;
                default:
                    settingsHtml = `<p>Для этого модуля нет дополнительных настроек.</p>`;
            }

            return `
            <div class="module ${moduleConfig.enabled ? 'is-enabled' : ''}" data-module-id="${key}">
                <div class="module-header">
                    <div class="module-title">
                        ${info.icon}
                        <h3>${info.name}</h3>
                    </div>
                    <div class="module-controls">
                        <label class="toggle-switch" aria-label="Включить/выключить модуль">
                            <input type="checkbox" class="master-toggle" ${moduleConfig.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <button class="expand-btn" aria-label="Развернуть/свернуть настройки">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </div>
                <div class="module-body">
                    <p class="module-description">${info.description}</p>
                    <form class="module-settings-form">${settingsHtml}</form>
                    <div class="module-footer">
                        <button class="cta-button save-module-btn">Сохранить</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        return `
            <div class="view-header">
                <h2>Модули</h2>
                <p>Включайте, отключайте и настраивайте функции бота для вашего сервера.</p>
            </div>
            <div class="module-accordion">${modulePanels}</div>`;
    }

    function renderLogsView(serverData) {
        let logHtml = '';
        // Create 5 skeleton entries
        for (let i = 0; i < 5; i++) {
             logHtml += `
             <div class="log-entry skeleton">
                <span class="skeleton-item" style="width: 100px; height: 16px;"></span>
                <span class="skeleton-item" style="width: 220px; height: 16px;"></span>
                <span class="skeleton-item" style="width: 130px; height: 16px;"></span>
                <span class="skeleton-item" style="width: 80px; height: 16px; margin-left: auto;"></span>
             </div>`;
        }

        return `
            <div class="view-header">
                <h2>Журнал аудита</h2>
                <p>Последние действия, выполненные ботом и администраторами. (Это демонстрация)</p>
            </div>
            <div class="audit-log-view">${logHtml}</div>
        `;
    }

    function renderStatsView(serverData) {
         return `
            <div class="view-header">
                <h2>Статистика</h2>
                <p>Аналитика активности на вашем сервере. (Это демонстрация)</p>
            </div>
            <div class="stats-grid">
                <div class="chart-panel">
                    <h3>Новые участники (за месяц)</h3>
                    <div class="chart-placeholder bar-chart has-demo-overlay">
                        <div class="demo-overlay"><span>Демонстрационные данные</span></div>
                        <div class="bar" style="height: 60%;"></div>
                        <div class="bar" style="height: 80%;"></div>
                        <div class="bar" style="height: 40%;"></div>
                        <div class="bar" style="height: 90%;"></div>
                        <div class="bar" style="height: 75%;"></div>
                    </div>
                </div>
                <div class="chart-panel">
                    <h3>Активность по ролям</h3>
                    <div class="chart-placeholder donut-chart has-demo-overlay">
                        <div class="demo-overlay"><span>Демонстрационные данные</span></div>
                    </div>
                </div>
            </div>`;
    }

    function updateWelcomePreview(message, serverName, userName = '@НовыйУчастник') {
        const previewText = document.getElementById('welcome-preview-text');
        if (previewText) {
            let processedMessage = message.replace(/{user}/g, `<span class="discord-mention">${userName}</span>`);
            processedMessage = processedMessage.replace(/{server}/g, `<strong>${serverName}</strong>`);
            previewText.innerHTML = processedMessage;
        }
    }

    // --- Logic for switching views and handling events ---

    function switchView(viewName, serverData) {
        const mainContent = document.getElementById('manage-main-content');
        if (!mainContent) return;

        let contentHtml = '';
        switch(viewName) {
            case 'overview': contentHtml = renderOverviewView(serverData); break;
            case 'modules': contentHtml = renderModulesView(serverData); break;
            case 'logs': contentHtml = renderLogsView(serverData); break;
            case 'stats': contentHtml = renderStatsView(serverData); break;
            default: contentHtml = `<p>Раздел в разработке.</p>`;
        }
        mainContent.innerHTML = contentHtml;

        // Post-render logic, e.g., for live previews
        if (viewName === 'modules') {
            const welcomeMessageInput = document.getElementById('welcome-message');
            if (welcomeMessageInput) {
                const initialMessage = serverData.config.modules.welcome.message;
                updateWelcomePreview(initialMessage, serverData.name);

                welcomeMessageInput.addEventListener('input', (e) => {
                    updateWelcomePreview(e.target.value, serverData.name);
                });
            }
        }
    }

    async function saveSetting(serverId, moduleKey, settings) {
        console.log(`Saving settings for ${moduleKey}:`, settings);
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, module: moduleKey, settings })
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Ошибка сохранения');
            }

            const result = await response.json();
            // Update local state to keep UI consistent
            Object.assign(currentServerData.config.modules[moduleKey], settings);
            showToast(result.message || 'Настройки сохранены!', 'success');

        } catch (error) {
            showToast(error.message, 'error');
            // Consider reverting UI on failure in a real app
        }
    }

    function setupManagePageEventListeners(serverData) {
        const mainContent = document.getElementById('manage-main-content');
        if (!mainContent) return;

        mainContent.addEventListener('click', (e) => {
            const moduleEl = e.target.closest('.module');
            if (!moduleEl) return;
            const moduleId = moduleEl.dataset.moduleId;

            // Handle accordion expansion
            if (e.target.closest('.expand-btn') || e.target.closest('.module-header')) {
                if (!moduleEl.classList.contains('is-enabled')) {
                    showToast('Сначала включите модуль, чтобы его настроить.', 'info');
                    return;
                }
                moduleEl.classList.toggle('is-expanded');
            }

            // Handle save button click
            if (e.target.matches('.save-module-btn')) {
                const form = moduleEl.querySelector('.module-settings-form');
                const settings = {};
                // Collect all form data
                new FormData(form).forEach((value, key) => {
                    settings[key] = value;
                });
                // Enabled state is handled separately by the toggle
                settings.enabled = moduleEl.querySelector('.master-toggle').checked;
                saveSetting(serverData.id, moduleId, settings);
            }
        });

        mainContent.addEventListener('change', (e) => {
             const moduleEl = e.target.closest('.module');
            if (!moduleEl || !e.target.matches('.master-toggle')) return;
            const moduleId = moduleEl.dataset.moduleId;
            const isEnabled = e.target.checked;

            moduleEl.classList.toggle('is-enabled', isEnabled);
            if (!isEnabled) {
                moduleEl.classList.remove('is-expanded');
            }
            // Save only the enabled state
            saveSetting(serverData.id, moduleId, { enabled: isEnabled });
        });
    }

    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    }

    function initializeManageView(serverData) {
        const sidebarNav = document.getElementById('sidebar-nav');
        if (!sidebarNav) return;

        sidebarNav.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('.nav-link');
            if (!link || link.classList.contains('active')) return;

            sidebarNav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const viewName = link.dataset.view;
            switchView(viewName, serverData);
        });

        // Load initial view
        switchView('overview', serverData);
        setupManagePageEventListeners(serverData);
    }

    async function loadManagePage() {
        if (!document.body.classList.contains('manage-page')) return;

        const preloader = document.getElementById('manage-preloader');
        const content = document.getElementById('manage-content');

        try {
            const params = new URLSearchParams(window.location.search);
            const serverId = params.get('id');
            if (!serverId) throw new Error('ID сервера не найден в URL.');

            const response = await fetch(`/api/server?id=${serverId}`);
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Ошибка при получении данных о сервере.');
            }

            const server = await response.json();
            currentServerData = server; // Cache data

            document.title = `${server.name} — Vlesnix Guard`;
            document.getElementById('header-server-icon').src = server.icon;
            document.getElementById('header-server-name').textContent = server.name;

            initializeManageView(server);

        } catch (error) {
            console.error('Ошибка загрузки страницы управления:', error);
            const contentArea = document.getElementById('manage-main-content');
            if (contentArea) {
                contentArea.innerHTML = `<div class="loader-container"><p class="loader">${error.message}</p></div>`;
            }
        } finally {
            if (preloader && content) {
                preloader.classList.add('hidden');
                content.style.visibility = 'visible';
                content.style.opacity = 1;
            }
        }
    }

    function setupMobileNav() {
        const hamburger = document.getElementById('hamburger-menu');
        const sidebar = document.getElementById('manage-sidebar');
        const contentArea = document.querySelector('.manage-content-container');
        const pageWrapper = document.body;

        if (!hamburger || !sidebar) return;

        hamburger.addEventListener('click', () => {
            pageWrapper.classList.toggle('sidebar-open');
        });

        if (contentArea) {
            contentArea.addEventListener('click', () => {
                if (pageWrapper.classList.contains('sidebar-open')) {
                    pageWrapper.classList.remove('sidebar-open');
                }
            });
        }
    }

    function setupManageSidebar() {
        const sidebar = document.getElementById('manage-sidebar');
        const toggleBtn = document.getElementById('sidebar-collapse-btn');
        const body = document.body;

        if (!sidebar || !toggleBtn) return;

        // Restore sidebar state from localStorage
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            body.classList.add('sidebar-collapsed');
        }

        // Handle collapse/expand button click
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
            // Save new state to localStorage
            localStorage.setItem('sidebar_collapsed', body.classList.contains('sidebar-collapsed'));
        });
    }

    // --- GLOBAL INITIALIZATION ---

    function setupParticles(theme) {
        const colors = {
            dark: { particles: '#bf95ff', lines: '#9d50ff' },
            light: { particles: '#2c3e50', lines: '#6c5ce7' }
        };
        const currentColors = colors[theme];
        if (window.pJSDom && window.pJSDom[0]) {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            window.pJSDom = [];
        }

        const isManagePage = document.body.classList.contains('manage-page');

        const particleConfig = {
            "particles": {
                "number": { "value": isManagePage ? 30 : 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": currentColors.particles },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": currentColors.lines, "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": isManagePage ? 2 : 2.5, "direction": "none", "random": true, "straight": false, "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "window",
                "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false }, "resize": true },
                "modes": { "repulse": { "distance": 100, "duration": 0.4 } }
            },
            "retina_detect": true
        };

        particlesJS('particles-bg', particleConfig);
    }

    const themeSwitcher = document.getElementById('theme-switcher');
    function applyTheme(theme, animate, event) {
        const isDark = theme === 'dark';
        if (animate && event && document.startViewTransition) {
            const x = event.clientX;
            const y = event.clientY;
            document.documentElement.style.setProperty('--clip-x', x + 'px');
            document.documentElement.style.setProperty('--clip-y', y + 'px');
            const transition = document.startViewTransition(() => {
                document.body.classList.toggle('dark-theme', isDark);
                document.body.classList.toggle('light-theme', !isDark);
            });
            transition.ready.then(() => {
                localStorage.setItem('theme', theme);
                setupParticles(theme);
            });
        } else {
            document.body.classList.toggle('dark-theme', isDark);
            document.body.classList.toggle('light-theme', !isDark);
            localStorage.setItem('theme', theme);
            setupParticles(theme);
        }
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (event) => {
            if (themeSwitcher.classList.contains('animating')) return;
            themeSwitcher.classList.add('animating');

            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, true, event);

            setTimeout(() => themeSwitcher.classList.remove('animating'), 600);
        });
    }

    function initAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        const immediateRevealTargets = gsap.utils.toArray('.hero-section .reveal, .profile-layout .reveal');
        immediateRevealTargets.forEach((el, i) => {
            gsap.to(el, { opacity: 1, y: 0, visibility: 'visible', duration: 0.8, ease: 'power3.out', delay: 0.2 + (i * 0.1) });
        });

        const scrollRevealTargets = gsap.utils.toArray('.features-section .reveal, .docs-page-container .reveal, .news-page-container .reveal, .team-page-container .reveal');
        scrollRevealTargets.forEach((el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 50, visibility: 'hidden' },
                {
                    opacity: 1, y: 0, visibility: 'visible', duration: 0.8, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
                }
            );
        });
    }

    function setupHeaderScrollBehavior() {
        const header = document.querySelector('header:not(.manage-header)');
        if (!header || document.body.classList.contains('manage-page')) return;

        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            if (currentScrollY > lastScrollY && currentScrollY > header.offsetHeight) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }

            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });
    }

    function setupCookieConsent() {
        const banner = document.getElementById('cookie-consent-banner');
        if (!banner) return;

        const acceptBtn = document.getElementById('cookie-accept-btn');
        const declineBtn = document.getElementById('cookie-decline-btn');
        const consent = localStorage.getItem('cookie_consent');

        if (consent === null) {
            banner.style.display = 'flex';
        }

        if(acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'true');
                banner.style.display = 'none';
            });
        }

        if(declineBtn) {
            declineBtn.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'false');
                banner.style.display = 'none';
            });
        }
    }

    async function initializeApp() {
        const isLoggedIn = await updateAuthUI();
        const isProtectedRoute = window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('manage.html');

        if (isLoggedIn) {
            loadDashboard();
            loadManagePage();
        } else if (isProtectedRoute) {
            window.location.href = '/';
            return;
        }

        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        const initialTheme = savedTheme || systemTheme;
        applyTheme(initialTheme, false);

        initAnimations();
        setupHeaderScrollBehavior();
        setupMobileNav();
        setupManageSidebar();
        setupCookieConsent();
    }

    initializeApp();
});
