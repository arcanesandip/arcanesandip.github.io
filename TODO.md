# TODO / Technical Debt

This repository is now released as `v2.0.0` and the core pipeline is frozen for this version. The following items are acknowledged technical debt for future release cycles.

- `builder/scanner.py`: image reprocessing is unconditional on every run. Add content hashing or source-change detection to avoid repeated thumbnail downloads and conversion.
- `builder/scanner.py`: partial image-processing failures are currently tolerated; the payload is still emitted even when individual assets fail. This is intentional for v2.0.0, but the strict abort boundary remains an improvement candidate.
- `public/js/app.js`: schema validation is lightweight. A future stability layer should normalize `projects.json` before rendering and ensure malformed objects cannot crash `renderProjects()`.
- `public/js/app.js`: `localStorage` caching is defensive, but the system still assumes a valid `projects.json` shape. An explicit front-end validation step would harden this further.
- `index.html`: CSP contains `'unsafe-inline'`. Tightening the inline script/content policy is important for future security-hardening releases.
- `README.md` / `ARCHITECTURE.md`: operational claims should be revisited if the automation pipeline changes or if new GitHub API rate-limit behavior emerges.

- **Browser Compatibility (Firefox/Gecko)**: Contact popup animation jitter. Acknowledged as a potential GPU-layer or dynamic viewport (dvh) reflow issue. Future polish candidate: investigate 'will-change' stabilization or static fallback for non-WebKit engines.
