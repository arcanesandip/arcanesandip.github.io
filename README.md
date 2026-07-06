# arcanesandip.github.io

A small, self-updating portfolio site. A daily GitHub Action scans a fixed
list of pinned repos, builds a `projects.json` file with metadata and
thumbnails, and a dependency-free static frontend renders it.

Live at: https://arcanesandip.github.io

## How it works

```
builder/scanner.py  ─┐
                      ├─> projects.json  ─>  public/js/app.js  ─>  #repo-list
GitHub API + READMEs ─┘        (fetched at page load, cached in localStorage)
```

1. **`builder/scanner.py`** calls the GitHub API for the repos listed in
   `PINNED_REPOS`, pulls the first image out of each repo's README, and
   generates desktop (800×450) and mobile (400×225) WebP thumbnails. It
   also refreshes the profile picture from the GitHub avatar. Everything
   is written to `projects.json` in one atomic write (temp file + `os.replace`)
   so the file is never left half-written.
2. **A GitHub Actions workflow** (`.github/workflows/`) runs the scanner
   daily (and on manual trigger), commits any changed `projects.json` /
   thumbnails back to the branch, and deploys the repo to GitHub Pages.
3. **`index.html` + `public/js/app.js`** is the frontend. On load it
   instantly renders whatever is in `localStorage`, then fetches a fresh
   `projects.json` in the background and only re-renders if the data
   actually changed. All dynamic text is escaped before being inserted
   into the page.

Everything else — the starfield background, the ambient "zero-G" drift on
cards, the contact modal — is a small, independent ES module under
`public/js/`.

## Project structure

```
index.html                  Entry point (served from repo root)
projects.json                Generated data consumed by the frontend
builder/
  scanner.py                 GitHub scan + thumbnail generation
  requirements.txt           Python deps (requests, Pillow)
public/
  css/
    main.css                 Imports the files below + core layout
    theme.css                Design tokens (colors, spacing, type scale)
    reset.css                Standard CSS reset
    animation.css            Keyframes: loader, stars, drift, reduced-motion
    contact.css               Contact modal styles
  js/
    app.js                    Fetches projects.json, renders project cards
    stars.js                  Ambient/shooting star background
    physics.js                Random ambient drift on decorative elements
    email.js                  Contact modal open/close + Formspree submit
  assets/                     Profile pic, thumbnails, icons, favicons
.github/workflows/            Scheduled scan + deploy workflow
ARCHITECTURE.md               Deeper technical notes
CONTRIBUTORS.md               Authorship / AI-assisted workflow notes
TODO.md                       Known limitations, acknowledged as of v2.0.0
```

## Running it locally

```bash
git clone https://github.com/arcanesandip/arcanesandip.github.io.git
cd arcanesandip.github.io

pip install -r builder/requirements.txt
python3 builder/scanner.py       # regenerates projects.json + thumbnails

python3 -m http.server 8080      # serve from the repo root
# open http://localhost:8080
```

`scanner.py` works without a token, but GitHub's unauthenticated API limit
is 60 requests/hour. Set `GITHUB_TOKEN` in your environment to raise that
to 5,000/hour — the GitHub Actions workflow does this automatically using
the built-in Actions token.

> **Note:** the contact form submits silently in the background via
> `fetch`. That doesn't work when `index.html` is opened directly as a
> `file://` path (double-clicked) — you'll see a message explaining this
> in the modal. It works normally once served over `http://` or deployed.

## Configuration

Both live at the top of `builder/scanner.py`:

- `USERNAME` — the GitHub account to scan.
- `PINNED_REPOS` — list of repo names to include on the site. Only repos
  in this list are added to `projects.json`.

## Deployment

The GitHub Actions workflow runs on a daily schedule and on manual
dispatch. It regenerates `projects.json` and thumbnails, commits changes
back to the branch, and publishes the repo to GitHub Pages. No build step
is required beyond that — the site is static HTML/CSS/JS served as-is.

## Known limitations

See `TODO.md` for the full list. The notable ones:

- Thumbnails are regenerated on every scanner run, even if the source
  README image hasn't changed.
- If an individual repo's image fetch/processing fails, that repo is
  still included (just without a thumbnail) — this is an intentional
  partial-success tradeoff, not a bug.
- The contact modal animation has a known jitter on Firefox.
- `index.html`'s CSP allows `'unsafe-inline'` for scripts/styles; tightening
  this is a future hardening candidate.

## Credits

Built through an AI-assisted workflow — see `CONTRIBUTORS.md` for details
on authorship and how each collaborator (human and AI) contributed.
