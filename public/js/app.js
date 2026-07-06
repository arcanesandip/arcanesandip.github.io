/**
 * Portfolio loader
 *
 * Intent:
 * - Deterministic hydration: render cached payload immediately, then fetch
 *   a fresh `projects.json` and update only when the serialized payload
 *   has changed. This avoids unnecessary DOM churn and preserves animation
 *   stability during refreshes.
 * - Minimal, dependency-free runtime: small ES modules, no frameworks.
 * - Defensive boundaries: localStorage is treated as an optimization only
 *   (it may be unavailable in private modes or hit quota limits). If
 *   storage calls fail we fall back to an in-memory cache to avoid breaking
 *   the UI.
 *
 * Security notes:
 * - `escapeHTML()` performs a light sanitization for text fields rendered
 *   into HTML. Numeric or non-string fields are explicitly coerced before
 *   interpolation to avoid unexpected objects being injected into templates.
 */

import { initStarfield } from './stars.js';
import { applyZeroG } from './physics.js';
import { initContactModal } from './email.js';
// Initialize the background stars immediately
initStarfield();
initContactModal(); // 2. RUN IT HERE!

const portfolioContainer = document.getElementById("repo-list");
const headerImage = document.querySelector(".portfolio-header-image");
const CACHE_KEY = "arcanesandip_portfolio_cache";

// Fallback in-memory cache used if localStorage is unavailable or throws.
let memoryCache = null;

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Helper function to render the project cards to the DOM
 */
function renderProjects(projects) {
    if (!portfolioContainer) return;
    
    portfolioContainer.innerHTML = "";
    projects.forEach(project => {
        const projectCard = document.createElement("div");
        projectCard.className = "repo-card";

        // ACTIVATE PHYSICS: Each card gets its own independent random drift
        applyZeroG(projectCard);

        const safeName = escapeHTML(String(project.name || '').replace(/-/g, ' '));
        const safeDescription = escapeHTML(String(project.description || "No description provided."));
        const safeUrl = escapeHTML(String(project.url || '#'));
        const safeLanguage = escapeHTML(String(project.language || 'Code'));
        const safeMobileImage = project.images && project.images.mobile ? escapeHTML(project.images.mobile) : '';
        const safeDesktopImage = project.images && project.images.desktop ? escapeHTML(project.images.desktop) : '';
        // Coerce numeric fields to primitives to avoid accidental object interpolation
        const safeStars = Number(project.stars) || 0;

        const imageHtml = safeMobileImage && safeDesktopImage
            ? `<picture>
                <source srcset="${safeMobileImage}" media="(max-width: 768px)">
                <img src="${safeDesktopImage}" alt="${safeName} preview" class="project-img" loading="lazy">
            </picture>`
            : `<div class="no-img-placeholder"><span>No Preview Available</span></div>`;

        const tagsHtml = project.tags && project.tags.length > 0
            ? project.tags.map(tag => `<span class="tag-badge">${escapeHTML(tag)}</span>`).join("")
            : "";

        projectCard.innerHTML = `
            <div class="card-inner">
                ${imageHtml}
                <div class="card-content">
                    <div class="card-header">
                        <h3>${safeName}</h3>
                        <div class="stats">
                            <span>⭐ ${safeStars}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <a class="button no-underline my-work-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                            <span class="button-text">View my Github</span>
                            <img src="public/assets/icons/arrow-right.svg" alt="arrow" class="right-arrow-icon" loading="eager" />
                        </a>
                        <span>${safeLanguage}</span>
                    </div>
                    <div class="tags-container">${tagsHtml}</div>
                    <p class="description">${safeDescription}</p>
                </div>
            </div>
        `;
        portfolioContainer.appendChild(projectCard);
    });
}

async function loadPortfolio() {
    // 1. APPLY PHYSICS TO STATIC UI ELEMENTS (The Parallax Effect)
    
    // The Profile Image (Heaviest/Slowest)
    const headerContainer = document.getElementById("portfolio-header-image-container");
    if (headerContainer) {
        applyZeroG(headerContainer, { minDuration: 35, maxDuration: 55 });
    }

    // The Header CTA Button (Medium Speed - NEW UX FIX)
    const headerBtn = document.getElementById("header-cta-btn");
    if (headerBtn) {
        applyZeroG(headerBtn, { minDuration: 20, maxDuration: 35 });
    }

    // 2. DATA SYNCHRONIZATION LOGIC (The Brain - Unchanged from v3.2)
    
    // CHECK CACHE (Instant Load for better UX)
    // localStorage may throw in privacy modes or when quota is exceeded.
    // Use a try/catch and fall back to an in-memory cache when necessary.
    let cachedData = null;
    try {
        cachedData = localStorage.getItem(CACHE_KEY);
    } catch (err) {
        // localStorage unavailable; use in-memory cache
        cachedData = memoryCache;
    }

    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            if (headerImage && data.profile_img) {
                headerImage.src = data.profile_img;
            }
            if (data.projects) {
                renderProjects(data.projects);
            }
        } catch (e) {
            console.error("Cache corrupted, skipping...");
        }
    }

    // BACKGROUND SYNC (Fetch fresh data from your GitHub scanner bot)
    try {
        const response = await fetch("./projects.json");
        if (!response.ok) throw new Error("Network issue fetching projects.json");

        const freshData = await response.json();
        const freshDataString = JSON.stringify(freshData);

        // Only re-render if the GitHub data has actually changed
        if (freshDataString !== cachedData) {
            try {
                localStorage.setItem(CACHE_KEY, freshDataString);
            } catch (err) {
                // If localStorage is not writable, keep a memory fallback
                memoryCache = freshDataString;
            }

            if (headerImage && freshData.profile_img) {
                headerImage.src = freshData.profile_img;
            }

            if (freshData.projects) {
                renderProjects(freshData.projects);
            }

            console.log("Portfolio updated from server.");
        }
    } catch (error) {
        console.error("Portfolio Sync Error:", error);
        if (!cachedData) {
            portfolioContainer.innerHTML = `<p class="error-msg">Offline: Could not load projects.</p>`;
        }
    }
}

// Kick off the load process
loadPortfolio();
