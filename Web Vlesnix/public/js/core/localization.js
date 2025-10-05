
import { translations } from '../data/translations.js';
import { updateAuthUI } from './auth.js';

function applyTranslations(lang) {
    if (!translations[lang]) {
        console.error('Translations not loaded or language not found.');
        return;
    }

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        const translation = translations[lang][key];
        if (translation) {
            const type = element.getAttribute('data-translate-type');
            if (type === 'placeholder') {
                element.setAttribute('placeholder', translation);
            } else if (type === 'aria-label') {
                element.setAttribute('aria-label', translation);
            } else if (element.classList.contains('main-title')) {
                // Let the animation function handle the text content
                element.textContent = translation;
            } else {
                element.innerHTML = translation;
            }
        }
    });
    document.documentElement.lang = lang;
}

function setupTitleAnimation() {
    const title = document.querySelector('.main-title');
    if (title && typeof gsap !== 'undefined') {
        const currentText = title.textContent.trim();
        // Prevent re-animating if text hasn't changed
        if (title.dataset.animatedText === currentText) {
            return;
        }

        title.innerHTML = ''; // Clear existing content
        currentText.split('').forEach(char => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.perspective = '400px';
            span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
            title.appendChild(span);
        });
        title.dataset.animatedText = currentText;

        // 3D flip animation
        gsap.from(title.querySelectorAll('span'), {
            duration: 0.8,
            opacity: 0,
            y: 80,
            rotationX: -180,
            transformOrigin: '50% 50%',
            ease: 'power3.out',
            stagger: 0.04,
        });
    }
}


export function setupLocalization() {
    const langButton = document.getElementById('lang-selector-button');
    const langDropdown = document.getElementById('lang-selector-dropdown');
    const currentLangName = document.getElementById('current-lang-name');

    if (!langButton || !langDropdown || !currentLangName) return;

    let currentLang = localStorage.getItem('language') || 'ru';

    // Set initial text on button
    const initialLangOption = langDropdown.querySelector(`.lang-option[data-lang="${currentLang}"]`);
    if (initialLangOption) {
        currentLangName.textContent = initialLangOption.textContent;
    }

    applyTranslations(currentLang);
    setupTitleAnimation();

    // Toggle dropdown
    langButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
        langButton.classList.toggle('active');
        const isExpanded = langDropdown.classList.contains('active');
        langButton.setAttribute('aria-expanded', String(isExpanded));
    });

    // Handle language selection
    langDropdown.addEventListener('click', async (e) => {
        const langOption = e.target.closest('.lang-option');
        if (langOption) {
            e.preventDefault();
            const newLang = langOption.dataset.lang;
            if (newLang !== currentLang) {
                currentLang = newLang;
                localStorage.setItem('language', currentLang);

                currentLangName.textContent = langOption.textContent;

                applyTranslations(currentLang);
                await updateAuthUI();
                setupTitleAnimation();
            }
            langDropdown.classList.remove('active');
            langButton.classList.remove('active');
            langButton.setAttribute('aria-expanded', 'false');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (langDropdown.classList.contains('active')) {
            langDropdown.classList.remove('active');
            langButton.classList.remove('active');
            langButton.setAttribute('aria-expanded', 'false');
        }
    });
}