/* Darkroom: hero light + developing plates, journey frames, prints developing into view,
   mobile menu, package shortcuts and the (front-end only) enquiry form. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const promote = (img) => {
    if (!img || !img.dataset.srcset) return;
    img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    delete img.dataset.srcset;
    delete img.dataset.src;
  };

  /* ---------- Header + menu ---------- */
  const header = document.querySelector('[data-header]');
  const menuBtn = document.querySelector('[data-menu-btn]');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    doc.style.overflow = open ? 'hidden' : '';
  };
  menuBtn?.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  header.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  requestAnimationFrame(() => doc.classList.add('is-ready'));

  /* ---------- Prints develop as they enter the viewport ---------- */
  const developables = document.querySelectorAll('.develop');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          const img = el.tagName === 'IMG' ? el : el.querySelector('img');
          const go = () => el.classList.add('is-developed');
          if (img.complete && img.naturalWidth) go();
          else {
            img.addEventListener('load', go, { once: true });
            img.addEventListener('error', go, { once: true });
          }
          io.unobserve(el);
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    developables.forEach((el) => io.observe(el));
  } else {
    developables.forEach((el) => el.classList.add('is-developed'));
  }

  /* ---------- Journey: sticky frame follows the step in view ---------- */
  const frames = [...document.querySelectorAll('.journey__frame img')];
  if (frames.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const i = +en.target.dataset.step;
          frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
        }),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    document.querySelectorAll('.step').forEach((s) => so.observe(s));
  }

  /* ---------- Packages + form ---------- */
  const select = document.querySelector('[data-package-select]');
  document.querySelectorAll('[data-package]').forEach((a) =>
    a.addEventListener('click', () => {
      if (select) select.value = a.dataset.package;
    })
  );

  const form = document.querySelector('[data-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const first = form.elements.namedItem('name').value.trim().split(/\s+/)[0];
    form.querySelector('[data-status]').textContent = `Thank you, ${first}. Your idea is on its way to Ashley.`;
    form.reset();
  });

  /* ---------- Hero: a light in the darkroom ---------- */
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const stage = hero.querySelector('[data-stage]');
  const plates = [...hero.querySelectorAll('[data-plate]')];
  const lits = [...hero.querySelectorAll('.lit')];
  const caption = hero.querySelector('[data-caption]');
  const hint = hero.querySelector('[data-hint]');

  const L = { x: 0, y: 0, r: 0, tr: 0 };
  let active = 0;
  let W = 0;
  let H = 0;
  let stageX = 0;
  let stageY = 0;
  let litBoxes = [];
  let pointer = null;
  let lastMove = -1e9;
  let visible = true;
  let raf = 0;
  let timer = 0;

  function measure() {
    const hr = hero.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    stageX = sr.left - hr.left;
    stageY = sr.top - hr.top;
    W = sr.width;
    H = sr.height;
    litBoxes = lits.map((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.left - hr.left, y: b.top - hr.top };
    });
  }

  const radius = () => Math.max(W, H) * (W < 700 ? 0.42 : 0.36);

  function focal(i) {
    const s = plates[i].style;
    return {
      x: stageX + (W * parseFloat(s.getPropertyValue('--fx'))) / 100,
      y: stageY + (H * parseFloat(s.getPropertyValue('--fy'))) / 100,
    };
  }

  function tick(now) {
    raf = 0;
    const t = now / 1000;
    const live = pointer && now - lastMove < 3500;
    const f = focal(active);
    const drift = reduce ? 0 : 1;
    const tx = live ? pointer.x : f.x + Math.sin(t * 0.6) * W * 0.045 * drift;
    const ty = live ? pointer.y : f.y + Math.cos(t * 0.45) * H * 0.035 * drift;
    const k = reduce ? 1 : live ? 0.16 : 0.035;
    L.x += (tx - L.x) * k;
    L.y += (ty - L.y) * k;
    L.r += (L.tr - L.r) * (reduce ? 1 : 0.055);
    const r = L.r * (1 + Math.sin(t * 1.3) * 0.015 * drift);

    stage.style.setProperty('--lx', `${(L.x - stageX).toFixed(1)}px`);
    stage.style.setProperty('--ly', `${(L.y - stageY).toFixed(1)}px`);
    stage.style.setProperty('--r', `${r.toFixed(1)}px`);
    lits.forEach((el, i) => {
      const b = litBoxes[i];
      el.style.setProperty('--tx', `${(L.x - b.x).toFixed(1)}px`);
      el.style.setProperty('--ty', `${(L.y - b.y).toFixed(1)}px`);
      el.style.setProperty('--tr', `${r.toFixed(1)}px`);
    });
    if (visible) raf = requestAnimationFrame(tick);
  }

  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function onPointer(e) {
    const hr = hero.getBoundingClientRect();
    pointer = { x: e.clientX - hr.left, y: e.clientY - hr.top };
    lastMove = performance.now();
    hint?.classList.add('is-dismissed');
  }
  hero.addEventListener('pointermove', onPointer);
  hero.addEventListener('pointerdown', onPointer);
  hero.addEventListener('pointerleave', () => {
    lastMove = -1e9;
  });

  /* Swap plates: the light closes, the next print develops, the light opens on the new face. */
  function develop(i, first = false) {
    const next = plates[i];
    const img = next.querySelector('img');
    promote(img);
    if (!first) L.tr = 0;
    const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    ready.then(() =>
      setTimeout(
        () => {
          const prev = plates[active];
          if (prev !== next) {
            prev.classList.remove('is-active');
            prev.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease' });
          }
          next.classList.add('is-active');
          img.animate(
            [
              { opacity: 0, filter: 'brightness(0.1) contrast(2) blur(4px)' },
              { opacity: 1, offset: 0.25 },
              { filter: 'brightness(1.14) contrast(1.15) blur(0px)', offset: 0.7 },
              { opacity: 1, filter: 'brightness(1) contrast(1) blur(0px)' },
            ],
            { duration: 2600, easing: 'cubic-bezier(.3,0,.2,1)' }
          );
          active = i;
          if (caption) caption.textContent = next.dataset.name;
          setTimeout(() => {
            L.tr = radius();
          }, first ? 350 : 550);
        },
        first ? 0 : 900
      )
    );
  }

  let paused = false;
  const pauseBtn = hero.querySelector('[data-pause]');
  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    if (paused) clearTimeout(timer);
    else schedule();
  });

  function schedule() {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => {
      if (visible && !document.hidden) develop((active + 1) % plates.length);
      schedule();
    }, 7200);
  }

  measure();
  const f0 = focal(0);
  L.x = f0.x;
  L.y = f0.y;

  if (reduce) {
    L.r = L.tr = radius();
    hero.classList.add('is-in');
    if (pauseBtn) pauseBtn.hidden = true;
    start();
  } else {
    requestAnimationFrame(() => {
      hero.classList.add('is-in');
      develop(0, true);
    });
    start();
    schedule();
  }

  setTimeout(measure, 2600);
  document.fonts?.ready.then(measure);
  addEventListener('resize', () => {
    measure();
    if (L.tr) L.tr = radius();
  });

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) start();
  }).observe(hero);

  const warm = () => plates.forEach((p) => promote(p.querySelector('img')));
  if (document.readyState === 'complete') setTimeout(warm, 600);
  else addEventListener('load', () => setTimeout(warm, 600), { once: true });
})();
