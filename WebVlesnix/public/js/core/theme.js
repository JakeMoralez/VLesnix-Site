export function setupParticles(theme) {
    if (typeof particlesJS === 'undefined') {
        console.warn('particles.js not loaded, skipping setup.');
        return;
    }

    // Always destroy existing instance to re-init with new theme settings if needed
    if (window.pJSDom && window.pJSDom[0]) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
    }

    // Only run particles if enabled by user
    if (localStorage.getItem('particles_enabled') === 'false') {
        return;
    }

    const particlesConfig = {
        "particles": {
            "number": {
                "value": 40,
                "density": { "enable": true, "value_area": 800 }
            },
            "color": { "value": "#7B2FF7" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 2, "random": true },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#7B2FF7",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": ["repulse", "grab"] },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 200,
                    "line_linked": { "opacity": 0.5 }
                },
                "repulse": { "distance": 250, "duration": 0.4 },
                "push": { "particles_nb": 4 },
            }
        },
        "retina_detect": true
    };

    const particleColor = theme === 'dark' ? '#7B2FF7' : '#8E2DE2';
    const lineColor = theme === 'dark' ? '#7B2FF7' : '#8E2DE2';
    const lineOpacity = theme === 'dark' ? 0.2 : 0.4;

    particlesConfig.particles.color.value = particleColor;
    particlesConfig.particles.line_linked.color = lineColor;
    particlesConfig.particles.line_linked.opacity = lineOpacity;

    particlesJS('particles-bg', particlesConfig);
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
            setupParticles(theme); // Re-initialize particles for new theme
        });
    } else {
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem('theme', theme);
        setupParticles(theme); // Re-initialize particles for new theme
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