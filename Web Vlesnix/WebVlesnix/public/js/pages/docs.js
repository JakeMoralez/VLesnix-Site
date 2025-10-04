
import { helpData, categoryIcons } from '../data/docs-data.js';

function generateDocsContent() {
    const commandListContainer = document.getElementById('docs-command-list');
    if (!commandListContainer) return;

    const sidebarList = document.createElement('ul');
    document.getElementById('docs-sidebar').appendChild(sidebarList);

    for (const categoryName in helpData) {
        const category = helpData[categoryName];
        const categoryId = `category-${category.key}`;

        const listItem = document.createElement('li');
        listItem.innerHTML = `<a href="#${categoryId}">${categoryIcons[category.key] || ''}<span>${categoryName}</span></a>`;
        sidebarList.appendChild(listItem);

        const section = document.createElement('section');
        section.id = categoryId;
        section.className = 'doc-category-section';

        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = categoryName;
        section.appendChild(sectionTitle);

        for(const commandName in category.commands) {
            const command = category.commands[commandName];
            const card = document.createElement('div');
            card.className = 'doc-command-card';

            let optionsTable = '';
            if(command.options && command.options.length > 0) {
                optionsTable = `
                    <h4>Параметры</h4>
                    <table class="doc-params-table">
                        <thead>
                            <tr>
                                <th>Параметр</th>
                                <th>Описание</th>
                                <th>Обязательный</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${command.options.map(opt => `
                                <tr>
                                    <td><code>${opt.name}</code></td>
                                    <td>${opt.description}</td>
                                    <td>${opt.required ? 'Да' : 'Нет'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            card.innerHTML = `
                <div class="doc-card-header">
                    <h3><code>${commandName}</code></h3>
                    <span class="doc-permission-tag">${command.permissions}</span>
                </div>
                <p class="doc-card-description">${command.details}</p>
                <div class="doc-card-details">
                    ${optionsTable}
                    <h4>Пример использования</h4>
                    <div class="doc-example">
                        <code>${command.example}</code>
                    </div>
                </div>
            `;
            section.appendChild(card);
        }
        commandListContainer.appendChild(section);
    }
}

function setupDocsInteractions() {
    const searchInput = document.getElementById('docs-search-input');
    const commandList = document.getElementById('docs-command-list');
    if (!commandList) return;

    const commandSections = commandList.querySelectorAll('.doc-category-section');
    const cards = commandList.querySelectorAll('.doc-command-card');
    const noResultsMessage = document.getElementById('no-results-message');
    const sidebar = document.getElementById('docs-sidebar');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            let visibleCards = 0;

            cards.forEach(card => {
                const cardText = card.textContent.toLowerCase();
                const isVisible = cardText.includes(query);
                card.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCards++;
            });

            commandSections.forEach(section => {
                const hasVisibleCards = section.querySelector('.doc-command-card:not([style*="display: none"])');
                section.style.display = hasVisibleCards ? '' : 'none';
            });

            noResultsMessage.style.display = visibleCards === 0 ? 'block' : 'none';
        });
    }

    if (sidebar) {
        sidebar.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        const sidebarLinks = sidebar.querySelectorAll('ul li a');
        if (commandSections.length > 0 && sidebarLinks.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    const id = entry.target.getAttribute('id');
                    const activeLink = sidebar.querySelector(`a[href="#${id}"]`);
                    if (entry.isIntersecting) {
                        sidebarLinks.forEach(link => link.classList.remove('active'));
                        if (activeLink) {
                            activeLink.classList.add('active');
                        }
                    }
                });
            }, {
                rootMargin: '-100px 0px -50% 0px',
                threshold: 0
            });

            commandSections.forEach(section => {
                observer.observe(section);
            });
        }
    }
}

export function initDocsPage() {
    generateDocsContent();
    setupDocsInteractions();
}
