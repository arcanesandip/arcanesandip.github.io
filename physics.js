/**
 * Physics Module (v1.0)
 * Handles ambient Zero-G drift for UI elements.
 */

export function applyZeroG(element, customOptions = {}) {
    if (!element) return;

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