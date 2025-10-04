

let isStuck = false;
let stuckTarget = null;
let cursorTicker = null;
let mouseMoveListener = null;

const mouse = { x: 0, y: 0 };
const pos = { x: 0, y: 0 };

function updateCursorPosition() {
    const cursor = document.querySelector('.sticky-cursor');
    if (!cursor) return;

    if (isStuck && stuckTarget) {
        const rect = stuckTarget.getBoundingClientRect();
        pos.x = gsap.utils.interpolate(pos.x, rect.left + rect.width / 2, 0.2);
        pos.y = gsap.utils.interpolate(pos.y, rect.top + rect.height / 2, 0.2);
    } else {
        pos.x = mouse.x;
        pos.y = mouse.y;
    }
    gsap.set(cursor, { x: pos.x, y: pos.y });
}

function handleMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function addEventListeners() {
    const cursor = document.querySelector('.sticky-cursor');
    if (!cursor) return;

    const growElementsSelector = '.logo, footer a, .team-card-socials a';
    const stickElementsSelector = '.nav-center a, .cta-button, .cta-button-secondary, .cta-login-button, .cookie-btn, .server-card, .profile-avatar-btn, .theme-switcher, #lang-selector-button, .lang-option, .dropdown-item, .docs-sidebar a, .error-actions a, .tab-button, #server-search-input, #docs-search-input, .settings-button, .switch';

    document.querySelectorAll(growElementsSelector).forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (!isStuck) {
                gsap.to(cursor, { duration: 0.3, scale: 1.8, ease: 'power3.out' });
            }
        });
        el.addEventListener('mouseleave', () => {
             if (!isStuck) {
                gsap.to(cursor, { duration: 0.3, scale: 1, ease: 'power3.out' });
            }
        });
    });

    document.querySelectorAll(stickElementsSelector).forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            isStuck = true;
            stuckTarget = e.currentTarget;
            const rect = stuckTarget.getBoundingClientRect();
            const styles = window.getComputedStyle(stuckTarget);
            let br = styles.borderRadius;

            if (stuckTarget.classList.contains('switch')) {
                const slider = stuckTarget.querySelector('.slider');
                if (slider) {
                    br = window.getComputedStyle(slider).borderRadius;
                }
            }

            gsap.to(cursor, {
                duration: 0.3,
                ease: 'power3.out',
                width: rect.width,
                height: rect.height,
                borderRadius: br,
                backgroundColor: 'transparent',
                border: `2px solid white`,
                scale: 1,
                mixBlendMode: 'normal'
            });
        });

        el.addEventListener('mouseleave', () => {
            isStuck = false;
            stuckTarget = null;

            gsap.to(cursor, {
                duration: 0.3,
                ease: 'power3.out',
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'white',
                border: 'none',
                mixBlendMode: 'difference',
                scale: 1
            });
        });
    });
}


export function setupStickyCursor() {
    if (window.matchMedia("(pointer: coarse)").matches || typeof gsap === 'undefined') return;

    const cursor = document.querySelector('.sticky-cursor');
    if (!cursor) return;

    document.body.classList.add('cursor-active');
    cursor.style.display = 'block';

    gsap.set(cursor, {
        width: 20,
        height: 20,
        xPercent: -50,
        yPercent: -50,
        backgroundColor: 'white',
        mixBlendMode: 'difference'
    });

    mouseMoveListener = handleMouseMove;
    window.addEventListener('mousemove', mouseMoveListener, { passive: true });

    if (cursorTicker) {
        gsap.ticker.remove(cursorTicker);
    }
    cursorTicker = updateCursorPosition;
    gsap.ticker.add(cursorTicker);

    addEventListeners();
}

export function destroyStickyCursor() {
    const cursor = document.querySelector('.sticky-cursor');
    if (cursor) {
        cursor.style.display = 'none';
    }
    document.body.classList.remove('cursor-active');

    if (mouseMoveListener) {
        window.removeEventListener('mousemove', mouseMoveListener);
        mouseMoveListener = null;
    }
    if (cursorTicker) {
        gsap.ticker.remove(cursorTicker);
        cursorTicker = null;
    }
}