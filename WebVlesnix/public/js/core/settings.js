
import { setupParticles } from './theme.js';
import { setupStickyCursor, destroyStickyCursor } from './cursor.js';

export function setupSiteSettings() {
    const settingsBtn = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const particlesToggle = document.getElementById('particles-toggle');
    const cursorToggle = document.getElementById('cursor-toggle');

    if (!settingsBtn || !settingsPanel || !particlesToggle || !cursorToggle) return;

    // Set initial state from localStorage
    const particlesEnabled = localStorage.getItem('particles_enabled') !== 'false';
    const cursorEnabled = localStorage.getItem('cursor_enabled') !== 'false';
    particlesToggle.checked = particlesEnabled;
    cursorToggle.checked = cursorEnabled;

    // Toggle panel visibility
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('active') && !settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsPanel.classList.remove('active');
        }
    });

    // Handle particle toggle
    particlesToggle.addEventListener('change', () => {
        if (particlesToggle.checked) {
            localStorage.setItem('particles_enabled', 'true');
            const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            setupParticles(theme);
        } else {
            localStorage.setItem('particles_enabled', 'false');
            if (window.pJSDom && window.pJSDom[0]) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
                window.pJSDom = [];
            }
        }
    });

    // Handle cursor toggle
    cursorToggle.addEventListener('change', () => {
        if (cursorToggle.checked) {
            localStorage.setItem('cursor_enabled', 'true');
            setupStickyCursor();
        } else {
            localStorage.setItem('cursor_enabled', 'false');
            destroyStickyCursor();
        }
    });
}
