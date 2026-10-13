/* Shared gallery: collection tabs, photo grid and lightbox.
   Markup hooks live in each variant's gallery.html; each variant styles them.
   Emits `collectionchange` and `lightboxchange` on document so a variant can add its own motion. */
(() => {
  const root = document.querySelector('[data-gallery]');
  if (!root) return;

  const base = root.dataset.base || '../';
  const sizes = root.dataset.sizes || '(min-width: 1100px) 31vw, (min-width: 640px) 46vw, 48vw';
  const C = window.COLLECTIONS;
  const P = window.PHOTOS;
  const $ = (s, el = root) => el.querySelector(s);

  const tabs = $('[data-tabs]');
  const grid = $('[data-grid]');
  const title = $('[data-title]');
  const quote = $('[data-quote]');
  const quoteBy = $('[data-quote-by]');
  const count = $('[data-count]');

  const lb = document.querySelector('[data-lightbox]');
  const lbImg = lb.querySelector('[data-lb-img]');
  const lbCap = lb.querySelector('[data-lb-cap]');
  const lbCount = lb.querySelector('[data-lb-count]');

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const srcset = (p) => p.s.map(([label, w]) => `${base}shared/img/${p.slug}-${label}.webp ${w}w`).join(', ');
  const label = (p, want) => (p.s.find(([l]) => l === want) || p.s[p.s.length - 1])[0];
  const src = (p, want = 960) => `${base}shared/img/${p.slug}-${label(p, want)}.webp`;

  let current = [];
  let index = 0;
  let collection = null;

  tabs.innerHTML = C.map((c) => `<a class="g-tab" href="#${c.id}" data-id="${c.id}">${c.name}</a>`).join('');

  function markLoaded(img) {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener('load', done, { once: true });
  }

  function show(id, initial = false) {
    const col = C.find((c) => c.id === id) || C[0];
    if (collection === col.id) return;
    collection = col.id;
    current = P.filter((p) => p.c === col.id);

    tabs.querySelectorAll('.g-tab').forEach((t) => {
      if (t.dataset.id === col.id) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (title) title.textContent = col.name;
    if (quote) quote.textContent = `“${col.quote}”`;
    if (quoteBy) quoteBy.textContent = col.by;
    if (count) count.textContent = `${current.length} photographs`;
    document.title = `${col.name} | ${document.title.split(' | ').pop()}`;

    grid.innerHTML = current
      .map(
        (p, i) => `<li class="g-item" style="--i:${i}">
  <button class="g-tile" type="button" data-i="${i}" aria-label="View larger: ${esc(p.alt)}">
    <img src="${src(p)}" srcset="${srcset(p)}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}"
      loading="${i < 4 ? 'eager' : 'lazy'}" ${i < 2 ? 'fetchpriority="high"' : ''} decoding="async"
      style="background:${p.bg} url(${p.lqip}) center/cover no-repeat">
  </button>
</li>`
      )
      .join('');
    grid.querySelectorAll('img').forEach(markLoaded);
    document.dispatchEvent(new CustomEvent('collectionchange', { detail: { collection: col, initial } }));
  }

  grid.addEventListener('click', (e) => {
    const tile = e.target.closest('.g-tile');
    if (tile) open(+tile.dataset.i);
  });

  function preload(i) {
    const p = current[(i + current.length) % current.length];
    const img = new Image();
    img.sizes = '100vw';
    img.srcset = srcset(p);
  }

  function render() {
    const p = current[index];
    lbImg.classList.remove('is-loaded');
    lbImg.removeAttribute('srcset');
    lbImg.style.background = `${p.bg} url(${p.lqip}) center/contain no-repeat`;
    lbImg.width = p.w;
    lbImg.height = p.h;
    lbImg.sizes = '(min-width: 900px) 80vw, 100vw';
    lbImg.srcset = srcset(p);
    lbImg.src = src(p, 1600);
    lbImg.alt = p.alt;
    markLoaded(lbImg);
    lbCap.textContent = p.alt;
    lbCount.textContent = `${index + 1} of ${current.length}`;
    preload(index + 1);
    preload(index - 1);
    document.dispatchEvent(new CustomEvent('lightboxchange', { detail: { photo: p, index } }));
  }

  function open(i) {
    index = i;
    render();
    if (!lb.open) lb.showModal();
    document.documentElement.classList.add('lb-open');
  }

  function step(d) {
    index = (index + d + current.length) % current.length;
    render();
  }

  lb.addEventListener('close', () => document.documentElement.classList.remove('lb-open'));
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => step(-1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => step(1));
  lb.querySelector('[data-lb-close]').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => {
    if (e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // Swipe between photos on touch screens.
  let sx = null;
  let sy = null;
  lb.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') {
      sx = e.clientX;
      sy = e.clientY;
    }
  });
  lb.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });

  addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1), true);
})();
