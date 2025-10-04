let pageKey = '';
let editor = { overlay: null, mde: null, errorEl: null, saveBtn: null };
let initialContent = '';

async function fetchPageContent() {
    const container = document.getElementById('page-content-container');
    if (!container) return;
    container.innerHTML = `<div class="spinner" style="margin: 4rem auto;"></div>`;

    try {
        const response = await fetch(`/api/pages/${pageKey}`);
        if (!response.ok) throw new Error('Failed to load page content.');
        const data = await response.json();
        
        initialContent = data.content; // Store raw markdown for editor

        const renderedMarkdown = window.marked ? window.marked.parse(data.content) : data.content;
        container.innerHTML = renderedMarkdown;

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align: center; color: var(--danger-color);">${error.message}</p>`;
    }
}

function openEditor() {
    if (typeof EasyMDE === 'undefined') {
        alert('Editor component is not available. Please refresh the page.');
        return;
    }
    if (editor.overlay) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="content-editor-overlay" id="content-editor-overlay">
            <div class="content-editor">
                <div class="content-editor-header">
                    <h3>Редактирование страницы</h3>
                    <button class="modal-close-btn" id="editor-close-btn">&times;</button>
                </div>
                <div class="content-editor-body">
                    <textarea id="content-editor-textarea"></textarea>
                </div>
                <div class="content-editor-footer">
                    <p class="editor-error-message" id="editor-error-message"></p>
                    <button class="cta-button-secondary" id="editor-cancel-btn">Отмена</button>
                    <button class="cta-button" id="editor-save-btn">Сохранить</button>
                </div>
            </div>
        </div>
    `);

    editor.overlay = document.getElementById('content-editor-overlay');
    editor.errorEl = document.getElementById('editor-error-message');
    editor.saveBtn = document.getElementById('editor-save-btn');

    editor.mde = new EasyMDE({
        element: document.getElementById('content-editor-textarea'),
        initialValue: initialContent,
        spellChecker: false,
        minHeight: '100%',
    });

    editor.overlay.classList.add('active');
    document.body.classList.add('modal-open');

    document.getElementById('editor-close-btn').onclick = closeEditor;
    document.getElementById('editor-cancel-btn').onclick = closeEditor;
    editor.saveBtn.onclick = saveContent;
    editor.overlay.onclick = (e) => {
        if (e.target === editor.overlay) closeEditor();
    };
}

function closeEditor() {
    if (!editor.overlay) return;
    editor.overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    if (editor.mde) {
        editor.mde.toTextArea();
        editor.mde = null;
    }
    setTimeout(() => {
        editor.overlay.remove();
        editor = { overlay: null, mde: null, errorEl: null, saveBtn: null };
    }, 300);
}

async function saveContent() {
    if (!editor.mde || !editor.saveBtn) return;

    const originalBtnText = editor.saveBtn.textContent;
    editor.saveBtn.disabled = true;
    editor.saveBtn.textContent = 'Сохранение...';
    editor.errorEl.textContent = '';

    const newContent = editor.mde.value();

    try {
        const response = await fetch(`/api/pages/${pageKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Server error occurred.');
        }

        closeEditor();
        await fetchPageContent();

    } catch (error) {
        console.error('Save failed:', error);
        editor.errorEl.textContent = `Ошибка: ${error.message}`;
        editor.saveBtn.disabled = false;
        editor.saveBtn.textContent = originalBtnText;
    }
}

async function checkAdminAndSetupEditor() {
    try {
        const response = await fetch('/api/is-admin');
        if (!response.ok) return;
        const { isAdmin } = await response.json();

        if (isAdmin) {
            const container = document.getElementById('admin-edit-container');
            if (container) {
                container.innerHTML = `
                    <button id="edit-page-btn" class="cta-button-secondary">Редактировать страницу</button>
                `;
                document.getElementById('edit-page-btn').addEventListener('click', openEditor);
            }
        }
    } catch (error) {
        console.warn('Could not check admin status:', error);
    }
}


export async function initContentPage() {
    const path = window.location.pathname;
    if (path.includes('/privacy')) {
        pageKey = 'privacy';
    } else if (path.includes('/terms')) {
        pageKey = 'terms';
    } else {
        return;
    }
    
    if (window.marked) {
        window.marked.setOptions({ breaks: true, gfm: true });
    }

    await fetchPageContent();
    await checkAdminAndSetupEditor();
}
