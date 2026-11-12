/* Helpers */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Menu */
(function menu() {
  const btn = $('#menu-btn'), drawer = $('#drawer'), scrim = $('#scrim');
  if (!btn || !drawer) return;
  const set = (open) => {
    drawer.classList.toggle('open', open);
    scrim.classList.toggle('on', open);
    btn.setAttribute('aria-expanded', open);
  };
  btn.addEventListener('click', () => set(!drawer.classList.contains('open')));
  scrim.addEventListener('click', () => set(false));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();

/* Theme */
(function theme() {
  const btn = $('#theme-btn');
  if (!btn) return;
  const root = document.documentElement;
  const apply = (t) => {
    if (t === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    btn.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
  };
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  apply(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* Spy */
(function spy() {
  const links = $$('.drawer nav a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  secs.forEach(s => io.observe(s));
})();

/* Filters */
(function filters() {
  const wrap = $('#filters');
  if (!wrap) return;
  wrap.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    $$('button', wrap).forEach(x => x.classList.toggle('on', x === b));
    $$('.card').forEach(c => { c.hidden = b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f; });
  });
})();

/* Dots */
(function dots() {
  const c = $('#dots');
  if (!c || reduceMotion) return;
  const ctx = c.getContext('2d');
  let w, h, pts = [];
  const resize = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    pts = Array.from({ length: Math.round(w * h / 28000) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + .6, vy: Math.random() * .25 + .05
    }));
  };
  resize();
  // Phones change innerHeight while scrolling (address bar), so only rebuild when the width changes.
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== lastW) { lastW = innerWidth; resize(); }
  });
  (function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--rose') || '#c9967f';
    ctx.globalAlpha = .35;
    pts.forEach(p => {
      p.y -= p.vy; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
})();

/* Player */
(function player() {
  const tracks = [
    { title: 'From The Start',        artist: 'Laufey',                 src: 'music/from-the-start.m4a' },
    { title: 'Valentine',             artist: 'Laufey',                 src: 'music/valentine.m4a' },
    { title: 'Treasure',              artist: 'Bruno Mars',             src: 'music/Treasure.m4a' },
    { title: 'Finesse (Remix)',       artist: 'Bruno Mars ft. Cardi B', src: 'music/DownloadBruno Mars - Finesse (Remix) (feat. Cardi B) (Official Music Video).m4a' },
    { title: 'Lego House',            artist: 'Ed Sheeran',             src: 'music/DownloadEd Sheeran - Lego House (LYRICS).m4a' },
    { title: 'Fall In Love Alone',    artist: 'Stacey Ryan',            src: 'music/DownloadStacey Ryan - Fall In Love Alone (Audio) (2022).m4a' },
    { title: 'I Knew It, I Knew You', artist: 'Taylor Swift',           src: 'music/DownloadTaylor Swift - I Knew It, I Knew You (from Toy Story 5).m4a' },
    { title: 'Ruin the Friendship',   artist: 'Taylor Swift',           src: 'music/DownloadTaylor Swift - Ruin the Friendship (Lyrics).m4a' }
  ];

  const el = id => document.getElementById(id);
  const root = el('player');
  if (!root) return;

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = 0.7;

  let idx = 0, shuffle = false, repeat = true;

  const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
  const setNote = t => { el('note').textContent = t || ''; };

  // Playlist
  const list = el('tracks');
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<div><span></span><small></small></div>';
    li.querySelector('span').textContent = t.title;
    li.querySelector('small').textContent = t.artist;
    li.addEventListener('click', () => { load(i); play(); });
    list.appendChild(li);
  });

  function load(i) {
    idx = (i + tracks.length) % tracks.length;
    const t = tracks[idx];
    audio.src = encodeURI(t.src);
    el('title').textContent = el('mini-title').textContent = t.title;
    el('artist').textContent = el('mini-artist').textContent = t.artist;
    [...list.children].forEach((li, n) => li.classList.toggle('on', n === idx));
    el('seek').value = 0; el('cur').textContent = '0:00'; el('dur').textContent = '0:00';
    setNote('');
  }

  function play() { audio.play().catch(() => setNote('Couldn’t play this track. Check the file name in the music folder.')); }
  function toggle() { audio.paused ? play() : audio.pause(); }

  function next(auto) {
    if (shuffle && tracks.length > 1) {
      let n; do { n = Math.floor(Math.random() * tracks.length); } while (n === idx);
      load(n);
    } else {
      if (auto && !repeat && idx === tracks.length - 1) { audio.pause(); return; }
      load(idx + 1);
    }
    play();
  }

  // Events
  audio.addEventListener('play',  () => sync(true));
  audio.addEventListener('pause', () => sync(false));
  audio.addEventListener('ended', () => next(true));
  audio.addEventListener('error', () => setNote('Couldn’t load “' + tracks[idx].title + '”. Check the file name.'));
  audio.addEventListener('loadedmetadata', () => { el('dur').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    el('cur').textContent = fmt(audio.currentTime);
    if (audio.duration) el('seek').value = (audio.currentTime / audio.duration) * 100;
  });

  function sync(playing) {
    const icon = playing ? '❚❚' : '▶';
    el('mini-play').textContent = icon; el('play').textContent = icon;
    el('vinyl').classList.toggle('spin', playing);
    el('vinyl-mini').classList.toggle('spin', playing);
  }

  // Controls
  el('mini-play').addEventListener('click', toggle);
  el('play').addEventListener('click', toggle);
  el('next').addEventListener('click', () => next(false));
  el('prev').addEventListener('click', () => {
    if (audio.currentTime > 3) audio.currentTime = 0; else { load(idx - 1); play(); }
  });
  el('shuffle').addEventListener('click', e => { shuffle = !shuffle; e.currentTarget.classList.toggle('on', shuffle); });
  el('repeat').addEventListener('click', e => { repeat = !repeat; e.currentTarget.classList.toggle('on', repeat); });
  el('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; });
  el('vol').addEventListener('input', e => { audio.volume = e.target.value; });

  el('expand').addEventListener('click', e => {
    const open = root.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });

  // Tap anywhere outside the player to close the playlist (handy on phones)
  document.addEventListener('click', e => {
    if (root.classList.contains('open') && !root.contains(e.target)) {
      root.classList.remove('open');
      el('expand').setAttribute('aria-expanded', 'false');
    }
  });

  load(0);

  // Autoplay: try as soon as the page opens. Browsers usually block sound until the
  // visitor touches the page, so if it is blocked, start on the first tap / click / key press.
  const wake = ['pointerup', 'touchend', 'keydown'];
  const kick = e => {
    if (!audio.paused) return;
    if (e && e.target && root.contains(e.target)) return; // let the player's own buttons work normally
    play();
  };
  audio.addEventListener('play', () => wake.forEach(ev => document.removeEventListener(ev, kick)));
  audio.play().catch(() => wake.forEach(ev => document.addEventListener(ev, kick, { passive: true })));
})();

/* Contact */
(function contact() {
  const form = document.getElementById('contactform');
  if (!form) return;
  const alertBox = document.getElementById('form-alert');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const f = form.elements;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending...';

    try {
      const res = await fetch('https://formsubmit.co/ajax/fritzieabuyabor@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: f.name.value,
          email: f.email.value,
          _subject: f.subject.value,
          message: f.message.value,
          _replyto: f.email.value,
          _honey: f._honey.value
        })
      });
      if (!res.ok) throw new Error('bad response');
      alertBox.textContent = 'Thanks! Your message was sent.';
      form.reset();
    } catch (err) {
      alertBox.textContent = 'Something went wrong. Please email fritzieabuyabor@gmail.com directly.';
    }
    alertBox.hidden = false;
    btn.disabled = false; btn.textContent = 'Submit message';
  });
})();

/* Extras */
(function extras() {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* Shared */
  const menuBtn = document.getElementById('menu-btn');
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  const colorBtn = document.getElementById('color-btn');
  const colorPop = document.getElementById('colorpop');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('on', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open);
  }
  function setColor(open) {
    if (!colorPop) return;
    colorPop.hidden = !open;
    if (colorBtn) colorBtn.setAttribute('aria-expanded', open);
  }

  /* Typing */
  (function typedLoop() {
    const el = document.querySelector('.typed-name');
    if (!el) return;
    const text = 'Fritzie Faura';
    if (reduce) { el.textContent = text; return; }
    let i = 0, dir = 1;
    (function tick() {
      i += dir;
      el.textContent = text.slice(0, i);
      let wait = dir === 1 ? 120 : 60;
      if (i === text.length) { dir = -1; wait = 1600; }
      else if (i === 0) { dir = 1; wait = 500; }
      setTimeout(tick, wait);
    })();
  })();

  /* Ripples */
  (function ripples() {
    if (reduce) return;
    const c = document.createElement('canvas');
    c.id = 'ripples';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    let w, h, rings = [], running = false;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); addEventListener('resize', resize);
    const color = () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#7d1426';

    function add(x, y, max, life, delay) {
      rings.push({ x, y, max, life, t: -(delay || 0) });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const col = color();
      rings = rings.filter(r => r.t < r.life);
      rings.forEach(r => {
        r.t += 16;
        if (r.t < 0) return;
        const p = r.t / r.life, e = 1 - Math.pow(1 - p, 3);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.max * e, 0, 6.283);
        ctx.strokeStyle = col;
        ctx.globalAlpha = (1 - p) * .55;
        ctx.lineWidth = 2.5 * (1 - p) + .5;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (rings.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, w, h); }
    }
    addEventListener('pointerdown', e => {
      add(e.clientX, e.clientY, 120, 900, 0);
      add(e.clientX, e.clientY, 80, 800, 140);
      add(e.clientX, e.clientY, 45, 700, 280);
    });
    let lx = -999, ly = -999, lt = 0;
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lt < 110 || Math.hypot(e.clientX - lx, e.clientY - ly) < 45) return;
      lt = now; lx = e.clientX; ly = e.clientY;
      add(lx, ly, 38, 650, 0);
    });
  })();

  /* Wheel */
  (function colorWheel() {
    if (!colorBtn || !colorPop) return;
    const cv = colorPop.querySelector('canvas');
    const wrap = colorPop.querySelector('.wheel-wrap');
    const dot = colorPop.querySelector('.wheel-dot');
    const swWrap = document.getElementById('swatches');
    const ctx = cv.getContext('2d');
    const S = cv.width, R = S / 2;

    // Draw
    const img = ctx.createImageData(S, S);
    const hsv = (hue, s, v) => {
      const f = n => { const k = (n + hue / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
      return [f(5) * 255, f(3) * 255, f(1) * 255];
    };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = x - R + .5, dy = y - R + .5, r = Math.hypot(dx, dy) / R, i = (y * S + x) * 4;
      if (r > 1) { img.data[i + 3] = 0; continue; }
      const hue = (360 - Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const rgb = hsv(hue, Math.min(1, r * 1.05), 1);
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const VARS = ['--bg', '--surface', '--ink', '--muted', '--line', '--accent', '--deep', '--rose', '--petal', '--on', '--shift'];
    let cur = null;

    function apply() {
      if (!cur) { VARS.forEach(v => root.style.removeProperty(v)); return; }
      const h = cur.h, sat = Math.round(30 + 60 * cur.s);
      const dark = root.getAttribute('data-theme') === 'dark';
      const set = (k, v) => root.style.setProperty(k, v);
      const hsl = (s, l) => 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
      if (dark) {
        set('--bg', hsl(45, 7));      set('--surface', hsl(35, 11));
        set('--ink', hsl(50, 92));    set('--muted', hsl(15, 66));
        set('--line', hsl(25, 20));   set('--accent', hsl(sat, 62));
        set('--deep', hsl(sat, 22));  set('--rose', hsl(35, 66));
        set('--petal', hsl(55, 86));  set('--on', hsl(45, 7));
      } else {
        set('--bg', hsl(55, 92));     set('--surface', hsl(60, 96));
        set('--ink', hsl(55, 12));    set('--muted', hsl(15, 45));
        set('--line', hsl(35, 83));   set('--accent', hsl(sat, 30));
        set('--deep', hsl(sat, 30));  set('--rose', hsl(40, 64));
        set('--petal', hsl(60, 94));  set('--on', hsl(60, 96));
      }
      set('--shift', (h - 350) + 'deg');
    }
    function placeDot() {
      if (!cur) { dot.style.left = '50%'; dot.style.top = '50%'; return; }
      const a = -cur.h * Math.PI / 180, r = Math.min(1, cur.s) * 50;
      dot.style.left = (50 + Math.cos(a) * r) + '%';
      dot.style.top = (50 + Math.sin(a) * r) + '%';
    }
    function choose(h, s) {
      cur = { h: Math.round(h), s: s };
      apply(); placeDot();
      store.set('themeColor', JSON.stringify(cur));
    }
    function pick(e) {
      const b = wrap.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
      const rad = b.width / 2, d = Math.min(Math.hypot(dx, dy), rad);
      const h = (360 - Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      choose(h, Math.max(.25, d / rad));
    }

    let down = false;
    wrap.addEventListener('pointerdown', e => { down = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} pick(e); });
    wrap.addEventListener('pointermove', e => { if (down) pick(e); });
    wrap.addEventListener('pointerup',   () => { down = false; });
    wrap.addEventListener('pointercancel', () => { down = false; });

    // Swatches
    [20, 150, 200, 260, 320].forEach(hue => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Color ' + hue);
      b.style.background = 'hsl(' + hue + ', 70%, 45%)';
      b.addEventListener('click', () => choose(hue, .8));
      swWrap.appendChild(b);
    });

    document.getElementById('color-reset').addEventListener('click', () => {
      cur = null; store.del('themeColor'); apply(); placeDot();
    });
    colorBtn.addEventListener('click', () => setColor(colorPop.hidden));

    // Observer
    new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    try { const sv = JSON.parse(store.get('themeColor')); if (sv && typeof sv.h === 'number') cur = sv; } catch (e) {}
    apply(); placeDot();
  })();

  /* Tour */
  (function tour() {
    const tourBtn = document.getElementById('tour-btn');
    if (!tourBtn) return;
    const q = s => document.querySelector(s);

    const steps = [
      { el: '.portrait',              t: 'Welcome!',     d: 'Hi, I’m Fritzie. This quick tour shows you around my portfolio.' },
      { el: '#menu-btn',              t: 'Menu button',  d: 'Tap this button to open the menu.' },
      { el: '.drawer nav',            t: 'Quick links',  d: 'Jump to any section of the site from here.', drawer: true },
      { el: '#colorpop',              t: 'Color wheel',  d: 'Drag on the wheel or tap a swatch to recolor the whole site.', drawer: true, color: true },
      { el: '#theme-btn',             t: 'Dark mode',    d: 'Switch between light and dark mode.', drawer: true },
      { el: '#about .prose',          t: 'About me',     d: 'A short intro about who I am and what I’m studying.' },
      { el: '#projects .filters',     t: 'Projects',     d: 'Filter my work by Websites or Web apps.' },
      { el: '#skills .groups',        t: 'Skills',       d: 'The languages, design tools, and IT skills I work with.' },
      { el: '#education .timeline',   t: 'Education',    d: 'Where I’m studying Information Technology.' },
      { el: '#contact .contact-form', t: 'Contact',      d: 'Send me a message here. It goes straight to my email.' },
      { el: '#player',                t: 'Music player', d: 'Press play, or tap the arrow to open the full playlist.' },
      { el: '#menu-btn',              t: 'That’s it!',   d: 'Open the menu and press “Website tour” any time to replay this.' }
    ];

    let i = -1, spot = null, card = null, raf;

    function start() {
      end(true);
      spot = document.createElement('div'); spot.className = 'tour-spot';
      card = document.createElement('div'); card.className = 'tour-card bottom';
      card.setAttribute('role', 'dialog');
      document.body.append(spot, card);
      addEventListener('resize', track); addEventListener('scroll', track, true);
      show(0);
    }
    function end() {
      if (spot) spot.remove();
      if (card) card.remove();
      spot = card = null; i = -1;
      removeEventListener('resize', track); removeEventListener('scroll', track, true);
      setDrawer(false); setColor(false);
    }
    function track() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!spot || i < 0) return;
        const el = q(steps[i].el); if (!el) return;
        const b = el.getBoundingClientRect(), p = 8;
        spot.style.top = (b.top - p) + 'px';
        spot.style.left = (b.left - p) + 'px';
        spot.style.width = (b.width + p * 2) + 'px';
        spot.style.height = (b.height + p * 2) + 'px';
        const mid = b.top + b.height / 2;
        card.className = 'tour-card ' + (mid > innerHeight * .5 ? 'top' : 'bottom');
      });
    }
    function show(n) {
      i = n;
      const s = steps[i];
      setDrawer(!!s.drawer);
      setColor(!!s.color);
      const el = q(s.el);
      if (!el) { if (n < steps.length - 1) return show(n + 1); return end(); }
      const fixed = getComputedStyle(el).position === 'fixed' || el.closest('.player') || el.closest('.drawer') || el.id === 'menu-btn';
      if (!fixed) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      card.innerHTML =
        '<h3></h3><p></p><div class="tour-foot"><span class="mono"></span><div>' +
        '<button class="skip" data-a="skip">Skip</button>' +
        (i > 0 ? '<button data-a="back">Back</button>' : '') +
        '<button class="primary" data-a="next">' + (i === steps.length - 1 ? 'Done' : 'Next') + '</button></div></div>';
      card.querySelector('h3').textContent = s.t;
      card.querySelector('p').textContent = s.d;
      card.querySelector('.mono').textContent = (i + 1) + ' / ' + steps.length;
      track(); setTimeout(track, 350); setTimeout(track, 750);
    }
    const next = () => (i >= steps.length - 1 ? end() : show(i + 1));

    document.addEventListener('click', e => {
      const b = e.target.closest('.tour-card button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'next') next(); else if (a === 'back') show(i - 1); else end();
    });
    document.addEventListener('keydown', e => {
      if (i < 0) return;
      if (e.key === 'Escape') end();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft' && i > 0) show(i - 1);
    });
    tourBtn.addEventListener('click', () => { setDrawer(false); setTimeout(start, 200); });
  })();
})();
