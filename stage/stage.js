/* Glam Stage: the hero cue stack (gels, follow spot, moving beams, stretching type),
   acts that light up on scroll, gallery gel colours, menu, package shortcuts and the
   (front-end only) enquiry form. */
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

  /* ---------- Gallery: each collection has its own gel ---------- */
  const GELS = { noir: '#fff6e8', vivid: '#ff2e8b', sensual: '#ffb23f', urban: '#7cc4ff', streets: '#b69cff', arts: '#ffe2b0' };
  document.addEventListener('collectionchange', (e) => {
    doc.style.setProperty('--gel', GELS[e.detail.collection.id]);
    const t = document.querySelector('.gallery__title');
    if (!t || reduce) return;
    t.classList.remove('is-cue');
    void t.offsetWidth;
    t.classList.add('is-cue');
  });

  /* ---------- Acts light up as they reach centre stage ---------- */
  const acts = document.querySelectorAll('.act');
  if (reduce || !('IntersectionObserver' in window)) acts.forEach((a) => a.classList.add('is-lit'));
  else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.target.classList.toggle('is-lit', en.isIntersecting)),
      { rootMargin: '-38% 0px -38% 0px' }
    );
    acts.forEach((a) => io.observe(a));
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
    form.querySelector('[data-status]').textContent = `You’re on the list, ${first}. Ashley will be in touch.`;
    form.reset();
  });

  /* ---------- Hero: the cue stack ---------- */
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;

  const cues = [...stage.querySelectorAll('.cue')];
  const word = stage.querySelector('[data-word]');
  const num = stage.querySelector('[data-cue-num]');
  const steps = [...stage.querySelectorAll('.cuebar__steps li')];
  const beams = [...stage.querySelectorAll('.beam')];
  const blackout = stage.querySelector('.stage__blackout');
  const goBtn = stage.querySelector('[data-go]');
  const pauseBtn = stage.querySelector('[data-pause]');
  const RIG = [0.12, 0.5, 0.88];
  const HOLD = 3800;

  let i = 0;
  let timer = 0;
  let raf = 0;
  let paused = reduce;
  let visible = true;
  let W = 0;
  let H = 0;
  let pointer = null;
  let lastMove = -1e9;
  const S = { x: 0, y: 0 };
  const beamBase = beams.map((b) => parseFloat(getComputedStyle(b).opacity) || 0.3);

  stage.style.setProperty('--hold', `${HOLD}ms`);

  function measure() {
    const r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
  }

  function focal(k) {
    const s = cues[k].style;
    return {
      x: (W * parseFloat(s.getPropertyValue('--fx'))) / 100,
      y: (H * parseFloat(s.getPropertyValue('--fy'))) / 100,
    };
  }

  function tick(now) {
    raf = 0;
    const t = now / 1000;
    const f = focal(i);
    let tx = f.x + Math.sin(t * 0.7) * W * 0.012;
    let ty = f.y + Math.cos(t * 0.9) * H * 0.01;
    if (pointer && now - lastMove < 3000) {
      tx += (pointer.x - tx) * 0.22;
      ty += (pointer.y - ty) * 0.22;
    }
    const k = reduce ? 1 : 0.07;
    S.x += (tx - S.x) * k;
    S.y += (ty - S.y) * k;
    stage.style.setProperty('--sx', `${S.x.toFixed(1)}px`);
    stage.style.setProperty('--sy', `${S.y.toFixed(1)}px`);
    beams.forEach((b, n) => {
      const sx = W * RIG[n];
      const sy = -0.04 * H;
      const ax = S.x + (n - 1) * W * 0.025;
      const a = (-Math.atan2(ax - sx, S.y - sy) * 180) / Math.PI;
      b.style.setProperty('--a', `${a.toFixed(2)}deg`);
    });
    if (visible) raf = requestAnimationFrame(tick);
  }
  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function fit() {
    word.style.fontSize = '';
    const avail = word.parentElement.clientWidth;
    const w = word.scrollWidth;
    if (w > avail) word.style.fontSize = `${(parseFloat(getComputedStyle(word).fontSize) * avail * 0.98) / w}px`;
  }

  function lightsUp() {
    if (reduce) return;
    word.animate(
      [
        { fontStretch: '50%', fontWeight: 200, opacity: 0, letterSpacing: '0.14em' },
        { opacity: 1, offset: 0.3 },
        { fontStretch: '112%', fontWeight: 850, opacity: 1, letterSpacing: '-0.035em' },
      ],
      { duration: 950, easing: 'cubic-bezier(.2,.9,.2,1)' }
    );
    stage.animate([{ '--sr': 0.15 }, { '--sr': 1.08, offset: 0.7 }, { '--sr': 1 }], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' });
    beams.forEach((b, n) =>
      b.animate(
        [
          { opacity: 0 },
          { opacity: beamBase[n] * 1.6, offset: 0.22 },
          { opacity: beamBase[n] * 0.2, offset: 0.36 },
          { opacity: beamBase[n] * 1.3, offset: 0.55 },
          { opacity: beamBase[n] },
        ],
        { duration: 650, delay: n * 110 }
      )
    );
  }

  function apply(k) {
    const next = cues[k];
    cues[i].classList.remove('is-active');
    next.classList.add('is-active');
    i = k;
    const gel = next.dataset.gel;
    stage.classList.toggle('is-open', !gel);
    stage.style.setProperty('--gel', gel || '#fff6e8');
    word.textContent = next.dataset.label;
    fit();
    num.textContent = String(k + 1);
    steps.forEach((s, n) => {
      s.classList.toggle('is-done', n < k);
      s.classList.remove('is-now');
    });
    void steps[k].offsetWidth;
    steps[k].classList.add('is-now');
    lightsUp();
  }

  function cue(k) {
    clearTimeout(timer);
    const img = cues[k].querySelector('img');
    promote(img);
    const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    ready.then(() => {
      if (reduce) {
        apply(k);
        schedule();
        return;
      }
      blackout.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, easing: 'ease-in' }).onfinish = () => {
        apply(k);
        blackout.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease-out' });
        schedule();
      };
    });
  }

  function schedule() {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => {
      if (visible && !document.hidden) cue((i + 1) % cues.length);
      else schedule();
    }, HOLD);
  }

  function setPaused(p) {
    paused = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.textContent = p ? 'Play' : 'Pause';
    stage.classList.toggle('is-paused', p);
    if (p) clearTimeout(timer);
    else {
      steps[i].classList.remove('is-now');
      void steps[i].offsetWidth;
      steps[i].classList.add('is-now');
      schedule();
    }
  }

  goBtn.addEventListener('click', () => cue((i + 1) % cues.length));
  pauseBtn.addEventListener('click', () => setPaused(!paused));

  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    lastMove = performance.now();
  });
  stage.addEventListener('pointerleave', () => {
    lastMove = -1e9;
  });

  measure();
  const f0 = focal(0);
  S.x = f0.x;
  S.y = f0.y;

  requestAnimationFrame(() => {
    stage.classList.add('is-live');
    apply(0);
    if (!reduce) blackout.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: 'ease-out' });
    if (reduce) setPaused(true);
    else schedule();
  });
  start();

  document.fonts?.ready.then(fit);
  addEventListener('resize', () => {
    measure();
    fit();
  });
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) start();
  }).observe(stage);

  const warm = () => cues.forEach((c) => promote(c.querySelector('img')));
  if (document.readyState === 'complete') setTimeout(warm, 500);
  else addEventListener('load', () => setTimeout(warm, 500), { once: true });
})();
