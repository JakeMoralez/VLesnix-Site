

let teamData = [];
let isAdmin = false;
let sortableInstance = null;
let initialOrder = [];
let selectedAvatarFile = null;
let lastFocusedElement = null;

// --- HELPERS ---
function getSocialIcon(platform) {
    const icons = {
        github: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
        telegram: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z"></path><path d="M22 2 11 13"></path></svg>`,
        website: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    };
    return icons[platform.toLowerCase()] || icons.website;
}


// --- RENDERING ---

function renderTeamCards() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;

    grid.classList.toggle('single-item', teamData.length === 1);
    grid.innerHTML = '';

    teamData.forEach(member => {
        const adminActionsHtml = isAdmin ? `
            <div class="admin-actions">
                <button class="admin-action-btn edit-btn" data-id="${member.id}" aria-label="Редактировать">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="admin-action-btn delete-btn" data-id="${member.id}" aria-label="Удалить">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        ` : '';

        const socialsHtml = (member.socials || [])
            .map(social => `<a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.platform}">${getSocialIcon(social.platform)}</a>`)
            .join('');

        const card = document.createElement('div');
        card.className = 'team-card reveal';
        card.dataset.id = member.id;
        card.innerHTML = `
            ${adminActionsHtml}
            <img src="${member.avatar_url || '../assets/images/logo.png'}" alt="Аватар ${member.name}" class="team-card-avatar">
            <div class="team-card-content">
                <h3 class="team-card-name">${member.name}</h3>
                <p class="team-card-role" data-role-type="${member.role_type}">${member.role_text}</p>
                <p class="team-card-description">${member.description}</p>
                <div class="team-card-socials">
                    ${socialsHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}


// --- DATA FETCHING ---

async function fetchAndRenderTeam() {
    const grid = document.getElementById('team-grid');
    try {
        const response = await fetch('/api/team');
        if (!response.ok) throw new Error('Failed to load team data');
        teamData = await response.json();
        initialOrder = teamData.map(m => m.id);
        renderTeamCards();
        await checkAdminAndSetupUI();
    } catch (error) {
        console.error(error);
        if (grid) grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">Не удалось загрузить команду.</p>`;
    }
}

async function checkAdminAndSetupUI() {
    try {
        const response = await fetch('/api/is-admin');
        isAdmin = response.ok && (await response.json()).isAdmin;
        if (isAdmin) {
            document.getElementById('admin-controls').style.display = 'block';
            renderTeamCards(); // Re-render to add admin buttons
            initSortable();
        }
    } catch (error) {
        console.warn('Failed to check admin status:', error);
        isAdmin = false;
    }
}

// --- MODAL & EDITOR LOGIC ---

function openEditorModal(member = null) {
    lastFocusedElement = document.activeElement;
    selectedAvatarFile = null;
    const isEdit = member !== null;
    const modalContainer = document.getElementById('team-editor-modal-container');
    const template = document.getElementById('team-editor-template');
    if (!modalContainer || !template) return;

    modalContainer.innerHTML = '';
    const modalInstance = template.content.cloneNode(true);
    modalContainer.appendChild(modalInstance);

    const modalOverlay = modalContainer.querySelector('.modal-overlay');
    const form = modalContainer.querySelector('#team-editor-form');
    const modalTitle = modalContainer.querySelector('#editor-modal-title');
    const nameInput = document.getElementById('team-name-input');
    const roleTextInput = document.getElementById('team-role-text-input');
    const roleTypeSelect = document.getElementById('team-role-type-select');
    const descriptionTextarea = document.getElementById('team-description-textarea');
    const socialLinksContainer = document.getElementById('social-links-container');
    const addSocialBtn = document.getElementById('add-social-btn');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarFileInput = document.getElementById('team-avatar-file-input');
    const avatarPreviewWrapper = document.getElementById('avatar-preview-wrapper');
    const avatarUrlHiddenInput = document.getElementById('team-avatar-url-hidden');
    const helperText = avatarPreviewWrapper.nextElementSibling;

    const addSocialLinkRow = (platform = 'github', url = '') => {
        const row = document.createElement('div');
        row.className = 'social-link-row';
        row.innerHTML = `
            <select class="social-platform-select" aria-label="Platform">
                <option value="github" ${platform === 'github' ? 'selected' : ''}>GitHub</option>
                <option value="telegram" ${platform === 'telegram' ? 'selected' : ''}>Telegram</option>
                <option value="website" ${platform === 'website' ? 'selected' : ''}>Website</option>
            </select>
            <input type="url" class="social-url-input" placeholder="https://..." value="${url}" required>
            <button type="button" class="cta-button-secondary danger remove-social-btn" aria-label="Remove link">&times;</button>
        `;
        socialLinksContainer.appendChild(row);
        row.querySelector('.remove-social-btn').addEventListener('click', () => row.remove());
    };

    addSocialBtn.addEventListener('click', () => addSocialLinkRow());

    avatarPreviewWrapper.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', () => {
        const file = avatarFileInput.files[0];
        if (file) {
            selectedAvatarFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                avatarPreview.src = e.target.result;
                helperText.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    if (isEdit) {
        modalTitle.textContent = 'Редактировать участника';
        nameInput.value = member.name;
        roleTextInput.value = member.role_text;
        roleTypeSelect.value = member.role_type;
        descriptionTextarea.value = member.description;
        avatarPreview.src = member.avatar_url || '../assets/images/logo.png';
        avatarUrlHiddenInput.value = member.avatar_url || '';
        socialLinksContainer.innerHTML = '';
        (member.socials || []).forEach(social => addSocialLinkRow(social.platform, social.url));
    } else {
        modalTitle.textContent = 'Добавить участника';
        addSocialLinkRow(); // Add one empty row
    }

    modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');

    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = modalOverlay.querySelector('.modal');
    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
    const focusableContent = modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    function trapFocus(e) {
        let isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        if (!isTabPressed) return;
        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    document.addEventListener('keydown', trapFocus);
    modal.trapFocusListener = trapFocus;

    setTimeout(() => firstFocusableElement.focus(), 100);

    modalContainer.querySelector('.modal-close-btn').onclick = closeEditorModal;
    modalContainer.querySelector('.modal-cancel-btn').onclick = closeEditorModal;
    modalOverlay.onclick = e => { if (e.target === modalOverlay) closeEditorModal(); };
    form.onsubmit = e => handleEditorSubmit(e, member ? member.id : null);
}

function closeEditorModal() {
    const modalOverlay = document.querySelector('#team-editor-modal-container .modal-overlay');
    if (modalOverlay) {
        const modal = modalOverlay.querySelector('.modal');
        if (modal && modal.trapFocusListener) {
            document.removeEventListener('keydown', modal.trapFocusListener);
        }
        modalOverlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
             if (modalOverlay.parentElement) modalOverlay.parentElement.innerHTML = '';
        }, 300);
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }
}

async function handleEditorSubmit(event, memberId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = form.querySelector('.form-error-message');
    const originalBtnText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>';
    errorEl.textContent = '';

    const formData = new FormData();
    formData.append('name', document.getElementById('team-name-input').value);
    formData.append('role_text', document.getElementById('team-role-text-input').value);
    formData.append('role_type', document.getElementById('team-role-type-select').value);
    formData.append('description', document.getElementById('team-description-textarea').value);

    if (selectedAvatarFile) {
        formData.append('avatar', selectedAvatarFile);
    } else {
        formData.append('avatar_url', document.getElementById('team-avatar-url-hidden').value);
    }

    const socials = Array.from(document.querySelectorAll('.social-link-row')).map(row => ({
        platform: row.querySelector('.social-platform-select').value,
        url: row.querySelector('.social-url-input').value
    })).filter(s => s.url);
    formData.append('socials', JSON.stringify(socials));

    const isEdit = memberId !== null;
    const url = isEdit ? `/api/team/${memberId}` : '/api/team';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, { method, body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ошибка сервера');

        closeEditorModal();
        await fetchAndRenderTeam();
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function handleDelete(memberId) {
    if (!confirm('Вы уверены, что хотите удалить этого участника?')) return;
    try {
        const response = await fetch(`/api/team/${memberId}`, { method: 'DELETE' });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Ошибка сервера');
        }
        await fetchAndRenderTeam();
    } catch (error) {
        alert(`Не удалось удалить: ${error.message}`);
    }
}


// --- SORTABLEJS LOGIC ---

function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    const grid = document.getElementById('team-grid');
    if (!grid) return;
    grid.classList.add('sortable-active');
    sortableInstance = Sortable.create(grid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: () => {
            const currentOrder = Array.from(grid.children).map(el => el.dataset.id);
            if (JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
                showSaveBar();
            } else {
                hideSaveBar();
            }
        }
    });
}

function showSaveBar() {
    const bar = document.getElementById('save-order-toast');
    if (bar) bar.classList.add('active');
}

function hideSaveBar() {
    const bar = document.getElementById('save-order-toast');
    const saveBtn = document.getElementById('save-order-btn');

    if (bar) bar.classList.remove('active');

    if(saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('success');
        saveBtn.textContent = 'Сохранить порядок';
    }
}

async function saveOrder() {
    const grid = document.getElementById('team-grid');
    const newOrder = Array.from(grid.children).map(el => el.dataset.id);
    const saveBtn = document.getElementById('save-order-btn');

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="spinner" style="width:18px; height: 18px; border-width: 2px; margin: 0 auto;"></div>';

    try {
        const response = await fetch('/api/team/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder })
        });
        if (!response.ok) throw new Error('Failed to save order');
        initialOrder = newOrder;

        saveBtn.textContent = 'Сохранено!';
        saveBtn.classList.add('success');
        setTimeout(hideSaveBar, 2000);

    } catch (error) {
        alert('Ошибка сохранения порядка: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить порядок';
    }
}

function cancelOrder() {
    sortableInstance.sort(initialOrder);
    hideSaveBar();
}

// --- MAIN INITIALIZATION ---

export async function initTeamPage() {
    await fetchAndRenderTeam();

    document.getElementById('add-member-btn')?.addEventListener('click', () => openEditorModal());
    document.getElementById('team-grid')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const member = teamData.find(m => m.id === editBtn.dataset.id);
            if(member) openEditorModal(member);
        } else if (deleteBtn) {
            handleDelete(deleteBtn.dataset.id);
        }
    });

    document.getElementById('save-order-btn')?.addEventListener('click', saveOrder);
    document.getElementById('cancel-order-btn')?.addEventListener('click', cancelOrder);
}