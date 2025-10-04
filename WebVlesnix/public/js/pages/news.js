
let newsData = [];
let activeTag = 'all';
let searchQuery = '';
let isAdmin = false;
let currentEditor = { element: null, instance: null };

function renderNewsCards() {
    const newsGrid = document.getElementById('news-grid');
    const noResultsEl = document.getElementById('no-news-results');
    if (!newsGrid || !noResultsEl) return;

    if (currentEditor.element) {
        closeEditor(currentEditor.element);
    }

    let filteredNews = newsData;
    if (activeTag !== 'all') {
        filteredNews = newsData.filter(item => item.tags.some(tag => tag.type === activeTag));
    }

    const query = searchQuery.toLowerCase().trim();
    if (query) {
        filteredNews = filteredNews.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(query);
            const contentMatch = item.content.toLowerCase().includes(query);
            const tagMatch = item.tags.some(tag => tag.text.toLowerCase().includes(query));
            return titleMatch || contentMatch || tagMatch;
        });
    }

    newsGrid.innerHTML = '';

    if (filteredNews.length === 0) {
        noResultsEl.style.display = 'block';
        newsGrid.style.display = 'none';
        return;
    }

    noResultsEl.style.display = 'none';
    newsGrid.style.display = 'grid';

    const cardsHtml = filteredNews.map(item => {
        const tagsHtml = item.tags.map(tag => `<span class="tag tag-${tag.type}">${tag.text}</span>`).join('');
        const adminActionsHtml = isAdmin ? `
            <div class="news-card-admin-actions">
                <button class="admin-action-btn edit-btn" data-id="${item.id}" aria-label="Редактировать">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="admin-action-btn delete-btn" data-id="${item.id}" aria-label="Удалить">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        ` : '';

        const renderedContent = window.marked ? window.marked.parse(item.content || '') : item.content;

        return `
            <div class="news-card" data-news-id="${item.id}">
                <div class="news-card-header">
                    <span class="news-card-date">${item.date}</span>
                    <div class="news-card-tags">${tagsHtml}</div>
                </div>
                <div class="news-card-body">
                    ${adminActionsHtml}
                    <h3>${item.title}</h3>
                    <div class="news-content-rendered">${renderedContent}</div>
                </div>
            </div>
        `;
    }).join('');

    newsGrid.innerHTML = cardsHtml;
    if (typeof gsap !== 'undefined') {
        gsap.from(newsGrid.querySelectorAll('.news-card'), {
            opacity: 0, y: 30, duration: 0.5, stagger: 0.1, ease: 'power3.out'
        });
    }
}

function setupNewsFilters() {
    const tagsContainer = document.getElementById('filter-tags-container');
    const searchInput = document.getElementById('news-search-input');
    if (!tagsContainer || !searchInput) return;

    tagsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.filter-tag-button')) {
            tagsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            activeTag = e.target.dataset.tag;
            renderNewsCards();
        }
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderNewsCards();
    });
}

function setupEventListeners() {
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            if (editBtn) {
                openEditor('edit', editBtn.dataset.id);
            } else if (deleteBtn) {
                handleDelete(deleteBtn.dataset.id);
            }
        });
    }
}

async function fetchAndRenderNews() {
    const newsGrid = document.getElementById('news-grid');
    try {
        const response = await fetch('/api/news');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        newsData = await response.json();
        renderNewsCards();
    } catch (error) {
        console.error("Failed to load news from server:", error);
        if (newsGrid) newsGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Не удалось загрузить новости.</p>';
    }
}

function openEditor(mode, newsId = null) {
    if (currentEditor.element) {
        closeEditor(currentEditor.element);
    }
    document.body.classList.add('cursor-disabled-override');

    const template = document.getElementById('news-editor-template');
    if (!template) return;
    const editorElement = template.content.firstElementChild.cloneNode(true);

    const form = editorElement.querySelector('form');
    const submitBtn = editorElement.querySelector('button[type="submit"]');
    const cancelBtn = editorElement.querySelector('.cancel-news-btn');
    const titleInput = editorElement.querySelector('#news-title');
    const dateInput = editorElement.querySelector('#news-date');
    const contentTextarea = editorElement.querySelector('#news-content');

    form.dataset.mode = mode;
    form.dataset.id = newsId || '';

    const mdeInstance = new EasyMDE({
        element: contentTextarea,
        spellChecker: false,
        maxHeight: "300px",
        minHeight: "200px",
        status: ["lines", "words"],
        toolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', '|', 'preview'],
    });

    if (mode === 'edit') {
        submitBtn.textContent = 'Сохранить изменения';
        const post = newsData.find(p => p.id === newsId);
        if (post) {
            titleInput.value = post.title;
            const date = new Date(post.timestamp);
            const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            dateInput.value = localDateTime;

            form.querySelectorAll('input[name="tags"]').forEach(cb => {
                cb.checked = post.tags.some(tag => tag.type === cb.value);
            });
            mdeInstance.value(post.content);
        }
    } else {
        submitBtn.textContent = 'Опубликовать';
        const now = new Date();
        const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.value = localDateTime;
    }

    cancelBtn.addEventListener('click', () => closeEditor(editorElement));
    form.addEventListener('submit', handleFormSubmit);

    if (mode === 'create') {
        const newsGrid = document.getElementById('news-grid');
        const noResultsEl = document.getElementById('no-news-results');
        newsGrid.style.display = 'grid';
        if (noResultsEl) noResultsEl.style.display = 'none';
        newsGrid.prepend(editorElement);
    } else {
        const cardToEdit = document.querySelector(`.news-card[data-news-id="${newsId}"]`);
        if (cardToEdit) {
            cardToEdit.style.display = 'none';
            cardToEdit.after(editorElement);
            editorElement.dataset.originalCardId = newsId;
        }
    }

    gsap.from(editorElement, {
        height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, duration: 0.5, ease: 'power3.out'
    });

    currentEditor = { element: editorElement, instance: mdeInstance };
}

function closeEditor(editorElement) {
    if (!editorElement) return;

    const form = editorElement.querySelector('form');
    const mode = form?.dataset.mode;

    gsap.to(editorElement, {
        height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, duration: 0.4, ease: 'power3.in',
        onComplete: () => {
            document.body.classList.remove('cursor-disabled-override');
            const originalCardId = editorElement.dataset.originalCardId;
            if (originalCardId) {
                const originalCard = document.querySelector(`.news-card[data-news-id="${originalCardId}"]`);
                if (originalCard) {
                    originalCard.style.display = '';
                }
            }
            const mde = EasyMDE.find(editorElement.querySelector('textarea'));
            if(mde) mde.toTextArea();

            editorElement.remove();
            if (currentEditor.element === editorElement) {
                currentEditor = { element: null, instance: null };
            }

            if (mode === 'create' && newsData.length === 0) {
                const newsGrid = document.getElementById('news-grid');
                const noResultsEl = document.getElementById('no-news-results');
                if (newsGrid) newsGrid.style.display = 'none';
                if (noResultsEl) noResultsEl.style.display = 'block';
            }
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editorElement = form.closest('.news-editor-card');
    const errorEl = editorElement.querySelector('#form-error');
    const submitBtn = editorElement.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    errorEl.textContent = '';
    submitBtn.textContent = 'Сохранение...';
    submitBtn.disabled = true;

    const selectedTags = Array.from(form.querySelectorAll('input[name="tags"]:checked'))
        .map(cb => ({ type: cb.value, text: cb.dataset.text }));

    if (selectedTags.length === 0) {
        errorEl.textContent = 'Выберите хотя бы один тег.';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        return;
    }
    const title = editorElement.querySelector('#news-title').value;
    if (!title.trim()) {
        errorEl.textContent = 'Заголовок не может быть пустым.';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        return;
    }
    const content = currentEditor.instance.value();
    if (!content.trim()) {
        errorEl.textContent = 'Содержание не может быть пустым.';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        return;
    }
    
    const mode = form.dataset.mode;
    const newsId = form.dataset.id;
    const publicationDate = new Date(editorElement.querySelector('#news-date').value);

    const body = {
        title,
        markdownContent: content,
        tags: selectedTags,
        customDate: publicationDate.toISOString(),
    };

    const url = mode === 'edit' ? `/api/news/${newsId}` : '/api/news';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }
        await fetchAndRenderNews();
    } catch (err) {
        errorEl.textContent = "Ошибка сохранения: " + err.message;
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

async function handleDelete(newsId) {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;
    try {
        const response = await fetch(`/api/news/${newsId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }
        await fetchAndRenderNews();
    } catch (error) {
        alert(`Не удалось удалить новость: ${error.message}`);
    }
}

async function checkAdminAndSetupUI() {
    try {
        const response = await fetch('/api/is-admin');
        if (response.ok) {
            const data = await response.json();
            isAdmin = data.isAdmin;
        } else {
            isAdmin = false;
        }

        if (isAdmin) {
            const container = document.getElementById('add-news-container');
            if (container && !document.getElementById('add-news-btn')) {
                const addButton = document.createElement('button');
                addButton.id = 'add-news-btn';
                addButton.className = 'cta-button';
                addButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Добавить новость`;
                container.appendChild(addButton);
                addButton.addEventListener('click', () => openEditor('create'));
            }
            if(newsData.length > 0) {
                renderNewsCards();
            }
        }
    } catch (error) {
        console.error('Failed to check admin status:', error);
        isAdmin = false;
    }
}

export async function initNewsPage() {
    if (window.marked) {
        window.marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    const allTagsButton = `<button class="filter-tag-button active" data-tag="all">Все</button>`;
    const otherTags = { 'major': 'Главное', 'feature': 'Функции', 'security': 'Безопасность', 'fix': 'Исправления', 'update': 'Улучшения'};
    const otherTagsButtons = Object.entries(otherTags)
        .map(([type, name]) => `<button class="filter-tag-button" data-tag="${type}">${name}</button>`)
        .join('');

    const tagsContainer = document.getElementById('filter-tags-container');
    if(tagsContainer) tagsContainer.innerHTML = allTagsButton + otherTagsButtons;

    setupNewsFilters();
    await fetchAndRenderNews();
    await checkAdminAndSetupUI();
    setupEventListeners();
}
