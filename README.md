# ⚡ THE LAST PORTFOLIO

A low-maintenance, automation-first portfolio stack. A scheduled GitHub Actions container handles backend ingestion, 'builder/scanner.py' generates repository data matrices atomically, and 'public/js/app.js' hydrates the frontend page with native HTML escaping.

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
