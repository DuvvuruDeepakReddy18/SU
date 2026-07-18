/* ============================================================
   SKILLVERIFY — FUSION v2 engine
   The 3D film is a FIXED, full-page-scroll-scrubbed BACKGROUND.
   Lenis · pinned phone swap · marquee/counters/FAQ · cursor
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.12, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis; window.__ST = ScrollTrigger;
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.3 });
    else target.scrollIntoView();
  });
});

/* ------------------------------------------------------------
   Living film background — fixed canvas, scrubbed by full-page scroll
   ------------------------------------------------------------ */
const FILM_N = 360;
const frames = new Array(FILM_N);
const frameSrc = (i) => `/landing/frames/frame_${String(i).padStart(3, '0')}.webp`;
function loadFrame(i, cb) {
  if (frames[i]) { cb && cb(); return; }
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => { frames[i] = img; cb && cb(); };
  img.onerror = () => { cb && cb(); };
  img.src = frameSrc(i);
}
function nearestFrame(i) {
  i = Math.max(0, Math.min(FILM_N - 1, Math.round(i)));
  if (frames[i]) return frames[i];
  for (let d = 1; d < FILM_N; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return null;
}
const filmCanvas = document.getElementById('filmCanvas');
const fctx = filmCanvas.getContext('2d');
let filmIdx = 0, filmDirty = true, filmTargetP = 0, filmP = 0, filmApplied = -1;

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio, 2);
  filmCanvas.width = Math.max(1, Math.round(innerWidth * dpr));
  filmCanvas.height = Math.max(1, Math.round(innerHeight * dpr));
  filmDirty = true;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

function drawFilm() {
  const img = nearestFrame(filmIdx);
  if (!img) return;
  const cw = filmCanvas.width, ch = filmCanvas.height;
  const s = Math.max(cw / img.width, ch / img.height);
  const w = img.width * s, h = img.height * s;
  fctx.clearRect(0, 0, cw, ch);
  fctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  filmDirty = false;
}

// full document scroll → film frames 0..359
if (!reduced) {
  ScrollTrigger.create({
    trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => (filmTargetP = self.progress),
  });
}

let last = performance.now();
function master(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  filmP += (filmTargetP - filmP) * Math.min(1, dt * 4.5);
  if (Math.abs(filmP - filmApplied) > 0.0004) {
    filmApplied = filmP;
    const idx = Math.round(filmP * (FILM_N - 1));
    if (idx !== filmIdx) { filmIdx = idx; filmDirty = true; }
  }
  if (filmDirty) drawFilm();
  requestAnimationFrame(master);
}
requestAnimationFrame(master);

/* ------------------------------------------------------------
   Pinned phone — adopt per-step screens, swap on scroll
   ------------------------------------------------------------ */
const phoneScreens = document.getElementById('phoneScreens');
const isDesktop = window.matchMedia('(min-width: 901px)').matches;
let playAI = () => {};
if (isDesktop) {
  document.querySelectorAll('.screen-slot .pscreen').forEach((s) => phoneScreens.appendChild(s));
  setScreen(0);
  document.querySelectorAll('.fstep').forEach((step) => {
    ScrollTrigger.create({
      trigger: step, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) setScreen(+step.dataset.screen); },
    });
  });
}
function setScreen(i) {
  phoneScreens.querySelectorAll('.pscreen').forEach((s) => s.classList.toggle('active', +s.dataset.s === i));
  if (i === 1) playAI();
}

/* ------------------------------------------------------------
   Watermark parallax · counters · reveals · cue · FAQ · cursor
   ------------------------------------------------------------ */
if (!reduced) {
  const wm = document.getElementById('watermark');
  ScrollTrigger.create({
    start: 0, end: () => document.documentElement.scrollHeight - innerHeight, scrub: true,
    onUpdate: (self) => { wm.style.transform = `translateY(${(-self.progress * 18).toFixed(2)}vh)`; },
  });

  gsap.from('#nav', { y: -24, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.15 });
  gsap.from('.phone-hero', { y: 70, opacity: 0, rotate: 9, duration: 1.3, ease: 'power3.out', delay: 0.35 });
  gsap.to('.phone-hero', { y: -14, rotate: 3, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.7 });
  gsap.from('.marquee', { opacity: 0, duration: 1, delay: 0.6 });

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 34, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

document.querySelectorAll('[data-count]').forEach((el) => {
  const end = +el.dataset.count;
  const obj = { v: 0 };
  gsap.to(obj, {
    v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => (el.textContent = Math.round(obj.v) + (end >= 100 ? '+' : '')),
  });
});

ScrollTrigger.create({ start: 60, onToggle: (self) => document.getElementById('scroll-cue').classList.toggle('hidden', self.isActive) });

document.querySelectorAll('#faq details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) document.querySelectorAll('#faq details[open]').forEach((o) => { if (o !== d) o.open = false; });
  });
});

/* ------------------------------------------------------------
   In-phone interactivity — likes, recruiter reveals, AI typing
   ------------------------------------------------------------ */
function fmtCount(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : '' + n; }
function parseCount(t) { const s = t.replace(/[^0-9.k]/gi, '').trim(); return /k$/i.test(s) ? Math.round(parseFloat(s) * 1000) : (parseInt(s) || 0); }

document.querySelectorAll('.post-foot').forEach((foot) => {
  const span = foot.querySelector('span');
  if (!span || span.textContent.indexOf('♥') < 0) return;
  const base = parseCount(span.textContent);
  const btn = document.createElement('button');
  btn.className = 'like'; btn.type = 'button'; btn.setAttribute('aria-label', 'like');
  btn.innerHTML = `<i>♡</i><span class="lc">${fmtCount(base)}</span>`;
  let liked = false;
  btn.addEventListener('click', () => {
    liked = !liked;
    btn.classList.toggle('liked', liked);
    btn.querySelector('i').textContent = liked ? '♥' : '♡';
    btn.querySelector('.lc').textContent = fmtCount(base + (liked ? 1 : 0));
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 300);
  });
  span.replaceWith(btn);
});

const CONTACTS = { 'Priya S.': 'priya.s@nitw.ac.in', 'Arjun M.': 'arjun.m@iiti.ac.in' };
document.querySelectorAll('.cand-btn').forEach((btn) => {
  btn.type = 'button';
  btn.addEventListener('click', () => {
    if (btn.classList.contains('done')) return;
    const card = btn.closest('.cand');
    const name = card.querySelector('b').textContent.trim();
    btn.textContent = 'requesting…'; btn.disabled = true;
    setTimeout(() => {
      const body = card.querySelector('.cand-body');
      if (!body.querySelector('.reveal')) {
        const r = document.createElement('small'); r.className = 'reveal';
        r.textContent = '📧 ' + (CONTACTS[name] || 'contact@shared');
        body.appendChild(r);
      }
      btn.textContent = '✓ revealed'; btn.classList.add('done'); btn.disabled = false;
    }, 850);
  });
});
document.querySelectorAll('.cand-locked').forEach((card) => {
  card.addEventListener('click', () => {
    if (card.dataset.done) return; card.dataset.done = '1';
    card.style.opacity = '1';
    card.querySelector('.cand-body').innerHTML =
      '<b>Approved by student</b><br><small class="reveal">✓ contact shared · 📧 student@campus.edu</small>';
  });
});

(function heroTabs() {
  const phone = document.getElementById('phoneHero');
  if (!phone) return;
  const titleEl = document.getElementById('appTitle');
  const titles = { feed: 'Skill Vaults', practice: 'Practice', ranks: 'Leaderboard', profile: 'My profile' };
  phone.querySelectorAll('.tabbar button').forEach((b) => {
    b.addEventListener('click', () => {
      const go = b.dataset.go;
      phone.querySelectorAll('.tabbar button').forEach((x) => x.classList.toggle('on', x === b));
      phone.querySelectorAll('.ptab').forEach((p) => p.classList.toggle('active', p.dataset.tab === go));
      if (titleEl) titleEl.textContent = titles[go] || 'Skill Vaults';
    });
  });
})();

(function setupAI() {
  const ai = document.querySelector('.pscreen[data-s="1"]');
  if (!ai) return;
  const bubbles = [...ai.querySelectorAll('.bubble')];
  bubbles.forEach((b) => b.classList.add('abub'));
  let timers = [];
  playAI = function () {
    timers.forEach(clearTimeout); timers = [];
    bubbles.forEach((b) => b.classList.remove('in'));
    bubbles.forEach((b, i) => timers.push(setTimeout(() => b.classList.add('in'), 220 + i * 680)));
  };
  const btn = document.createElement('button');
  btn.className = 'ai-replay'; btn.type = 'button'; btn.textContent = '↻ run verification again';
  btn.addEventListener('click', playAI);
  ai.appendChild(btn);
  playAI();
  if ('IntersectionObserver' in window) {
    let seen = false;
    new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting && !seen) { seen = true; playAI(); } else if (!e.isIntersecting) seen = false; });
    }, { threshold: 0.5 }).observe(ai);
  }
})();

if (finePointer && !reduced) {
  const dot = document.getElementById('cursorDot'), ring = document.getElementById('cursorRing');
  const pos = { x: -100, y: -100, rx: -100, ry: -100 };
  window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; document.body.classList.add('cursor-on'); }, { passive: true });
  gsap.ticker.add(() => {
    pos.rx += (pos.x - pos.rx) * 0.16; pos.ry += (pos.y - pos.ry) * 0.16;
    dot.style.transform = `translate(${pos.x - 2.5}px, ${pos.y - 2.5}px)`;
    ring.style.transform = `translate(${pos.rx - 16}px, ${pos.ry - 16}px)`;
  });
  document.querySelectorAll('a, button, .phone').forEach((el) => {
    el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ------------------------------------------------------------
   Frame loading — progressive, connection-aware, concurrency-limited.
   Goal: the hero never looks broken and we never blast ~8 MB at once
   (campus mobile data is precious). Frame 0 lands first; a coarse spread
   makes the whole film scrubbable early; the rest fills in gently.
   ------------------------------------------------------------ */
const filmLoader = document.getElementById('filmLoader');
const filmLoaderBar = document.getElementById('filmLoaderBar');
function hideLoader() { if (filmLoader) filmLoader.classList.add('done'); }

(function preload() {
  // Reduced motion: the film never scrubs, so a single static backdrop is all
  // we need — don't pull the other 359 frames.
  if (reduced) {
    loadFrame(0, () => { filmIdx = 0; filmDirty = true; hideLoader(); });
    return;
  }

  const conn = navigator.connection || {};
  const slow = conn.saveData === true || /(^|\b)(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
  // On slow / data-saver links, settle for a sparse set (~60 frames). nearestFrame()
  // keeps scrubbing smooth-ish on a fraction of the bytes. Fast links get them all.
  const fillStep = slow ? 6 : 1;
  const MAX_CONCURRENT = slow ? 3 : 8;

  // Load order: hero frame, then a coarse spread (early scrub), then fill.
  const order = [];
  const seen = new Set();
  const add = (i) => { if (i >= 0 && i < FILM_N && !seen.has(i)) { seen.add(i); order.push(i); } };
  add(0);
  for (let i = 0; i < FILM_N; i += 12) add(i); // coarse: whole film scrubbable fast
  for (let i = 0; i < FILM_N; i += fillStep) add(i); // fill to final density
  const total = order.length;
  const coarseEnough = Math.min(total, 30); // loader fades once scrubbing is usable

  let started = 0, loaded = 0, firstDrawn = false;
  function pump() {
    while (started - loaded < MAX_CONCURRENT && started < total) {
      loadFrame(order[started++], () => {
        loaded++;
        if (!firstDrawn && frames[0]) { firstDrawn = true; filmIdx = 0; filmDirty = true; }
        if (filmLoaderBar) filmLoaderBar.style.transform = `scaleX(${(loaded / total).toFixed(3)})`;
        if (loaded >= coarseEnough) hideLoader();
        pump();
      });
    }
  }
  pump();
})();

/* ------------------------------------------------------------
   Portal wheel — weapon-wheel-style selector. Press P (or tap the
   trigger) to open; hover/arrow to a portal, click/Enter to enter it.
   ------------------------------------------------------------ */
(function portalWheel() {
  const overlay = document.getElementById('portalWheel');
  const svg = overlay && overlay.querySelector('.wheel-svg');
  const stage = overlay && overlay.querySelector('.wheel-stage');
  const titleEl = document.getElementById('wheelTitle');
  const subEl = document.getElementById('wheelSub');
  const trigger = document.getElementById('wheelTrigger');
  if (!overlay || !svg || !stage) return;

  // Portals in place of the reference's guns. Each selects that portal's entry.
  const PORTALS = [
    { label: 'Students', icon: '🎓', href: '/login', sub: 'Sign in or get verified' },
    { label: 'Recruiters', icon: '💼', href: '/company/signup', sub: 'Hire verified talent' },
    { label: 'Institutions', icon: '🏛️', href: '/institution/signup', sub: 'Onboard your campus' },
    { label: 'Interviewers', icon: '🎯', href: '/login', sub: 'Conduct L4 interviews' },
    { label: 'Admin', icon: '⚙️', href: '/login', sub: 'Platform administration' },
  ];
  const N = PORTALS.length;
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 200, CY = 200, R = 190, r = 118, GAP = 3.5; // viewBox 400, donut ring, deg gap

  const polar = (radius, deg) => {
    const a = ((deg - 90) * Math.PI) / 180; // -90 so segment 0 sits at the top
    return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
  };
  const segPath = (a1, a2) => {
    const [ox1, oy1] = polar(R, a1), [ox2, oy2] = polar(R, a2);
    const [ix2, iy2] = polar(r, a2), [ix1, iy1] = polar(r, a1);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${ox1} ${oy1} A ${R} ${R} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
  };

  const segEls = [], labelEls = [];
  let selected = 0;

  PORTALS.forEach((p, i) => {
    const a1 = (360 / N) * i + GAP / 2;
    const a2 = (360 / N) * (i + 1) - GAP / 2;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', segPath(a1, a2));
    path.setAttribute('class', 'wheel-seg');
    path.addEventListener('mouseenter', () => select(i));
    path.addEventListener('click', () => go(i));
    svg.appendChild(path);
    segEls.push(path);

    const [lx, ly] = polar((R + r) / 2, (a1 + a2) / 2);
    const label = document.createElement('div');
    label.className = 'wheel-label';
    label.style.left = `${(lx / 400) * 100}%`;
    label.style.top = `${(ly / 400) * 100}%`;
    label.innerHTML = `<span class="wl-icon">${p.icon}</span><span class="wl-name">${p.label}</span>`;
    label.addEventListener('mouseenter', () => select(i));
    label.addEventListener('click', () => go(i));
    stage.appendChild(label);
    labelEls.push(label);
  });

  function select(i) {
    selected = (i + N) % N;
    segEls.forEach((el, j) => el.classList.toggle('active', j === selected));
    labelEls.forEach((el, j) => el.classList.toggle('active', j === selected));
    if (titleEl) titleEl.textContent = PORTALS[selected].label;
    if (subEl) subEl.textContent = PORTALS[selected].sub;
  }
  function go(i) { window.location.href = PORTALS[(i + N) % N].href; }

  let open = false;
  function setOpen(v) {
    open = v;
    overlay.classList.toggle('open', v);
    overlay.setAttribute('aria-hidden', v ? 'false' : 'true');
    if (v) select(0);
  }

  window.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = /^(input|textarea|select)$/i.test(tag);
    if (!typing && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); setOpen(!open); return; }
    if (!open) return;
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(selected + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(selected - 1); }
    else if (e.key === 'Enter') go(selected);
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) setOpen(false); });
  if (trigger) trigger.addEventListener('click', () => setOpen(!open));
})();
