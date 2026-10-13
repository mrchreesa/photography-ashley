# Ashley Meerloo: two website directions (demo)

Front-end only. Plain HTML, CSS and JS with no framework, no build step needed to view, and no backend (the enquiry forms show a confirmation but send nothing).

| Page | What it is |
| --- | --- |
| `index.html` | Cover page for the pitch: both directions side by side |
| `darkroom/` | **A, Darkroom.** Portraits develop out of black under an amber safelight; the cursor (or a finger) is the light |
| `darkroom/gallery.html` | Six collections, lightbox, `#noir` / `#vivid` / … deep links |
| `stage/` | **B, Glam Stage.** A lighting cue stack spells out “the perfect collision of light, mood, shadow, space, emotion and story” in stage-gel colours |
| `stage/gallery.html` | Same collections and lightbox, lit per collection |

## Run it

Use any static server from this folder, for example:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. Double-clicking `index.html` also works.

## Images

All photos are the client’s own, taken from portrait-images.com and re-encoded as WebP at 480 / 960 / 1600 (and 2200 for hero shots) with a 20px blur-up placeholder inlined. Pages use `srcset`/`sizes`, lazy loading below the fold, a preloaded hero, and deferred hero rotations, so a phone’s first view is roughly 100–170 KB of images.

`_tools/build.py` turns any `<img data-photo="slug">` into the full responsive markup and regenerates `shared/photos.js`. Re-run it after editing a page:

```bash
python3 _tools/build.py
```

## Link previews (WhatsApp, iMessage, socials)

Every page has Open Graph tags and a 1200×630 share card in `shared/og/` (render them again with `_tools/make_og.sh`). WhatsApp only shows the card when `og:image` is an **absolute** URL, so once the demo has a home, run:

```bash
SITE_URL=https://your-host.example/path/ python3 _tools/build.py
```

All pages carry `noindex` so the demo never competes with the live site in search.
