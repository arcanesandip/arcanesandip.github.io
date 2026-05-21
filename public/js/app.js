/**
 * Portfolio Loader (v3.3 - High Performance with Zero-G Physics)
 * Features: LocalStorage caching, Background sync, and Ambient Drift Parallax.
 * Change log: Grounded text titles, added drifting CTA button for UX.
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

// FAIL: unescaped repo metadata injected into innerHTML can create XSS vectors if projects.json is tampered with.
// SCALE: simple text escaping is efficient for a handful of cards; if render payloads grow, move to DOM textContent construction.
// AGE: regex-based escaping is sufficient for plaintext fields today, but replace with a dedicated sanitizer if template rendering changes.
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

        const safeName = escapeHTML(project.name.replace(/-/g, ' '));
        const safeDescription = escapeHTML(project.description || "No description provided.");
        const safeUrl = escapeHTML(project.url);
        const safeLanguage = escapeHTML(project.language || 'Code');
        const safeMobileImage = project.images && project.images.mobile ? escapeHTML(project.images.mobile) : '';
        const safeDesktopImage = project.images && project.images.desktop ? escapeHTML(project.images.desktop) : '';

        const imageHtml = safeMobileImage && safeDesktopImage
            ? `<picture>
                <source srcset="${safeMobileImage}" media="(max-width: 768px)">
                <img src="${safeDesktopImage}" alt="${safeName} preview" class="project-img" loading="lazy">
            </picture>`
            : `<div class="no-img-placeholder"><span>No Preview Available</span></div>`;

        const tagsHtml = project.tags && project.tags.length > 0
            ? project.tags.map(tag => `<span class="tag-badge">${escapeHTML(tag)}</span>`).join("")
            : "";

        // FAIL: this innerHTML block assumes the escaped strings are valid HTML-safe text.
        // SCALE: current card rendering is fine for <100 entries; if the repo list expands, replace with createElement/textContent to avoid large DOM string concatenation.
        // AGE: maintain this block if HTML template structure stays static; if markup changes, revalidate escape coverage for new injected fields.
        projectCard.innerHTML = `
            <div class="card-inner">
                ${imageHtml}
                <div class="card-content">
                    <div class="card-header">
                        <h3>${safeName}</h3>
                        <div class="stats">
                            <span>⭐ ${project.stars}</span>     
                        </div>
                    </div>
                    <div class="card-footer">
                        <a class="button no-underline" id="my-work-link" href="${safeUrl}" target="_blank">
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
    const cachedData = localStorage.getItem(CACHE_KEY);
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
            localStorage.setItem(CACHE_KEY, freshDataString);
            
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
loadPortfolio();// terminal test