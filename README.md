# ⚡ THE LAST PORTFOLIO

A low-maintenance, automation-first portfolio stack. A scheduled GitHub Actions container handles backend ingestion, 'builder/scanner.py' generates repository data matrices atomically, and 'public/js/app.js' hydrates the frontend page with native HTML escaping.

## Release v2.0.0

The system is production-hardened with a resilient partial-success model: recoverable asset processing failures are isolated, the frontend remains deterministic, and the automation pipeline preserves atomic payload delivery.

---

## 📊 Engineering Standards

This project demonstrates professional-grade system design across four critical dimensions:

**Performance:** Achieves 100/100 across all Lighthouse categories (Performance, Accessibility, Best Practices, SEO). Core metrics: 0ms Total Blocking Time (TBT), 0 Cumulative Layout Shift (CLS), optimized for single-digit millisecond interactions.

**Security:** Hardened with Content Security Policy (CSP) to prevent XSS injection, HTTP Strict Transport Security (HSTS) to enforce TLS, Cross-Origin-Opener-Policy (COOP) to isolate browsing contexts, and Trusted Types to enforce HTML escaping at the type-system level.

**Automation:** Minimal operational overhead through a custom Python scanner and GitHub Actions pipeline that maintains repository metadata synchronization in real-time. Atomic file operations prevent corruption during network failures or interrupted deployments.

**Stability:** Platform-agnostic viewport optimization using CSS `scrollbar-gutter` to prevent layout reflow and `100dvh` units for consistent iOS/WebKit rendering during address-bar resize events. Zero-dependency frontend ensures durability across browser versions.

---

## 🏗️ Systems Design

- **Automated Ingestion:** 'builder/scanner.py' serves as the primary automated pipeline. It aggregates repository telemetry, extracts language statistics, and dynamically pulls asset pins.
- **Atomic Storage Swaps:** To prevent file truncation or corruption during network drops, the data script writes payloads to a localized temporary scratchpad file before executing a secure file swap ('os.replace') into production.
- **Native Browser Hydration:** 'public/js/app.js' consumes 'projects.json' asynchronously, runs a localized 'localStorage' cache routine, and sanitizes dynamic strings via 'escapeHTML()' before injecting them into the DOM.

---

## 🧪 Local Laboratory Setup

To execute the data ingestion pipeline and test the presentation layout locally:

```bash
# Clone the workspace architecture
git clone [https://github.com/arcanesandip/arcanesandip.github.io.git](https://github.com/arcanesandip/arcanesandip.github.io.git)
cd arcanesandip.github.io

# Install lightweight backend dependencies 
pip install -r builder/requirements.txt

# Run the ingestion script from the root directory path
python3 builder/scanner.py

# Launch the native python local server hook
python3 -m http.server 8080
```
