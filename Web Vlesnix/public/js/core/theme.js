
export function setupParticles(theme) {
    if (typeof particlesJS === 'undefined') return;
    
    const colors = {
        dark: { particles: '#bf95ff', lines: '#9d50ff' },
        light: { particles: '#2c3e50', lines: '#6c5ce7' }
    };
    const currentColors = colors[theme];
    if (window.pJSDom && window.pJSDom[0]) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
    }

    const isManagePage = document.body.classList.contains('manage-page');

    const particleConfig = {
        "particles": {
            "number": { "value": isManagePage ? 30 : 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": currentColors.particles },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": currentColors.lines, "opacity": 0.2, "width": 1 },
            "move": { "enable": true, "speed": isManagePage ? 2 : 2.5, "direction": "none", "random": true, "straight": false, "out_mode": "out" }
        },
        "interactivity": {
            "detect_on": "window",
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false }, "resize": true },
            "modes": { "repulse": { "distance": 100, "duration": 0.4 } }
        },
        "retina_detect": true
    };

    particlesJS('particles-bg', particleConfig);
}

export function applyTheme(theme, animate, event) {
    const isDark = theme === 'dark';
    if (animate && event && document.startViewTransition) {
        const x = event.clientX;
        const y = event.clientY;
        document.documentElement.style.setProperty('--clip-x', x + 'px');
        document.documentElement.style.setProperty('--clip-y', y + 'px');
        const transition = document.startViewTransition(() => {
            document.body.classList.toggle('dark-theme', isDark);
            document.body.classList.toggle('light-theme', !isDark);
        });
        transition.ready.then(() => {
            localStorage.setItem('theme', theme);
            if (localStorage.getItem('particles_enabled') !== 'false') {
                setupParticles(theme);
            }
        });
    } else {
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem('theme', theme);
        if (localStorage.getItem('particles_enabled') !== 'false') {
            setupParticles(theme);
        }
    }
}

export function setupThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (event) => {
            if (themeSwitcher.classList.contains('animating')) return;
            themeSwitcher.classList.add('animating');

            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, true, event);

            setTimeout(() => themeSwitcher.classList.remove('animating'), 600);
        });
    }
}
