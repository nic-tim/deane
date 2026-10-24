/*
 * MOONROT — page behaviour.
 *
 * No dependencies. Reads window.SITE_CONFIG (config.js), fills the page,
 * then wires motion and interaction. Every listener is registered against one
 * AbortController and every observer is disconnected on pagehide, so nothing
 * outlives the page (or a bfcache restore).
 */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var lifetime = new AbortController();
  var on = function (el, type, fn, opts) {
    el.addEventListener(type, fn, Object.assign({ signal: lifetime.signal }, opts || {}));
  };
  var observers = [];

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduceMotion = reduceMotionQuery.matches;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var get = function (path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, cfg);
  };
  var el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  };
  var isPlaceholder = function (v) { return typeof v === 'string' && /^\s*\[.*\]\s*$/.test(v); };

  /* ─────────────── 1. Apply config ─────────────── */

  function applyConfig() {
    if (cfg.colors) {
      Object.keys(cfg.colors).forEach(function (k) { root.style.setProperty('--' + k, cfg.colors[k]); });
      var theme = $('meta[name="theme-color"]');
      if (theme && cfg.colors.ink) theme.setAttribute('content', cfg.colors.ink);
    }
    if (cfg.brand) {
      if (cfg.brand.metaTitle) document.title = cfg.brand.metaTitle;
      var desc = $('meta[name="description"]');
      if (desc && cfg.brand.metaDescription) desc.setAttribute('content', cfg.brand.metaDescription);
    }

    $$('[data-cfg]').forEach(function (node) {
      var v = get(node.getAttribute('data-cfg'));
      if (typeof v === 'string' && v) node.textContent = v;
    });

    // Headline: one string per line; *word* marks the accent.
    var lines = get('hero.headline');
    var h1 = $('[data-headline]');
    if (h1 && Array.isArray(lines) && lines.length) {
      h1.textContent = '';
      lines.forEach(function (line) {
        var inner = el('span', { class: 'line-inner' });
        line.split(/(\*[^*]+\*)/).forEach(function (part) {
          if (!part) return;
          if (/^\*.*\*$/.test(part)) inner.appendChild(el('em', { text: part.slice(1, -1) }));
          else inner.appendChild(document.createTextNode(part));
        });
        h1.appendChild(el('span', { class: 'line' }, [inner]));
      });
    }

    var comLines = get('community.headline');
    var comTitle = $('#com-title');
    if (comTitle && Array.isArray(comLines)) {
      comTitle.textContent = '';
      comLines.forEach(function (t) { comTitle.appendChild(el('span', { text: t })); });
    }

    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());

    buildMarquee();
    buildChapters();
    buildTokenomics();
    buildContract();
    buildSteps();
    buildSocials();
    buildMascots();
  }

  function buildMarquee() {
    var items = cfg.marquee;
    var track = $('[data-marquee]');
    if (!track || !Array.isArray(items) || !items.length) return;
    // Two identical lists side by side; the track slides by exactly one list
    // width (-50%), so the loop has no visible seam. Each list repeats the
    // items until it is wider than any reasonable screen.
    var reps = Math.max(2, Math.ceil(16 / items.length));
    var makeList = function (hidden) {
      var ul = el('ul', { class: 'marquee-list mono' });
      if (hidden) ul.setAttribute('aria-hidden', 'true');
      for (var r = 0; r < reps; r++) {
        items.forEach(function (t, i) {
          var li = el('li', { text: t });
          if (r > 0 || hidden) li.setAttribute('aria-hidden', 'true');
          ul.appendChild(li);
        });
      }
      return ul;
    };
    track.textContent = '';
    track.appendChild(makeList(false));
    track.appendChild(makeList(true));
  }

  function buildChapters() {
    var list = $('[data-chapters]');
    var chapters = get('about.chapters');
    if (!list || !Array.isArray(chapters)) return;
    var numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    list.textContent = '';
    chapters.forEach(function (c, i) {
      list.appendChild(el('li', { class: 'chapter', 'data-reveal': '', style: '--d:' + i }, [
        el('span', { class: 'chapter-num mono', text: 'Chapter ' + (numerals[i] || String(i + 1)) }),
        el('h3', { text: c.title }),
        el('p', { text: c.body }),
      ]));
    });
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  var svg = function (tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  };

  function buildTokenomics() {
    var t = cfg.tokenomics || {};
    var allocations = t.allocations || [];
    var donut = $('[data-donut]');
    var ledger = $('[data-ledger]');
    var colors = ['var(--acid)', 'var(--bone)', 'var(--moss)', 'var(--fog)', 'var(--line)'];

    if (donut) {
      donut.textContent = '';
      var cx = 200, r = 150, C = 2 * Math.PI * r, gap = 4;
      // A dial of ticks, like the phase ring on a moon watch.
      for (var i = 0; i < 72; i++) {
        var a = (i / 72) * Math.PI * 2;
        var long = i % 6 === 0;
        var r1 = 178, r2 = long ? 192 : 186;
        donut.appendChild(svg('line', {
          class: 'tick',
          x1: cx + r1 * Math.cos(a), y1: cx + r1 * Math.sin(a),
          x2: cx + r2 * Math.cos(a), y2: cx + r2 * Math.sin(a),
        }));
      }
      donut.appendChild(svg('circle', { class: 'arc-track', cx: cx, cy: cx, r: 118 }));
      var total = allocations.reduce(function (s, x) { return s + (Number(x.percent) || 0); }, 0) || 100;
      var offset = 0;
      allocations.forEach(function (al, idx) {
        var len = Math.max(0, (al.percent / total) * C - gap);
        var arc = svg('circle', {
          class: 'arc',
          cx: cx, cy: cx, r: r,
          stroke: colors[idx % colors.length],
          'stroke-dasharray': '0 ' + C,
          'stroke-dashoffset': String(-offset),
          transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
          'data-idx': idx,
        });
        arc.style.stroke = colors[idx % colors.length];
        arc.dataset.len = String(len);
        arc.dataset.c = String(C);
        donut.appendChild(arc);
        offset += (al.percent / total) * C;
      });
    }

    if (ledger) {
      ledger.textContent = '';
      allocations.forEach(function (al, idx) {
        var sw = el('span', { class: 'ledger-swatch', 'aria-hidden': 'true' });
        sw.style.background = colors[idx % colors.length];
        var pct = el('span', { class: 'ledger-pct' });
        pct.appendChild(document.createTextNode(String(al.percent)));
        pct.appendChild(el('small', { text: '%' }));
        ledger.appendChild(el('li', { class: 'ledger-row', 'data-idx': idx, 'data-reveal': '', style: '--d:' + idx }, [
          sw,
          el('span', { class: 'ledger-label', text: al.label }),
          al.note ? el('span', { class: 'ledger-note', text: al.note }) : null,
          pct,
        ]));
      });
    }

    var facts = $('[data-facts]');
    if (facts && Array.isArray(t.facts)) {
      facts.textContent = '';
      t.facts.forEach(function (f) {
        facts.appendChild(el('div', { class: 'fact' }, [
          el('dt', { text: f.label }),
          el('dd', { class: isPlaceholder(f.value) ? 'is-placeholder' : '', text: f.value }),
        ]));
      });
    }
  }

  function drawDonut() {
    $$('[data-donut] .arc').forEach(function (arc, i) {
      var len = arc.dataset.len, C = arc.dataset.c;
      arc.style.transition = reduceMotion ? 'none' : 'stroke-dasharray 1.3s cubic-bezier(.16,1,.3,1) ' + (i * 0.14) + 's';
      arc.setAttribute('stroke-dasharray', len + ' ' + C);
    });
  }

  function buildContract() {
    var code = $('[data-contract]');
    if (!code) return;
    var addr = (cfg.contract && cfg.contract.address) || '';
    code.textContent = addr || 'Not yet published';
    code.classList.toggle('is-placeholder', !addr);
  }

  function buildSteps() {
    var list = $('[data-steps]');
    var steps = get('howToBuy.steps');
    if (!list || !Array.isArray(steps)) return;
    list.textContent = '';
    list.setAttribute('data-reveal', '');
    steps.forEach(function (s, i) {
      list.appendChild(el('li', { class: 'step', 'data-reveal': '', style: '--d:' + (i * 2) }, [
        el('span', { class: 'step-num', 'aria-hidden': 'true', text: String(i + 1) }),
        el('h3', { text: s.title }),
        el('p', { text: s.body }),
      ]));
    });
  }

  var ARROW = '<svg class="social-arrow" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h22M21 10l10 10-10 10" fill="none" stroke="currentColor" stroke-width="3"/></svg>';

  function buildSocials() {
    var socials = get('community.socials') || [];
    var list = $('[data-socials]');
    var foot = $('[data-foot-socials]');
    if (list) list.textContent = '';
    if (foot) foot.textContent = '';

    socials.forEach(function (s, i) {
      var live = !!s.url;
      var meta = live ? s.handle : 'Demo placeholder · link not connected';

      if (list) {
        var node = live
          ? el('a', { class: 'social', href: s.url, target: '_blank', rel: 'noopener noreferrer' })
          : el('button', { class: 'social', type: 'button', 'data-placeholder-link': s.name });
        node.setAttribute('aria-label', live ? s.name + ' (opens in a new tab)' : s.name + ', demo placeholder, not connected');
        node.appendChild(el('span', { class: 'social-name', text: s.name }));
        node.appendChild(el('span', { class: 'social-meta', text: meta }));
        node.insertAdjacentHTML('beforeend', ARROW);
        list.appendChild(el('li', { 'data-reveal': '', style: '--d:' + i }, [node]));
      }

      if (foot) {
        var f = live
          ? el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.name })
          : el('button', { type: 'button', 'data-placeholder-link': s.name, text: s.name });
        if (!live) f.appendChild(el('small', { text: 'placeholder' }));
        foot.appendChild(el('li', {}, [f]));
      }
    });
  }

  // Give a cloned SVG its own ids so its gradients, masks and clips do not
  // collide with (or silently resolve to) the original's.
  function cloneSvgWithIds(source, suffix) {
    var copy = source.cloneNode(true);
    var map = {};
    $$('[id]', copy).forEach(function (n) { map[n.id] = n.id + suffix; n.id = map[n.id]; });
    $$('*', copy).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var v = a.value.replace(/url\(#([^)]+)\)/g, function (m, id) { return map[id] ? 'url(#' + map[id] + ')' : m; });
        if ((a.name === 'href' || a.name === 'xlink:href' || a.name === 'aria-labelledby') && v.charAt(0) !== '#' && map[v]) v = map[v];
        if ((a.name === 'href' || a.name === 'xlink:href') && v.charAt(0) === '#' && map[v.slice(1)]) v = '#' + map[v.slice(1)];
        if (v !== a.value) n.setAttribute(a.name, v);
      });
    });
    return copy;
  }

  function buildMascots() {
    var btn = $('[data-mascot]');
    var peek = $('[data-peek]');
    var src = cfg.mascot && cfg.mascot.src;
    var art = btn && $('svg', btn);

    if (src && btn) {
      var img = el('img', { class: 'mascot-img', src: src, alt: (cfg.mascot.alt || ''), decoding: 'async' });
      btn.replaceChild(img, art);
      if (peek) peek.appendChild(el('img', { class: 'mascot-img', src: src, alt: '', loading: 'lazy', decoding: 'async' }));
      return;
    }
    if (art && cfg.mascot && cfg.mascot.alt) {
      var title = $('title', art);
      if (title) title.textContent = cfg.mascot.alt;
    }
    if (art && peek) {
      var copy = cloneSvgWithIds(art, '-peek');
      copy.removeAttribute('role');
      copy.removeAttribute('aria-labelledby');
      var t = $('title', copy);
      if (t) t.remove();
      peek.appendChild(copy);
    }
  }

  /* ─────────────── 2. Entrance + reveals ─────────────── */

  function startEntrance() {
    var go = function () { root.classList.add('is-ready'); };
    // Wait for the display face so the headline does not reflow mid-animation,
    // but never longer than a moment.
    var timer = setTimeout(go, 700);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { clearTimeout(timer); requestAnimationFrame(go); });
    }
  }

  function setupReveals() {
    var targets = $$('[data-reveal]');
    var reveal = function (n) {
      n.classList.add('is-in');
      if (n.classList.contains('tok-chart')) drawDonut();
    };
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        reveal(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
    observers.push(io);
  }

  /* ─────────────── 3. Navigation ─────────────── */

  function setupNav() {
    var nav = $('[data-nav]');
    if (!nav) return;
    var lastY = window.scrollY;
    var ticking = false;
    // A jump to a section scrolls downward but is not the reader scrolling
    // away from the nav; keep it on screen until the jump has finished.
    var holdUntil = 0;
    on(document, 'click', function (e) {
      if (e.target.closest('a[href^="#"]')) holdUntil = Date.now() + 1500;
    });
    var update = function () {
      ticking = false;
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      var menuOpen = document.body.classList.contains('menu-open');
      var focusInside = nav.contains(document.activeElement);
      var holding = Date.now() < holdUntil;
      if (!menuOpen && !focusInside && !holding && y > 480 && y > lastY + 6) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 480) nav.classList.remove('is-hidden');
      lastY = y;
    };
    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    on(nav, 'focusin', function () { nav.classList.remove('is-hidden'); });
    update();

    // Mark the section in view.
    var links = $$('.nav-links a');
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = byId[e.target.id];
          if (!link) return;
          if (e.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            link.setAttribute('aria-current', 'true');
          } else if (link.getAttribute('aria-current')) {
            link.removeAttribute('aria-current');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
      observers.push(io);
    }
  }

  function setupMenu() {
    var toggle = $('[data-menu-toggle]');
    var menu = $('[data-menu]');
    var label = toggle && $('.nav-toggle-label', toggle);
    if (!toggle || !menu) return;
    var closeTimer;

    var focusables = function () {
      return [toggle].concat($$('a, button', menu));
    };
    var open = function () {
      clearTimeout(closeTimer);
      menu.hidden = false;
      void menu.offsetWidth; // commit the closed state so the clip transition runs
      menu.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      if (label) label.textContent = 'Close';
      var first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    };
    var close = function (returnFocus) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.removeAttribute('aria-label');
      if (label) label.textContent = 'Menu';
      closeTimer = setTimeout(function () { menu.hidden = true; }, reduceMotion ? 0 : 560);
      if (returnFocus) toggle.focus();
    };

    on(toggle, 'click', function () {
      toggle.getAttribute('aria-expanded') === 'true' ? close(false) : open();
    });
    on(menu, 'click', function (e) {
      if (e.target.closest('a')) close(false);
    });
    on(document, 'keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var wide = window.matchMedia('(min-width: 961px)');
    on(wide, 'change', function (e) { if (e.matches) close(false); });
  }

  /* ─────────────── 4. Demo-safe actions ─────────────── */

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]');
    if (!t) return;
    clearTimeout(toastTimer);
    t.hidden = true;
    t.textContent = msg;
    void t.offsetWidth;
    t.hidden = false;
    toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
  }

  function setupActions() {
    var dialog = $('[data-notice]');
    on(document, 'click', function (e) {
      var buy = e.target.closest('[data-buy]');
      if (buy) {
        var url = get('hero.buyUrl');
        if (!cfg.demo && url) { window.open(url, '_blank', 'noopener'); return; }
        if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
        else toast('Demo only — $ROT does not exist and nothing can be bought.');
        return;
      }
      var ph = e.target.closest('[data-placeholder-link]');
      if (ph) {
        toast('Placeholder: the real ' + ph.getAttribute('data-placeholder-link') + ' link goes here once the client provides it.');
        return;
      }
      if (e.target.closest('[data-copy-contract]')) copyContract();
    });
    // Click on the backdrop closes the dialog.
    if (dialog) {
      on(dialog, 'click', function (e) { if (e.target === dialog) dialog.close(); });
    }
  }

  function copyContract() {
    var addr = cfg.contract && cfg.contract.address;
    if (!addr) {
      toast('No contract address exists for this demo, so nothing was copied.');
      return;
    }
    var done = function () { toast('Contract address copied. Check every character before you use it.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(done, function () { selectContract(); });
    } else {
      selectContract();
    }
  }
  function selectContract() {
    var code = $('[data-contract]');
    var range = document.createRange();
    range.selectNodeContents(code);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    toast('Address selected. Press Ctrl+C or Cmd+C to copy.');
  }

  /* ─────────────── 5. Mascot ─────────────── */

  function setupMascot() {
    var mascots = $$('.mascot');
    var heroBtn = $('[data-mascot]');
    var parallax = $('[data-parallax]');
    var glow = $('.hero-glow');

    var pauseSmil = function () {
      mascots.forEach(function (m) {
        if (typeof m.pauseAnimations === 'function') {
          reduceMotion ? m.pauseAnimations() : m.unpauseAnimations();
        }
      });
    };
    pauseSmil();
    on(reduceMotionQuery, 'change', function (e) { reduceMotion = e.matches; pauseSmil(); });

    // Eyes follow the pointer (or the last tap). Rects are cached and
    // refreshed on scroll/resize, and work happens at most once per frame.
    var pupils = [];
    var refresh = function () {
      pupils = [];
      mascots.forEach(function (m) {
        var r = m.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return;
        $$('.m-pupil', m).forEach(function (p) {
          var c = $('circle', p);
          pupils.push({
            node: p,
            range: Number(p.getAttribute('data-pupil')) || 12,
            x: r.left + (Number(c.getAttribute('cx')) / 600) * r.width,
            y: r.top + (Number(c.getAttribute('cy')) / 600) * r.height,
          });
        });
      });
    };
    var target = null, frame = 0;
    var render = function () {
      frame = 0;
      if (!target) return;
      pupils.forEach(function (p) {
        var dx = target.x - p.x, dy = target.y - p.y;
        var d = Math.hypot(dx, dy) || 1;
        var k = Math.min(1, d / 260) * p.range;
        p.node.style.transform = 'translate(' + (dx / d * k).toFixed(1) + 'px,' + (dy / d * k).toFixed(1) + 'px)';
      });
      if (parallax && finePointerQuery.matches && !reduceMotion) {
        var nx = target.x / window.innerWidth - 0.5;
        var ny = target.y / window.innerHeight - 0.5;
        parallax.style.transform = 'translate3d(' + (nx * -16).toFixed(1) + 'px,' + (ny * -12).toFixed(1) + 'px,0)';
        if (glow) glow.style.translate = (nx * 30).toFixed(1) + 'px ' + (ny * 24).toFixed(1) + 'px';
      }
    };
    var point = function (e) {
      target = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(render);
    };
    refresh();
    on(window, 'pointermove', point, { passive: true });
    on(window, 'pointerdown', point, { passive: true });
    var refreshSoon = function () { if (!frame) frame = requestAnimationFrame(function () { frame = 0; refresh(); render(); }); };
    on(window, 'scroll', refreshSoon, { passive: true });
    on(window, 'resize', refreshSoon, { passive: true });
    if (parallax) parallax.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';

    // Poke it.
    var count = $('[data-poke-count]');
    var pokes = 0;
    var lines = [
      'Poked once. It noticed.',
      'Twice. It is writing this down.',
      'Three. The worm has gone to get someone.',
    ];
    var unpoke;
    if (heroBtn) {
      on(heroBtn, 'click', function () {
        pokes += 1;
        heroBtn.classList.remove('is-poked');
        void heroBtn.offsetWidth;
        heroBtn.classList.add('is-poked');
        clearTimeout(unpoke);
        unpoke = setTimeout(function () { heroBtn.classList.remove('is-poked'); }, 1500);
        if (count) {
          count.textContent = pokes <= lines.length ? lines[pokes - 1]
            : pokes >= 10 ? pokes + ' pokes. You are the rot now.'
            : pokes + ' pokes. The smell is getting worse.';
        }
      });
    }
  }

  /* ─────────────── boot ─────────────── */

  applyConfig();
  setupReveals();
  setupNav();
  setupMenu();
  setupActions();
  setupMascot();
  startEntrance();

  on(window, 'pagehide', function (e) {
    if (e.persisted) return; // kept in bfcache: keep everything alive
    observers.forEach(function (o) { o.disconnect(); });
    lifetime.abort();
  });
})();
