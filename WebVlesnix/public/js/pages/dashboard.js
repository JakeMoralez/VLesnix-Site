import { translations } from '../data/translations.js';

let allServers = [];
let currentDashboardTab = 'managed';

function renderServers(filter) {
    const grid = document.getElementById('servers-grid');
    const emptyStateContainer = document.getElementById('empty-state');
    if (!grid || !emptyStateContainer) return;

    const lang = localStorage.getItem('language') || 'ru';
    const searchInput = document.getElementById('server-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const serversToRender = allServers.filter(server => {
        const matchesFilter = (filter === 'managed' && server.isManaged) || (filter === 'available' && !server.isManaged);
        const matchesSearch = server.name.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    grid.innerHTML = '';
    emptyStateContainer.style.display = 'none';

    if (serversToRender.length === 0) {
        emptyStateContainer.style.display = 'block';
        let icon, titleKey, textKey;
        if (query) { // If searching
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
            titleKey = 'dash_no_servers_found';
            textKey = ''; // No extra text needed for search
        } else if (filter === 'managed') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
            titleKey = 'dash_empty_managed_title';
            textKey = 'dash_empty_managed_text';
        } else { // available
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
            titleKey = 'dash_empty_available_title';
            textKey = 'dash_empty_available_text';
        }
        emptyStateContainer.innerHTML = `
            <div class="empty-state-icon">${icon}</div>
            <h3>${translations[lang][titleKey]}</h3>
            ${textKey ? `<p>${translations[lang][textKey]}</p>` : ''}
        `;
        return;
    }

    serversToRender.forEach(server => {
        const card = document.createElement('a');
        card.className = `server-card ${server.isManaged ? 'is-managed' : 'is-available'}`;
        const actionText = server.isManaged ? translations[lang]['dash_action_manage'] : translations[lang]['dash_action_invite'];
        const actionIcon = server.isManaged
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

        const iconUrl = server.icon
            ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.webp?size=64`
            : `https://cdn.discordapp.com/embed/avatars/${(BigInt(server.id) >> 22n) % 5n}.png`;
            
        const memberCountHtml = server.isManaged && server.memberCount ? `
            <div class="server-card-stats">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>${server.memberCount.toLocaleString('ru-RU')}</span>
            </div>
        ` : '';

        if (server.isManaged) {
            card.href = `/manage`; // Should be /manage?id=${server.id} in a real app
        } else {
            card.href = `https://discord.com/oauth2/authorize?client_id=${'1336778419199021118'}&permissions=8&scope=bot&guild_id=${server.id}`;
            card.target = '_blank';
        }
        card.innerHTML = `
            <div class="server-card-content">
                <img src="${iconUrl}" alt="${translations[lang]['dash_server_icon_alt']} ${server.name}" class="server-card-avatar">
                <div class="server-card-info">
                    <h3 class="server-card-name">${server.name}</h3>
                    ${memberCountHtml}
                </div>
            </div>
            <div class="server-card-action">
                <span>${actionText}</span>
                ${actionIcon}
            </div>`;
        grid.appendChild(card);
    });
}

function setupDashboardTabs() {
    const tabsContainer = document.querySelector('.tabs-container');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            tabsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            currentDashboardTab = e.target.dataset.tab;
            renderServers(currentDashboardTab);
        }
    });
}

function setupServerSearch() {
    const searchInput = document.getElementById('server-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        renderServers(currentDashboardTab);
    });
}

export async function initDashboardPage(user) {
    const preloader = document.getElementById('dashboard-preloader');
    const mainContent = document.querySelector('.dashboard-main');
    const dashboardHeader = document.getElementById('dashboard-header');
    const lang = localStorage.getItem('language') || 'ru';

    if (user && dashboardHeader) {
        dashboardHeader.innerHTML = `
            <h1 class="section-title">
                <span data-translate-key="dash_welcome">${translations[lang]['dash_welcome']}</span> ${user.username}!
            </h1>
            <p class="section-subtitle" data-translate-key="dash_subtitle">${translations[lang]['dash_subtitle']}</p>
        `;
    }

    try {
        const response = await fetch('/api/servers');
        if (!response.ok) throw new Error('Failed to fetch server data.');

        const { managed, available } = await response.json();
        allServers = [
            ...managed.map(s => ({ ...s, isManaged: true })),
            ...available.map(s => ({ ...s, isManaged: false }))
        ];
        allServers.sort((a, b) => a.name.localeCompare(b.name));

        setupDashboardTabs();
        setupServerSearch();
        renderServers(currentDashboardTab);

    } catch (error) {
        console.error(error);
        const grid = document.getElementById('servers-grid');
        if (grid) grid.innerHTML = `<div class="loader-container"><p class="loader">Ошибка загрузки серверов. Попробуйте обновить страницу.</p></div>`;
    } finally {
        if (preloader && mainContent) {
            preloader.classList.add('hidden');
            mainContent.classList.add('visible');
            setTimeout(() => {
                if (preloader) preloader.remove();
            }, 500);
        }
    }
}