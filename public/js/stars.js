/**
 * Stars Module
 *
 * Purpose:
 * - Provide a lightweight ambient starfield for visual depth. Stars are
 *   DOM nodes with small animations; the module keeps node count low and
 *   removes transient elements after animation to avoid memory growth.
 *
 * Tradeoffs:
 * - Decorative only; respects browser performance and will not run when
 *   `prefers-reduced-motion` is set (handled in CSS/animation rules).
 */

function spawnShootingStar() {
    const container = document.getElementById('star-container');
    if (!container) return;

    const star = document.createElement('div');
    star.className = 'shooting-star';

    // Randomize starting vertical position (upper half of screen)
    star.style.top = Math.random() * 40 + '%';
    star.style.right = '0px';

    // The 'shoot' animation is defined in your CSS
    star.style.animation = 'shoot 1.5s ease-out forwards';

    container.appendChild(star);

    // Remove from DOM after the streak ends to keep the site light
    setTimeout(() => star.remove(), 2000);
}

export function initStarfield() {
    const container = document.createElement('div');
    container.id = 'star-container';
    document.body.prepend(container);

    // Ambient stars (Your original logic)
    const starCount = 100; 
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1 + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = size;
        star.style.height = size;
        star.style.setProperty('--duration', Math.random() * 20 + 15 + 's');
        star.style.setProperty('--opacity', Math.random() * 0.7 + 0.2);
        star.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(star);
    }

    // Rare Shooting Star Loop:
    // Runs every 30 seconds with a 40% chance to actually fire.
    setInterval(() => {
        if (Math.random() < 0.4) {
            spawnShootingStar();
        }
    }, 30000);
}