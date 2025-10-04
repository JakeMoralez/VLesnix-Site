
export function initAnimations() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const revealElements = gsap.utils.toArray('.reveal');
    
    revealElements.forEach((el, i) => {
        if (el.classList.contains('main-title')) return; // Title has its own animation
        gsap.to(el, { opacity: 1, y: 0, visibility: 'visible', duration: 0.8, ease: 'power3.out', delay: 0.2 });
    });

    const scrollRevealTargets = gsap.utils.toArray('.stats-section, .features-section .reveal, .advantages-section .reveal, .docs-page-container .reveal, .news-page-container .reveal, .team-page-container .reveal, .team-grid .reveal');
    scrollRevealTargets.forEach((el) => {
        gsap.fromTo(el,
            { opacity: 0, y: 50, visibility: 'hidden' },
            {
                opacity: 1, y: 0, visibility: 'visible', duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
            }
        );
    });
}

export function setupHeaderScrollBehavior() {
    const header = document.querySelector('header:not(.manage-header)');
    if (!header || document.body.classList.contains('manage-page')) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        if (currentScrollY > lastScrollY && currentScrollY > header.offsetHeight) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    });
}

export function setupCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    if (!banner) return;

    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');
    const consent = localStorage.getItem('cookie_consent');

    if (consent === null) {
        banner.style.display = 'flex';
    }

    if(acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'true');
            banner.style.display = 'none';
        });
    }

    if(declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'false');
            banner.style.display = 'none';
        });
    }
}

export function setupStatCounters() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentValue = Math.floor(progress * (end - start) + start);
            obj.innerHTML = currentValue.toLocaleString('ru-RU');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            const counters = statsSection.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                animateValue(counter, 0, target, 2000);
            });
            observer.unobserve(statsSection); // Animate only once
        }
    }, { threshold: 0.5 });

    observer.observe(statsSection);
}
