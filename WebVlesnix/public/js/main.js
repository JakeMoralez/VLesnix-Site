

import { setupLocalization } from './core/localization.js';
import { updateAuthUI } from './core/auth.js';
import { applyTheme, setupThemeSwitcher } from './core/theme.js';
import { setupSiteSettings } from './core/settings.js';
import { setupStickyCursor } from './core/cursor.js';
import { initDashboardPage } from './pages/dashboard.js';
import { initProfilePage } from './pages/profile.js';
import { initNewsPage } from './pages/news.js';
import { initContentPage } from './pages/content-page.js';
import { initTeamPage } from './pages/team.js';
import {
    initAnimations,
    setupHeaderScrollBehavior,
    setupCookieConsent,
    setupStatCounters
} from './core/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- CORE INITIALIZATION ---
    setupLocalization();
    const user = await updateAuthUI(); // Now returns user object or null

    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initialTheme = savedTheme || systemTheme;
    applyTheme(initialTheme, false);
    setupThemeSwitcher();

    // --- PAGE-SPECIFIC LOGIC ---
    const pageClass = document.body.classList[0]; // Assumes first class is the page identifier

    if (pageClass === 'dashboard-page') {
        if (user) initDashboardPage(user);
        else window.location.href = '/';
    } else if (pageClass === 'profile-page') {
        if (user) initProfilePage(user); // Pass user data directly
        else window.location.href = '/';
    } else if (pageClass === 'news-page') {
        await initNewsPage();
    } else if (pageClass === 'legal-page') {
        await initContentPage();
    } else if (pageClass === 'team-page') {
        await initTeamPage();
    }


    // --- GLOBAL UI FEATURES ---
    if (localStorage.getItem('cursor_enabled') !== 'false') {
        setupStickyCursor();
    }

    // Defer animations until everything is set up
    setTimeout(() => {
        initAnimations();
    }, 100);

    setupHeaderScrollBehavior();
    setupCookieConsent();
    setupStatCounters();
    setupSiteSettings();
});
