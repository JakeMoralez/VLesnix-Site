

let newsData = [];
let activeTag = 'all';
let searchQuery = '';
let isAdmin = false;
let activeEditor = { instance: null, mde: null, id: null };

function renderNewsCards() {
    const newsGrid = document.getElementById('news-grid');
    const noResultsEl = document.getElementById('no-news-results');
    if (!newsGrid || !noResultsEl) return;

    closeActiveEditor();

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
        
        // --- KEY FIX FOR MARKDOWN RENDERING ---
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
                <div class="editor-container"></div>
            </div>
        `;
    }).join('');

    newsGrid.innerHTML = cardsHtml;
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
    const newsContainer = document.querySelector('.news-page-container');
    if (newsContainer) {
        newsContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const cancelBtn = e.target.closest('.cancel-edit-btn');

            if (editBtn) {
                openEditor('edit', editBtn.dataset.id);
            } else if (deleteBtn) {
                handleDelete(deleteBtn.dataset.id);
            } else if (cancelBtn) {
                closeActiveEditor();
            }
        });

        newsContainer.addEventListener('submit', (e) => {
            if (e.target.matches('.news-editor-form')) {
                handleFormSubmit(e);
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
    closeActiveEditor();
    if (typeof EasyMDE === 'undefined') {
        alert('Редактор не загружен. Пожалуйста, обновите страницу.');
        return;
    }

    const template = document.getElementById('news-editor-template');
    const editorNode = template.content.cloneNode(true).firstElementChild;

    const form = editorNode.querySelector('form');
    const titleInput = editorNode.querySelector('#news-title-editor');
    const dateInput = editorNode.querySelector('#news-date-editor');
    const contentTextarea = editorNode.querySelector('#news-content-editor');
    const submitBtn = editorNode.querySelector('button[type="submit"]');

    form.dataset.mode = mode;
    form.dataset.id = newsId || '';
    let initialContent = '';

    let targetContainer;

    if (mode === 'edit') {
        const post = newsData.find(p => p.id === newsId);
        if (!post) return;
        
        targetContainer = document.querySelector(`.news-card[data-news-id="${newsId}"] .editor-container`);
        if (!targetContainer) return;
        
        submitBtn.textContent = 'Сохранить';
        titleInput.value = post.title;
        const date = new Date(post.timestamp);
        const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.value = localDateTime;
        form.querySelectorAll('input[name="tags"]').forEach(cb => {
            cb.checked = post.tags.some(tag => tag.type === cb.value);
        });
        initialContent = post.content;
    } else { // create mode
        targetContainer = document.getElementById('editor-container-placeholder');
        if (!targetContainer) return;

        submitBtn.textContent = 'Опубликовать';
        const now = new Date();
        const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.value = localDateTime;
    }
    
    targetContainer.appendChild(editorNode);
    
    const mde = new EasyMDE({
        element: contentTextarea,
        initialValue: initialContent,
        spellChecker: false,
        maxHeight: "300px",
        minHeight: "200px",
        status: false,
        toolbar: [
            'bold', 'italic', 'strikethrough', '|',
            'heading-1', 'heading-2', 'heading-3', '|',
            'quote', 'unordered-list', 'ordered-list', '|',
            'link', 'image', 'code', 'table', '|',
            'preview', 'side-by-side', 'fullscreen'
        ],
    });

    activeEditor = { instance: editorNode, mde: mde, id: newsId };

    // Animate opening
    gsap.set(editorNode, { height: 'auto', opacity: 1 });
    gsap.from(editorNode, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.out' });
}


function closeActiveEditor() {
    if (activeEditor.instance) {
        gsap.to(activeEditor.instance, {
            height: 0,
            opacity: 0,
            duration: 0.4,
            ease: 'power3.in',
            onComplete: () => {
                if (activeEditor.mde) {
                    activeEditor.mde.toTextArea();
                }
                activeEditor.instance.remove();
                activeEditor = { instance: null, mde: null, id: null };
            }
        });
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const errorEl = form.querySelector('.form-error-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    errorEl.textContent = '';
    submitBtn.textContent = 'Сохранение...';
    submitBtn.disabled = true;

    try {
        const selectedTags = Array.from(form.querySelectorAll('input[name="tags"]:checked'))
            .map(cb => ({ type: cb.value, text: cb.dataset.text }));

        if (selectedTags.length === 0) throw new Error('Выберите хотя бы один тег.');
        
        const title = form.querySelector('#news-title-editor').value;
        if (!title.trim()) throw new Error('Заголовок не может быть пустым.');

        const content = activeEditor.mde.value();
        if (!content.trim()) throw new Error('Содержание не может быть пустым.');
        
        const mode = form.dataset.mode;
        const newsId = form.dataset.id;
        const publicationDate = new Date(form.querySelector('#news-date-editor').value);

        const body = {
            title,
            markdownContent: content,
            tags: selectedTags,
            customDate: publicationDate.toISOString(),
        };

        const url = mode === 'edit' ? `/api/news/${newsId}` : '/api/news';
        const method = mode === 'edit' ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ошибка сервера');
        
        closeActiveEditor();
        await fetchAndRenderNews();

    } catch (err) {
        errorEl.textContent = "Ошибка: " + err.message;
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

async function handleDelete(newsId) {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;
    try {
        const response = await fetch(`/api/news/${newsId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ошибка сервера');
        await fetchAndRenderNews();
    } catch (error) {
        alert(`Не удалось удалить новость: ${error.message}`);
    }
}

async function checkAdminAndSetupUI() {
    try {
        const response = await fetch('/api/is-admin');
        isAdmin = response.ok && (await response.json()).isAdmin;

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
                renderNewsCards(); // Re-render to show admin buttons
            }
        }
    } catch (error) {
        console.error('Failed to check admin status:', error);
        isAdmin = false;
    }
}

export async function initNewsPage() {
    if (window.marked) {
        window.marked.setOptions({ breaks: true, gfm: true });
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