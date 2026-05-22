# ARCHITECTURE

## 1. UNIFIED EXECUTION LAYOUT

```text
builder/scanner.py
  ├─ fetch GitHub repo list (unauthenticated REST v3)
  │     GET https://api.github.com/users/arcanesandip/repos
  │
  ├─ for each pinned repo
  │     ├─ fetch README content from raw.githubusercontent.com
  │     ├─ parse markdown/img tags for first image URL
  │     ├─ download image + convert/resize to WebP
  │     └─ collect metadata fields
  │
  ├─ assemble payload {
  │       profile_img,
  │       projects: [ { name, description, url, stars, language, tags, images }, ... ]
  │     }
  │
  ├─ write JSON atomically:
  │     temp = NamedTemporaryFile(dir=repo_root, suffix='.tmp')
  │     json.dump(output, temp)
  │     fsync(temp)
  │     os.replace(temp, projects.json)
  │
  └─ result: projects.json

public/js/app.js
  ├─ read cached payload from localStorage
  │     try {
  │       parse JSON
  │       hydrate profile image + project cards
  │     } catch {
  │       ignore bad cache
  │     }
  │
  ├─ fetch fresh ./projects.json
  │     if ok -> parse JSON -> compare against cache
  │     if changed -> write cache + rerender
  │     if fail and no cache -> render offline error state
  │
  └─ renderProjects(projects)
         uses escapeHTML() for dynamic repo text
         builds DOM via innerHTML with sanitized strings
```

## 2. FAIL (Defensive Isolation & Robustness Boundaries)

### Automation error boundaries
- **Primary origin:** `scanner.py` GitHub repo fetch.
- **Failure modes:** network timeout, DNS failure, API 403, malformed JSON, missing repo schema.
- **Current defensive behavior:** `try/except RequestException` catches transport failures. Non-OK HTTP responses print a message and return before JSON processing.
- **Gap identified:** the implementation currently does not call `sys.exit(1)` on fatal pipeline failures. Without explicit process abort, the workflow may continue with stale assets or leave `public/assets` updated while `projects.json` remains stale.
- **Operational model:** `v2.0.0` embraces a resilient partial-success model for asset processing: non-critical image fetch/resizing failures are tolerated and logged, while the main data payload remains available.
- **Recommended hard boundary:** on any fatal branch-level failure after image processing begins, call `sys.exit(1)` before asset mutation to prevent out-of-sync state.

### LocalStorage sandboxing
- **Intended isolation:** `localStorage` access must be wrapped in `try/catch` because Safari Private Browsing and restrictive environments can throw on read/write.
- **Current implementation:** only the `JSON.parse` path is guarded. `localStorage.getItem(CACHE_KEY)` and `localStorage.setItem(CACHE_KEY, freshDataString)` are not fully sandboxed.
- **Exact failure trap:** if `getItem` throws, the page will fail before rendering any fallback state.

### XSS neutralization
- **Current mitigation:** `escapeHTML()` normalizes `&`, `<`, `>`, `"`, and `'` on repository strings.
- **Scope:** applied to `project.name`, `project.description`, `project.url`, `project.language`, image URLs, and tag text.
- **Remaining risk:** dynamic numeric or object fields like `project.stars` are still interpolated without explicit coercion; a malformed repo object could still produce unexpected page layout content.

### Runtime recovery
- **Cache fallback:** if `projects.json` fetch fails and cached payload exists, the UI retains stale content.
- **Offline state:** if no cache exists, the UI writes `<p class="error-msg">Offline: Could not load projects.</p>`.
- **Edge-case gap:** blank `projects.json` or corrupted JSON triggers the catch block, but the code does not distinguish between unreachable service and invalid payload; the error state remains generic.

## 3. SCALE (Structural Bounds & Computational Metrics)

### Ingestion Calls
| Component | Current Bound | Limit | Notes |
|---|---|---|---|
| GitHub repo list | single unauthenticated call | 60 requests/hour | unauthenticated REST v3 limit; if GH_TOKEN is added, limit becomes 5,000 requests/hour per token |
| README fetch loop | up to 2 requests per pinned repo | depends on `PINNED_REPOS` size | with 10 repos, up to 20 README fetches; at 100 repos, 200 README fetches; unauthenticated limit is the bottleneck |
| image downloads | 0-2 downloads per pinned repo | network+CPU bound | full image decode/resize for every run; this scales poorly with repo count |

### Array Rendering
- **Current cost profile:** `renderProjects()` iterates linearly over `projects` and executes `projectCard.innerHTML = ...` for each item.
- **DOM overhead:** O(n) node creation plus O(n) string concatenation. With 100+ items, browser layout and paint cost becomes significant.
- **Layout thrash points:** each appended card can force reflow if CSS is not fully computed prior to insertion. Using a `DocumentFragment` or batching inserts is recommended for >20 cards.

### Data Footprint constraints
| Payload | Current Size | Growth risk | Recommendation |
|---|---|---|---|
| `projects.json` | few KB for 3 repos | can exceed MB if descriptions or tag arrays grow | limit repo descriptions to 512 chars; avoid embedding large image payloads directly |
| Cached JSON | browser localStorage | browser quota varies by origin | guard `setItem` with quota catch; degrade to memory-only fallback if full |
| Image assets | WebP thumbnails | CPU-heavy resize for each pipeline run | cache generated thumbnails and skip reprocessing if source unchanged |

## 4. AGE (Long-Term Structural Durability & Code Decay)

### REST API v3 fragility
- **Critical keys:** `name`, `html_url`, `stargazers_count`, `language`, `topics`, `description`.
- **Durable assumption:** GitHub v3 currently returns these keys for public repos.
- **Fragility vector:** changes to default branch names, repo default branch detection, or deprecation of raw.githubusercontent.com paths.
- **Hard requirement:** if GitHub shifts API versions, verify endpoint contracts and update fetch logic to use explicit `application/vnd.github.v3+json` headers or migrate to GraphQL/
  newer REST versions.

### Zero-dependency frontend durability
- **Confirmed:** `public/js` uses only native ES modules plus browser DOM APIs.
- **Language assumptions:** `fetch`, `localStorage`, `classList`, `style.setProperty`, `document.createElement`, `import` modules.
- **Zero-dependency risk:** browser privacy modes may break `localStorage`; this is a compatibility risk, not a library risk.
- **Future check:** if browser engines remove inline module support or private browsing semantics change, validate that only these native APIs are used.

### Operational durability
- `requirements.txt` pins runtime versions but does not pin file hashes.
- `update_data.yml` uses tagged actions (`@v4`, `@v5`) which is stable, but action behavior can still shift.
- `index.html` still contains `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`, which adds long-term maintenance debt for CSP hardening.

## Summary
This document defines the current architecture as a simple producer/consumer pipeline with an automated ingestion engine, an atomic JSON drop target, and a vanilla browser hydration layer. The most material weaknesses are:
- incomplete hard process aborts in `builder/scanner.py`
- partial localStorage sandboxing in `public/js/app.js`
- guest-rendering scale risks when repo arrays grow beyond tens of entries
- future API decay risk in hard-coded GitHub REST schema keys
