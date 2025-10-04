
import { currentUser } from '../core/state.js';

export function initProfilePage() {
    if (!currentUser) return;

    const avatarEl = document.getElementById('profile-avatar');
    const usernameEl = document.getElementById('profile-username');
    const useridEl = document.getElementById('profile-userid');

    if (avatarEl) avatarEl.src = currentUser.avatar.replace('.png', '.webp?size=128');
    if (usernameEl) usernameEl.textContent = currentUser.username;
    if (useridEl) useridEl.textContent = `User ID: ${currentUser.id}`;
}
