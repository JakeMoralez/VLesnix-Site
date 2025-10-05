


let docsData = [];
let isAdmin = false;
let editorModal = { element: null, instance: null, mde: null };

async function fetchDocs() {
    try {
        const response = await fetch('/api/docs');
        if (!response.ok) throw new Error('Failed to fetch docs');
        docsData = await response.json();
        return true;
    } catch (error) {
        console.error(error);
        const navContainer = document.getElementById('docs-nav-container');
        if (navContainer) navContainer.innerHTML = '<p style="padding: 1rem;">Ошибка загрузки документации.</p>';
        return false;
    }
}

function findDocById(tree, id) {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children && node.children.length > 0) {
            const found = findDocById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function renderSidebar(nodes, container, isSublevel = false) {
    const treeElement = document.createElement('ul');
    treeElement.className = 'docs-nav-tree';
    if (!isSublevel) treeElement.id = 'docs-nav-tree-root';

    nodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const li = document.createElement('li');
        li.className = 'docs-nav-item';
        li.dataset.id = node.id;
        li.dataset.slug = node.slug;

        li.innerHTML = `
            <div class="nav-item-header" data-id="${node.id}">
                <span class="caret ${hasChildren ? '' : 'no-children'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
                <span class="doc-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </span>
                <span class="doc-title">${node.title}</span>
                <div class="doc-admin-controls" style="display: ${isAdmin ? 'flex' : 'none'};">
                    <button class="doc-admin-btn add-child-btn" title="Добавить подраздел"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                    <button class="doc-admin-btn edit-doc-btn" title="Редактировать"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="doc-admin-btn delete-doc-btn" title="Удалить"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </div>
        `;

        if (hasChildren) {
            renderSidebar(node.children, li, true);
        } else {
             li.querySelector('.caret').classList.add('collapsed');
        }

        treeElement.appendChild(li);
    });
    container.appendChild(treeElement);
}

function renderContent(docNode) {
    const contentWrapper = document.getElementById('docs-content-wrapper');
    const emptyState = document.getElementById('docs-empty-state');
    if (!contentWrapper || !emptyState) return;

    if (!docNode) {
        contentWrapper.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    contentWrapper.style.display = 'block';
    
    const renderedMarkdown = window.marked ? window.marked.parse(docNode.content || '*У этой страницы пока нет содержимого.*') : (docNode.content || '');
    contentWrapper.innerHTML = `
        <h1>${docNode.title}</h1>
        <div class="rendered-content">${renderedMarkdown}</div>
    `;
    
    window.location.hash = docNode.slug;

    const sidebar = document.getElementById('docs-sidebar');
    const currentActive = sidebar.querySelector('.nav-item-header.active');
    if (currentActive) currentActive.classList.remove('active');
    const newActive = sidebar.querySelector(`.nav-item-header[data-id="${docNode.id}"]`);
    if (newActive) newActive.classList.add('active');
}


function createSlug(title) {
    return title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

function setupSidebarEvents() {
    const sidebar = document.getElementById('docs-sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', (e) => {
        const header = e.target.closest('.nav-item-header');
        const caret = e.target.closest('.caret');
        const addChildBtn = e.target.closest('.add-child-btn');
        const editBtn = e.target.closest('.edit-doc-btn');
        const deleteBtn = e.target.closest('.delete-doc-btn');
        
        e.stopPropagation();

        if (caret && !caret.classList.contains('no-children')) {
            const sublist = caret.closest('.docs-nav-item').querySelector('ul');
            if (sublist) {
                sublist.classList.toggle('collapsed');
                caret.classList.toggle('collapsed');
            }
            return;
        }

        if (addChildBtn) {
            const parentId = addChildBtn.closest('.docs-nav-item').dataset.id;
            openEditorModal({ mode: 'create', parentId });
            return;
        }
        if (editBtn) {
            const id = editBtn.closest('.docs-nav-item').dataset.id;
            const doc = findDocById(docsData, id);
            openEditorModal({ mode: 'edit', doc });
            return;
        }
        if (deleteBtn) {
            const id = deleteBtn.closest('.docs-nav-item').dataset.id;
            handleDelete(id);
            return;
        }

        if (header) {
            const id = header.dataset.id;
            const doc = findDocById(docsData, id);
            if (doc) renderContent(doc);
        }
    });

    const addRootBtn = document.getElementById('add-root-doc-btn');
    if (addRootBtn) {
        addRootBtn.addEventListener('click', () => openEditorModal({ mode: 'create' }));
    }
}

function setupSearch() {
    const searchInput = document.getElementById('docs-search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.docs-nav-item').forEach(item => {
            const title = item.querySelector('.doc-title').textContent.toLowerCase();
            item.classList.toggle('hidden-by-search', !title.includes(query));
        });
    });
}

function openEditorModal({ mode, doc = null, parentId = null }) {
    if (typeof EasyMDE === 'undefined') {
        alert('Редактор не загружен. Пожалуйста, обновите страницу.');
        return;
    }
    const container = document.getElementById('doc-editor-modal-container');
    const template = document.getElementById('doc-editor-template');
    container.innerHTML = '';
    container.appendChild(template.content.cloneNode(true));

    editorModal.element = container.querySelector('.modal-overlay');
    
    const titleEl = editorModal.element.querySelector('#editor-modal-title');
    const form = editorModal.element.querySelector('#doc-editor-form');
    const idInput = editorModal.element.querySelector('#doc-id-input');
    const parentIdInput = editorModal.element.querySelector('#doc-parentId-input');
    const titleInput = editorModal.element.querySelector('#doc-title-input');
    const slugInput = editorModal.element.querySelector('#doc-slug-input');
    let initialContent = '';

    titleInput.addEventListener('input', () => {
        if (!idInput.value) {
            slugInput.value = createSlug(titleInput.value);
        }
    });

    if (mode === 'edit') {
        if (!doc) {
            console.error("Edit mode called but no doc was provided.");
            alert("Ошибка: не удалось загрузить данные для редактирования.");
            return;
        }
        titleEl.textContent = 'Редактировать страницу';
        idInput.value = doc.id;
        parentIdInput.value = doc.parentId || '';
        titleInput.value = doc.title;
        slugInput.value = doc.slug;
        initialContent = doc.content || '';
    } else {
        titleEl.textContent = 'Создать страницу';
        idInput.value = '';
        parentIdInput.value = parentId || '';
    }

    editorModal.mde = new EasyMDE({
        element: editorModal.element.querySelector('#doc-content-textarea'),
        initialValue: initialContent,
        spellChecker: false,
    });
    
    editorModal.element.classList.add('active');
    document.body.classList.add('modal-open');

    editorModal.element.querySelector('.modal-close-btn').onclick = closeEditorModal;
    editorModal.element.querySelector('.modal-cancel-btn').onclick = closeEditorModal;
    editorModal.element.querySelector('.modal-overlay').onclick = (e) => {
        if (e.target === editorModal.element) closeEditorModal();
    };
    form.onsubmit = handleEditorSubmit;
}

function closeEditorModal() {
    if (!editorModal.element) return;
    editorModal.element.classList.remove('active');
    document.body.classList.remove('modal-open');
    if (editorModal.mde) {
        editorModal.mde.toTextArea();
        editorModal.mde = null;
    }
    setTimeout(() => {
        if (editorModal.element && editorModal.element.parentElement) {
            editorModal.element.parentElement.innerHTML = '';
        }
        editorModal.element = null;
    }, 300);
}

async function handleEditorSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = form.querySelector('#doc-form-error');
    const originalBtnText = submitBtn.textContent;
    
    // UI feedback
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';

    const mode = form.querySelector('#doc-id-input').value ? 'edit' : 'create';
    const data = {
        id: form.querySelector('#doc-id-input').value,
        parentId: form.querySelector('#doc-parentId-input').value || null,
        title: form.querySelector('#doc-title-input').value,
        slug: form.querySelector('#doc-slug-input').value,
        content: editorModal.mde.value(),
    };

    if (!data.title || !data.slug) {
        errorEl.textContent = 'Заголовок и URL обязательны.';
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        return;
    }

    const url = mode === 'edit' ? `/api/docs/${data.id}` : '/api/docs';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) {
            const err = new Error(result.error || 'Неизвестная ошибка сервера');
            err.details = result.details || '';
            throw err;
        }
        
        closeEditorModal();
        await initDocsPage(result.id);
    } catch (error) {
        console.error('Editor submit error:', error);
        errorEl.textContent = error.details ? `${error.message} ${error.details}` : error.message;
    } finally {
        // Always restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}


async function handleDelete(id) {
    if (!confirm('Вы уверены? Это действие удалит эту страницу и все вложенные в нее страницы.')) return;

    try {
        const response = await fetch(`/api/docs/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error);
        }
        await initDocsPage();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

function setupDragAndDrop() {
    if (typeof Sortable === 'undefined') return;
    const rootList = document.getElementById('docs-nav-tree-root');
    if (!rootList) return;

    const sortableOptions = {
        group: 'nested',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: handleDropEvent
    };

    new Sortable(rootList, sortableOptions);
    document.querySelectorAll('.docs-nav-tree ul').forEach(list => new Sortable(list, sortableOptions));
}

async function handleDropEvent(evt) {
    const updates = [];
    
    function getOrderForList(list, parentId) {
        Array.from(list.children).forEach((item, index) => {
            if (item.matches('.docs-nav-item')) {
                 updates.push({
                    id: item.dataset.id,
                    parentId: parentId,
                    displayOrder: index
                });
            }
        });
    }

    const allLists = document.querySelectorAll('.docs-nav-tree');
    allLists.forEach(ul => {
        const parentLi = ul.closest('.docs-nav-item');
        const parentId = parentLi ? parentLi.dataset.id : null;
        getOrderForList(ul, parentId);
    });
    
    try {
        const response = await fetch('/api/docs/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to save order');
    } catch (error) {
        console.error('Failed to save new order:', error);
        alert('Не удалось сохранить новый порядок.');
        await initDocsPage();
    }
}

export async function initDocsPage(idToSelect = null) {
    const navContainer = document.getElementById('docs-nav-container');
    navContainer.innerHTML = `<div class="loader-container" style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>`;
    
    try {
        const adminRes = await fetch('/api/is-admin');
        const adminData = await adminRes.json();
        isAdmin = adminData.isAdmin;
    } catch { isAdmin = false; }
    
    document.getElementById('admin-sidebar-controls').style.display = isAdmin ? 'block' : 'none';

    if (await fetchDocs()) {
        navContainer.innerHTML = '';
        if (docsData.length > 0) {
            renderSidebar(docsData, navContainer);
            let docToRender = null;
            const slugFromHash = window.location.hash.substring(1);

            function findDocBy(nodes, key, value) {
                for (const node of nodes) {
                    if (String(node[key]) === String(value)) return node;
                    if(node.children && node.children.length > 0) {
                        const found = findDocBy(node.children, key, value);
                        if (found) return found;
                    }
                }
                return null;
            }
            
            if (idToSelect) {
                docToRender = findDocBy(docsData, 'id', idToSelect);
            } else if (slugFromHash) {
                docToRender = findDocBy(docsData, 'slug', slugFromHash);
            }
            
            if (!docToRender) docToRender = docsData[0];
            
            renderContent(docToRender);

        } else {
            renderContent(null);
            const emptyState = document.getElementById('docs-empty-state');
            if (emptyState && isAdmin) {
               const adminPrompt = emptyState.querySelector('#admin-empty-prompt');
               if(adminPrompt) adminPrompt.style.display = 'inline';
            }
        }
    }
    
    setupSidebarEvents();
    setupSearch();
    if (isAdmin) {
        setupDragAndDrop();
    }
}