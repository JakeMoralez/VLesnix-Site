
import { translations } from '../data/translations.js';
import { currentUser, setCurrentUser } from './state.js';

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


export async function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return false;

    try {
        const response = await fetch('/api/user');
        const lang = localStorage.getItem('language') || 'ru';

        if (response.ok) {
            const user = await response.json();
            setCurrentUser(user);
            const isManagePage = document.body.classList.contains('manage-page');

            let dropdownLinks = `
                <a href="https://discord.gg/pzD2w4x5Hk" target="_blank" class="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span data-translate-key="dropdown_support">${translations[lang]['dropdown_support']}</span>
                    <svg class="external-link-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
            `;

            const panelLink = isManagePage
                ? `<a href="/dashboard" class="dropdown-item">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                       <span data-translate-key="dropdown_server_select">${translations[lang]['dropdown_server_select']}</span>
                   </a>`
                : `<a href="/dashboard" class="dropdown-item">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                       <span data-translate-key="dropdown_dashboard">${translations[lang]['dropdown_dashboard']}</span>
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
                            <span data-translate-key="dropdown_logout">${translations[lang]['dropdown_logout']}</span>
                        </a>
                    </div>
                </div>
            `;
            setupDropdown();
            return true;

        } else {
            setCurrentUser(null);
            authContainer.innerHTML = `<a href="/login" class="cta-login-button" data-translate-key="login_button">${translations[lang]['login_button']}</a>`;
            return false;
        }
    } catch (error) {
        setCurrentUser(null);
        const lang = localStorage.getItem('language') || 'ru';
        authContainer.innerHTML = `<a href="/login" class="cta-login-button" data-translate-key="login_button">${translations[lang]['login_button']}</a>`;
        console.warn("Auth server is not available. Displaying fallback login button.");
        return false;
    }
}