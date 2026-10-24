/*
 * DEANE — page behaviour.
 *
 * No dependencies. Reads window.SITE_CONFIG (config.js), fills the page,
 * then wires motion and interaction. Listeners hang off one AbortController
 * and observers are disconnected on pagehide, so nothing outlives the page.
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
  var reduceMotion = reduceMotionQuery.matches;
  on(reduceMotionQuery, 'change', function (e) { reduceMotion = e.matches; });

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
  var isPlaceholder = function (v) { return typeof v === 'string' && /\[[^\]]*\]/.test(v); };
  // Fill {network}, {nativeCoin} and {venue} from the one place they are set,
  // so the guide can never disagree with the rest of the page.
  var fill = function (str) {
    var vars = {
      network: get('network.name'),
      nativeCoin: get('network.nativeCoin'),
      venue: get('links.buy.venue'),
    };
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  };
  // Text with any [placeholder] parts greyed out.
  var placeholderText = function (str) {
    var frag = document.createDocumentFragment();
    String(str).split(/(\[[^\]]*\])/).forEach(function (part) {
      if (!part) return;
      frag.appendChild(/^\[.*\]$/.test(part) ? el('span', { class: 'is-placeholder', text: part }) : document.createTextNode(part));
    });
    return frag;
  };

  /* ─────────────── 1. Apply config ─────────────── */

  function applyConfig() {
    if (cfg.colors) {
      Object.keys(cfg.colors).forEach(function (k) { root.style.setProperty('--' + k, cfg.colors[k]); });
      var theme = $('meta[name="theme-color"]');
      if (theme && cfg.colors.blue) theme.setAttribute('content', cfg.colors.blue);
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

    if (!cfg.preview) $$('[data-preview-only]').forEach(function (n) { n.hidden = true; });

    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());

    buildWordmark();
    buildMarquee();
    buildActions();
    buildNotList();
    buildContract();
    buildSteps();
    buildReceipt();
    buildTabs();
    buildFootLinks();
    buildArt();
  }

  // One span per letter, so the entrance can stagger them.
  function buildWordmark() {
    var h1 = $('[data-wordmark]');
    var name = get('brand.name') || 'DEANE';
    if (!h1) return;
    h1.textContent = '';
    h1.setAttribute('aria-label', name);
    var inner = el('span', { class: 'wm-inner', 'aria-hidden': 'true' });
    name.split('').forEach(function (ch, i) {
      var s = el('span', { class: 'letter', text: ch });
      s.style.setProperty('--n', i);
      inner.appendChild(s);
    });
    h1.appendChild(inner);
  }

  // Size the wordmark so it runs exactly edge to edge of the content area.
  function fitWordmark() {
    var stage = $('.stage');
    var inner = $('.wm-inner');
    if (!stage || !inner) return;
    var cs = getComputedStyle(stage);
    var target = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var current = parseFloat(getComputedStyle($('[data-wordmark]')).fontSize);
    var width = inner.getBoundingClientRect().width;
    if (!width || !target) return;
    stage.style.setProperty('--wm', (current * target / width).toFixed(2) + 'px');
  }

  function buildMarquee() {
    var items = cfg.marquee;
    var track = $('[data-marquee]');
    if (!track || !Array.isArray(items) || !items.length) return;
    // Two identical lists; the track slides exactly one list width (-50%),
    // so the loop has no seam. Each list repeats until it outruns wide screens.
    var reps = Math.max(2, Math.ceil(14 / items.length));
    var list = function () {
      var ul = el('ul');
      for (var r = 0; r < reps; r++) items.forEach(function (t) { ul.appendChild(el('li', { text: t })); });
      return ul;
    };
    track.textContent = '';
    track.appendChild(list());
    track.appendChild(list());
  }

  // A real link when the URL is known, otherwise a button that says so.
  function linkNode(key, className, children) {
    var link = (cfg.links || {})[key] || {};
    var node = link.url
      ? el('a', { class: className, href: link.url, target: '_blank', rel: 'noopener noreferrer' }, children)
      : el('button', { class: className, type: 'button', 'data-placeholder-link': link.label || key }, children);
    node.setAttribute('aria-label', (link.label || key) + (link.url ? ' (opens in a new tab)' : ', placeholder, link not posted yet'));
    return node;
  }

  // The big action buttons. One builder for every place they appear (hero,
  // community, phone dock), so labels, links and placeholder states match.
  var ICONS = {
    buy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4 2.5 11.2l5.8 2.1L18 7.5l-7.6 7.2.3 5.3 3.2-3.6 4.4 3.3z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4 4 20" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="square"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5-6 4 3 7-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M3 21h18" stroke="currentColor" stroke-width="2"/></svg>',
  };
  function actionButton(key, short) {
    var link = (cfg.links || {})[key];
    if (!link) return null;
    var text = short ? link.label : (link.cta || link.label);
    var kids = [el('span', { class: 'act-text', text: text })];
    // A short form ("X" for "Follow on X") for tight phone layouts.
    if (!short && link.cta && link.cta !== link.label) kids.push(el('span', { class: 'act-short', 'aria-hidden': 'true', text: link.label }));
    if (!link.url) kids.push(el('span', { class: 'tbd', text: 'TBD' }));
    var cls = 'act act-' + key;
    var node;
    if (key === 'buy') {
      // Buy always goes through the shared buy handler (notice while preview).
      node = el('button', { class: cls, type: 'button', 'data-buy': '' }, kids);
    } else {
      node = linkNode(key, cls, kids);
      if (!link.url) node.removeAttribute('aria-label');
    }
    node.insertAdjacentHTML('afterbegin', ICONS[key] || '');
    return node;
  }
  function buildActions() {
    $$('[data-actions]').forEach(function (box) {
      box.textContent = '';
      var short = box.hasAttribute('data-short');
      box.getAttribute('data-actions').split(/\s+/).forEach(function (key) {
        var b = actionButton(key, short);
        if (b) box.appendChild(b);
      });
    });
  }

  function buildNotList() {
    var list = $('[data-not-list]');
    var items = get('about.not');
    if (!list || !Array.isArray(items)) return;
    list.textContent = '';
    items.forEach(function (t, i) {
      var li = el('li', { 'data-reveal': '' }, [document.createTextNode('Not '), el('s', { text: t + '.' })]);
      li.style.setProperty('--d', i);
      list.appendChild(li);
    });
  }

  // The contract address and network, wherever they appear.
  function buildContract() {
    var addr = get('contract.address') || '';
    $$('[data-contract]').forEach(function (n) {
      var short = n.hasAttribute('data-contract-short') && addr.length > 14;
      n.textContent = addr ? (short ? addr.slice(0, 6) + '…' + addr.slice(-4) : addr) : 'Not published yet';
      n.classList.toggle('is-placeholder', !addr);
      if (addr) n.setAttribute('title', addr);
    });
    $$('[data-network]').forEach(function (n) {
      var name = get('network.name') || '';
      n.textContent = name;
      n.classList.toggle('is-placeholder', isPlaceholder(name));
    });
  }

  function copyButton(label) {
    return el('button', { class: 'copy-btn mono', type: 'button', 'data-copy-contract': '', text: label || 'Copy' });
  }

  // Beginner guide; steps with an action get the real control inline, so the
  // reader never has to scroll away to copy the address or find the buy link.
  function buildSteps() {
    var list = $('[data-steps]');
    var steps = get('howToBuy.steps');
    if (!list || !Array.isArray(steps)) return;
    list.textContent = '';
    steps.forEach(function (st, i) {
      var body = el('div', { class: 'step-body' }, [
        el('h3', {}, [placeholderText(fill(st.title))]),
        el('p', {}, [placeholderText(fill(st.body))]),
      ]);
      if (st.action === 'copy') {
        var ca = el('div', { class: 'step-ca' }, [
          el('code', { class: 'step-ca-value', 'data-contract': '', 'data-contract-short': '' }),
          copyButton('Copy'),
        ]);
        body.appendChild(ca);
      }
      if (st.action === 'buy') {
        var buy = el('button', { class: 'btn-buy step-buy', type: 'button', 'data-buy': '' }, [
          document.createTextNode(get('links.buy.label') || 'Buy'),
        ]);
        body.appendChild(buy);
      }
      var li = el('li', { class: 'step', 'data-reveal': '' }, [el('span', { class: 'step-num', 'aria-hidden': 'true', text: String(i + 1) }), body]);
      li.style.setProperty('--d', i);
      list.appendChild(li);
    });
  }

  // Official details: one card a careful buyer can check everything against.
  function buildReceipt() {
    var rows = $('[data-receipt-rows]');
    if (rows) {
      rows.textContent = '';
      var addRow = function (label, valueNode, extra) {
        var dd = el('dd', {}, [valueNode]);
        if (extra) dd.appendChild(extra);
        rows.appendChild(el('div', {}, [el('dt', { text: label }), dd]));
      };
      addRow('Ticker', document.createTextNode(get('brand.ticker') || ''));
      addRow('Network', el('span', { 'data-network': '' }));
      addRow('Contract', el('span', { 'data-contract': '', 'data-contract-short': '' }), copyButton('Copy'));
      addRow('Buy on', placeholderText(get('links.buy.venue') || ''));
      (get('token.rows') || []).forEach(function (r) {
        var proof = r.proof ? el('a', { class: 'r-proof', href: r.proof, target: '_blank', rel: 'noopener noreferrer', text: 'verify ↗' }) : null;
        addRow(r.label, placeholderText(r.value), proof);
      });
      buildContract();
    }
    var links = $('[data-receipt-links]');
    if (links) {
      links.textContent = '';
      ['buy', 'chart', 'explorer'].forEach(function (key) {
        var link = (cfg.links || {})[key];
        if (!link) return;
        var label = key === 'buy' ? 'Buy' : link.label;
        var kids = [document.createTextNode(label + (link.url ? ' ↗' : ''))];
        if (!link.url) kids.push(el('span', { class: 'tbd', text: 'TBD' }));
        var node = key === 'buy' && !link.url
          ? el('button', { type: 'button', 'data-buy': '' }, kids)
          : linkNode(key, '', kids);
        links.appendChild(el('li', {}, [node]));
      });
    }
  }

  function buildFootLinks() {
    var list = $('[data-foot-links]');
    if (!list) return;
    list.textContent = '';
    ['x', 'telegram', 'chart', 'explorer'].forEach(function (key) {
      var link = (cfg.links || {})[key];
      if (!link) return;
      var kids = [document.createTextNode(link.label + (link.url ? ' ↗' : ''))];
      if (!link.url) kids.push(el('span', { class: 'tbd', text: 'TBD' }));
      list.appendChild(el('li', {}, [linkNode(key, '', kids)]));
    });
  }

  function buildTabs() {
    var list = $('[data-tabs]');
    if (!list) return;
    list.textContent = '';
    ['x', 'telegram', 'chart'].forEach(function (key) {
      var link = (cfg.links || {})[key];
      if (!link) return;
      var meta = link.url ? (link.handle || 'Open') : 'Placeholder';
      list.appendChild(el('li', {}, [linkNode(key, 'tab', [
        el('span', { class: 'tab-name', text: link.label }),
        el('span', { class: 'tab-meta', text: meta }),
      ])]));
    });
  }

  // Give a cloned SVG its own ids so its clip paths do not collide with
  // (or silently resolve to) the original's.
  function cloneSvgWithIds(source, suffix) {
    var copy = source.cloneNode(true);
    var map = {};
    $$('[id]', copy).forEach(function (n) { map[n.id] = n.id + suffix; n.id = map[n.id]; });
    $$('*', copy).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var v = a.value.replace(/url\(#([^)]+)\)/g, function (m, id) { return map[id] ? 'url(#' + map[id] + ')' : m; });
        if (v !== a.value) n.setAttribute(a.name, v);
      });
    });
    return copy;
  }

  function buildArt() {
    var btn = $('[data-deane]');
    var portrait = $('[data-portrait]');
    var art = btn && $('svg', btn);
    var src = get('deane.src');
    var alt = get('deane.alt') || '';

    if (src && btn && art) {
      btn.replaceChild(el('img', { class: 'deane-img', src: src, alt: alt, decoding: 'async' }), art);
      if (portrait) portrait.appendChild(el('img', { src: src, alt: '', loading: 'lazy', decoding: 'async' }));
      return;
    }
    if (art && alt) { var t = $('title', art); if (t) t.textContent = alt; }
    if (art && portrait) {
      var copy = cloneSvgWithIds(art, '-poster');
      copy.removeAttribute('role');
      copy.removeAttribute('aria-labelledby');
      var title = $('title', copy);
      if (title) title.remove();
      portrait.appendChild(copy);
    }
  }

  /* ─────────────── 2. Entrance + reveals ─────────────── */

  function startEntrance() {
    var go = function () { fitWordmark(); requestAnimationFrame(function () { root.classList.add('is-ready'); }); };
    var timer = setTimeout(go, 700);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { clearTimeout(timer); go(); });
    }
    var resizeFrame = 0;
    on(window, 'resize', function () {
      if (!resizeFrame) resizeFrame = requestAnimationFrame(function () { resizeFrame = 0; fitWordmark(); });
    }, { passive: true });
  }

  function setupReveals() {
    var targets = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    targets.forEach(function (t) { io.observe(t); });
    observers.push(io);
  }

  /* ─────────────── 3. Navigation ─────────────── */

  function setupNav() {
    var nav = $('[data-nav]');
    if (!nav) return;
    var ticking = false;
    // The nav never hides: it carries the Buy button, which must stay one tap away.
    var update = function () {
      ticking = false;
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

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
    var focusables = function () { return [toggle].concat($$('a, button', menu)); };

    var open = function () {
      clearTimeout(closeTimer);
      menu.hidden = false;
      void menu.offsetWidth; // commit the closed state so the transition runs
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
      closeTimer = setTimeout(function () { menu.hidden = true; }, reduceMotion ? 0 : 520);
      if (returnFocus) toggle.focus();
    };

    on(toggle, 'click', function () { toggle.getAttribute('aria-expanded') === 'true' ? close(false) : open(); });
    on(menu, 'click', function (e) { if (e.target.closest('a, [data-buy]')) close(false); });
    on(document, 'keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    on(window.matchMedia('(min-width: 961px)'), 'change', function (e) { if (e.matches) close(false); });
  }

  /* ─────────────── 4. Links, buy, copy ─────────────── */

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]');
    if (!t) return;
    clearTimeout(toastTimer);
    t.hidden = true;
    t.textContent = msg;
    void t.offsetWidth;
    t.hidden = false;
    toastTimer = setTimeout(function () { t.hidden = true; }, 3400);
  }

  function setupActions() {
    var dialog = $('[data-notice]');
    on(document, 'click', function (e) {
      var tab = e.target.closest('.tab');
      if (tab && !reduceMotion) {
        tab.classList.remove('is-torn');
        void tab.offsetWidth;
        tab.classList.add('is-torn');
      }

      if (e.target.closest('[data-buy]')) {
        var url = get('links.buy.url');
        if (!cfg.preview && url) { window.open(url, '_blank', 'noopener'); return; }
        if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
        else toast('The buy link hasn’t been posted yet.');
        return;
      }
      var ph = e.target.closest('[data-placeholder-link]');
      if (ph) {
        toast(ph.getAttribute('data-placeholder-link') + ' link isn’t posted yet. It goes here once it’s official.');
        return;
      }
      var copyBtn = e.target.closest('[data-copy-contract]');
      if (copyBtn) copyContract(copyBtn);
      if (e.target.closest('[data-close-notice]') && dialog && dialog.open) dialog.close();
    });
    on(document, 'animationend', function (e) {
      if (e.target.classList && e.target.classList.contains('is-torn')) e.target.classList.remove('is-torn');
    });
    if (dialog) on(dialog, 'click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  function copyContract(btn) {
    var addr = get('contract.address');
    if (!addr) { toast('No contract address has been posted yet, so there’s nothing to copy.'); return; }
    var done = function () {
      toast('Contract copied. Check the first and last characters before you swap.');
      if (!btn) return;
      var label = btn.textContent;
      btn.textContent = 'Copied ✓';
      btn.classList.add('is-copied');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('is-copied'); }, 1800);
    };
    var select = function () {
      var code = $('[data-contract]');
      var range = document.createRange();
      range.selectNodeContents(code);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast('Address selected. Press Ctrl+C or Cmd+C to copy.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, select);
    else select();
  }

  /* ─────────────── 5. Deane ─────────────── */

  function setupDeane() {
    var btn = $('[data-deane]');
    var bubble = $('[data-bubble]');
    var note = $('.hero-note');

    // His eyes follow the pointer (or the last tap). Positions are cached and
    // refreshed on scroll/resize; work happens at most once per frame.
    var pupils = [];
    var refresh = function () {
      pupils = [];
      $$('svg.deane, .p-photo svg').forEach(function (svg) {
        var r = svg.getBoundingClientRect();
        var vb = svg.viewBox && svg.viewBox.baseVal;
        if (!vb || !r.width || r.bottom < 0 || r.top > window.innerHeight) return;
        $$('.pupil', svg).forEach(function (p) {
          pupils.push({
            node: p,
            range: Number(p.getAttribute('data-pupil')) || 8,
            x: r.left + (Number(p.getAttribute('cx')) / vb.width) * r.width,
            y: r.top + (Number(p.getAttribute('cy')) / vb.height) * r.height,
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
        var k = Math.min(1, d / 240) * p.range;
        p.node.style.transform = 'translate(' + (dx / d * k).toFixed(1) + 'px,' + (dy / d * k).toFixed(1) + 'px)';
      });
    };
    var point = function (e) {
      target = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(render);
    };
    var refreshSoon = function () {
      if (!frame) frame = requestAnimationFrame(function () { frame = 0; refresh(); render(); });
    };
    refresh();
    on(window, 'pointermove', point, { passive: true });
    on(window, 'pointerdown', point, { passive: true });
    on(window, 'scroll', refreshSoon, { passive: true });
    on(window, 'resize', refreshSoon, { passive: true });

    // Poke him and he talks back.
    if (!btn) return;
    var lines = get('deane.lines') || ['gm.'];
    var count = 0, hideTimer, unpoke;
    on(btn, 'click', function () {
      var line = lines[Math.min(count, lines.length - 1)];
      count += 1;
      btn.classList.remove('is-poked');
      void btn.offsetWidth;
      btn.classList.add('is-poked');
      clearTimeout(unpoke);
      unpoke = setTimeout(function () { btn.classList.remove('is-poked'); }, 700);
      if (!bubble) return;
      bubble.hidden = true;
      bubble.textContent = line;
      void bubble.offsetWidth;
      bubble.hidden = false;
      if (note) note.style.visibility = 'hidden';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        bubble.hidden = true;
        if (note) note.style.visibility = '';
      }, 2600);
    });
  }

  // Phone dock: shows Buy + Telegram once the hero buttons are off screen,
  // and gets out of the way while the menu is open.
  function setupDock() {
    var dock = $('[data-dock]');
    var hero = $('[data-hero-actions]');
    if (!dock || !hero || !('IntersectionObserver' in window)) return;
    var set = function (show) {
      dock.classList.toggle('is-shown', show);
      dock.inert = !show;
      document.body.classList.toggle('dock-on', show);
    };
    set(false);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // Off screen *above* the viewport (scrolled past) or below it on very
        // short screens: either way the reader can't see the big buttons.
        set(!e.isIntersecting);
      });
    }, { threshold: 0 });
    io.observe(hero);
    observers.push(io);
  }

  /* ─────────────── boot ─────────────── */

  applyConfig();
  setupReveals();
  setupNav();
  setupMenu();
  setupActions();
  setupDeane();
  setupDock();
  startEntrance();

  on(window, 'pagehide', function (e) {
    if (e.persisted) return; // kept in bfcache: keep everything alive
    observers.forEach(function (o) { o.disconnect(); });
    lifetime.abort();
  });
})();
