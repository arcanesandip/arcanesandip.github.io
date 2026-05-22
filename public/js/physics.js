/**
 * Physics Module
 *
 * Adds a subtle, long-running ambient drift to decorative UI elements. The
 * animation is implemented in CSS (keyframes) and this helper assigns
 * randomized CSS variables per element so the motion appears organic.
 *
 * Accessibility / performance notes:
 * - Respects `prefers-reduced-motion: reduce` by opting out of assigning
 *   the animation class when the user requests reduced motion.
 * - Uses CSS variables so the animation stays GPU-friendly and composited.
 */
export function applyZeroG(element, customOptions = {}) {
    if (!element) return;

    // Honor reduced motion preferences early and do not attach animations.
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Default configuration for a subtle drift
    const defaults = {
        minDuration: 18,
        maxDuration: 28,
        delayRange: -20
    };

    const options = { ...defaults, ...customOptions };

    // Generate unique physics values
    const duration = (Math.random() * (options.maxDuration - options.minDuration) + options.minDuration).toFixed(2) + "s";
    const delay = (Math.random() * options.delayRange).toFixed(2) + "s";

    // Inject the class and variables
    element.classList.add("floating-element");
    element.style.setProperty('--float-duration', duration);
    element.style.setProperty('--float-delay', delay);
}