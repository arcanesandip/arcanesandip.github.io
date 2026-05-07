/**
 * Portfolio Loader (v2.0 - High Performance)
 * Features: LocalStorage caching, Background sync, and Hero image injection.
 */

const portfolioContainer = document.getElementById("repo-list");
const headerImage = document.querySelector(".portfolio-header-image");
const CACHE_KEY = "arcanesandip_portfolio_cache";

/**
 * Helper function to render the project cards to the DOM
 */
function renderProjects(projects) {
    if (!portfolioContainer) return;
    
    portfolioContainer.innerHTML = "";
    projects.forEach(project => {
        const projectCard = document.createElement("div");
        projectCard.className = "repo-card";

        const imageHtml = project.image 
            ? `<img src="${project.image}" alt="${project.name} preview" class="project-img" loading="lazy">`
            : `<div class="no-img-placeholder"><span>No Preview Available</span></div>`;

        const tagsHtml = project.tags && project.tags.length > 0
            ? project.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join("")
            : "";

        projectCard.innerHTML = `
            <div class="card-inner">
                ${imageHtml}
                <div class="card-content">
                    <div class="card-header">
                        <h3>${project.name.replace(/-/g, ' ')}</h3>
                        <div class="stats">
                            <span>⭐ ${project.stars}</span>     
                        </div>
                    </div>
                    <div class="card-footer">
                        <a class="button no-underline" id="my-work-link" href="${project.url}" target="_blank">
                            <span class="button-text">View my Github</span>
                            <img src="/arrow-right.svg" alt="arrow" class="right-arrow-icon" loading="eager" />
                        </a>
                        <span>${project.language || 'Code'}</span>
                    </div>
                    <div class="tags-container">${tagsHtml}</div>
                    <p class="description">${project.description || "No description provided."}</p>
                </div>
            </div>
        `;
        portfolioContainer.appendChild(projectCard);
    });
}

async function loadPortfolio() {
    // 1. SET HERO IMAGE (Fastest execution)
    if (headerImage) {
        headerImage.src = `https://github.com/arcanesandip.png`;
    }

    // 2. CHECK CACHE (Instant Load)
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            renderProjects(JSON.parse(cachedData));
        } catch (e) {
            console.error("Cache corrupted, skipping...");
        }
    }

    // 3. BACKGROUND SYNC (Check for updates from the GitHub Bot)
    try {
        const response = await fetch("./projects.json");
        if (!response.ok) throw new Error("Network issue fetching projects.json");

        const freshProjects = await response.json();
        const freshDataString = JSON.stringify(freshProjects);

        // Only re-render and update cache if the data has actually changed
        if (freshDataString !== cachedData) {
            localStorage.setItem(CACHE_KEY, freshDataString);
            renderProjects(freshProjects);
            console.log("Portfolio updated from server.");
        }
    } catch (error) {
        console.error("Portfolio Sync Error:", error);
        // If no cache exists and fetch fails, show error
        if (!cachedData) {
            portfolioContainer.innerHTML = `<p class="error-msg">Offline: Could not load projects.</p>`;
        }
    }
}

// Kick off the load process
loadPortfolio();