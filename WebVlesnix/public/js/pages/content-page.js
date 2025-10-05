
// Global variables for the page
let pageKey = '';
let currentContent = '';
let mdeInstance = null;
let isEditing = false;

// DOM Element references
let pageContainer, contentContainer, editorContainer, adminBar, editBtn, saveBtn, cancelBtn, statusIndicator;

// Fetches content from the API and renders it
async function fetchPageContent() {
    if (!contentContainer) return;
    contentContainer.innerHTML = `<div class="spinner" style="margin: 4rem auto;"></div>`;

    try {
        const response = await fetch(`/api/pages/${pageKey}`);
        if (!response.ok) throw new Error('Не удалось загрузить контент страницы.');
        const data = await response.json();

        currentContent = data.content; // Store raw markdown
        renderMarkdown(currentContent);
    } catch (error) {
        console.error(error);
        contentContainer.innerHTML = `<p style="text-align: center; color: var(--danger-color);">${error.message}</p>`;
    }
}

// Renders markdown string to HTML
function renderMarkdown(markdown) {
    if (window.marked) {
        contentContainer.innerHTML = window.marked.parse(markdown);
    } else {
        contentContainer.textContent = markdown; // Fallback
    }
}

// Switches to editing mode by toggling a class and initializing the editor
function startEditing() {
    if (isEditing) return;
    if (typeof EasyMDE === 'undefined') {
        alert('Компонент редактора не загружен. Пожалуйста, обновите страницу.');
        return;
    }
    isEditing = true;

    // The key change: toggle a class. CSS will handle making the editor container visible.
    pageContainer.classList.add('editing-mode');

    // Now that the container is visible (display: flex), we can safely initialize the editor.
    if (!mdeInstance) {
        const textarea = editorContainer.querySelector('#content-editor-textarea');
        mdeInstance = new EasyMDE({
            element: textarea,
            initialValue: currentContent,
            spellChecker: false,
            toolbar: [
                'bold', 'italic', 'strikethrough', '|',
                'heading-1', 'heading-2', 'heading-3', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', 'code', 'table', '|',
                'preview', 'side-by-side', 'fullscreen'
            ],
            onToggleFullScreen: (fullscreen) => {
                document.body.classList.toggle('editor-fullscreen-active', fullscreen);
            },
        });
    }

    updateAdminBarUI();
}

// Switches back to view mode, destroying the editor instance
function stopEditing(revertChanges = false) {
    if (!isEditing) return;
    isEditing = false;

    pageContainer.classList.remove('editing-mode');

    // Properly destroy the MDE instance to prevent memory leaks and UI glitches
    if (mdeInstance) {
        mdeInstance.toTextArea();
        mdeInstance = null;
    }

    // If canceling, re-render the original, unmodified content
    if (revertChanges) {
        renderMarkdown(currentContent);
    }

    updateAdminBarUI();
}

// Saves the content via API call
async function saveContent() {
    if (!isEditing || !mdeInstance) return;

    const originalBtnContent = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="spinner" style="width:20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';
    statusIndicator.textContent = 'Сохранение...';
    statusIndicator.classList.remove('error', 'success');

    const newContent = mdeInstance.value();

    try {
        const response = await fetch(`/api/pages/${pageKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Произошла ошибка сервера.');
        }

        currentContent = newContent; // Update the stored content
        renderMarkdown(newContent);   // Render the new content to the view

        statusIndicator.textContent = 'Сохранено!';
        statusIndicator.classList.add('success');

        stopEditing(false); // Switch UI to view mode immediately

        // Clear status message after a few seconds
        setTimeout(() => {
            // Check if we are still in view mode and the element exists before clearing
            if (!isEditing && document.getElementById('admin-status-indicator')) {
                statusIndicator.textContent = '';
                statusIndicator.classList.remove('success');
            }
        }, 3000);

    } catch (error) {
        console.error('Save failed:', error);
        statusIndicator.textContent = `Ошибка: ${error.message}`;
        statusIndicator.classList.add('error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnContent;
    }
}


// Updates the floating admin bar based on the current mode
function updateAdminBarUI() {
    if (isEditing) {
        editBtn.style.display = 'none';
        cancelBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'inline-flex';
        statusIndicator.textContent = ''; // Don't show "Edit mode" text to allow centering
        statusIndicator.classList.remove('error', 'success');
    } else {
        editBtn.style.display = 'inline-flex';
        cancelBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        // Status is handled by saveContent, so we only clear it if there's no temp message
        if (!statusIndicator.classList.contains('success') && !statusIndicator.classList.contains('error')) {
            statusIndicator.textContent = '';
        }
    }
}


// Checks if the user is an admin and shows the admin bar
async function checkAdminAndSetupEditor() {
    try {
        const response = await fetch('/api/is-admin');
        if (!response.ok) return;
        const { isAdmin } = await response.json();

        if (isAdmin) {
            adminBar.style.display = 'flex';
            editBtn.addEventListener('click', startEditing);
            cancelBtn.addEventListener('click', () => stopEditing(true));
            saveBtn.addEventListener('click', saveContent);
        }
    } catch (error) {
        console.warn('Не удалось проверить статус администратора:', error);
    }
}

// Caches references to DOM elements
function assignElements() {
    pageContainer = document.getElementById('content-page-container');
    contentContainer = document.getElementById('page-content-container');
    editorContainer = document.getElementById('page-editor-container');
    adminBar = document.getElementById('admin-controls-bar');
    editBtn = document.getElementById('admin-edit-btn');
    saveBtn = document.getElementById('admin-save-btn');
    cancelBtn = document.getElementById('admin-cancel-btn');
    statusIndicator = document.getElementById('admin-status-indicator');
}

// Main initialization function for the page
export async function initContentPage() {
    const path = window.location.pathname;
    if (path.includes('/privacy')) {
        pageKey = 'privacy';
    } else if (path.includes('/terms')) {
        pageKey = 'terms';
    } else {
        return; // Not a content page
    }

    assignElements();

    if (window.marked) {
        window.marked.setOptions({ breaks: true, gfm: true });
    }

    await fetchPageContent();
    await checkAdminAndSetupEditor();
}
