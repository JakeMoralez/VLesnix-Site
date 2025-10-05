
export function initProfilePage(user) {
    if (!user) return;

    const avatarEl = document.getElementById('profile-avatar');
    const usernameEl = document.getElementById('profile-username');
    const useridEl = document.getElementById('profile-userid');

    if (avatarEl) avatarEl.src = user.avatar.replace('.png', '.webp?size=128');
    if (usernameEl) usernameEl.textContent = user.username;
    if (useridEl) useridEl.textContent = `User ID: ${user.id}`;
}
