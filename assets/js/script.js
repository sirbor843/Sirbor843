'use strict';

(function () {
  const S = window.SITE;
  const P = S.profile;

  /* ---------------------------------------------------------------- utils */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const motionOff = () => document.documentElement.getAttribute('data-motion') === 'off';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || motionOff();
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const storage = {
    get(k) {
      try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, v); } catch (e) { /* private mode */ }
    }
  };

  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(P.email);
      toast('Email copied — ' + P.email);
    } catch (e) {
      location.href = 'mailto:' + P.email;
    }
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  const yearsShipping = () =>
    Math.floor((Date.now() - new Date(P.careerStart).getTime()) / (365.25 * 864e5));

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  function timeAgo(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, n] of units) {
      const v = Math.floor(s / n);
      if (v >= 1) return v + ' ' + u + (v > 1 ? 's' : '') + ' ago';
    }
    return 'just now';
  }

  /* -------------------------------------------------------- print résumé */

  // print = résumé: expand every role while printing, restore afterwards
  let openBeforePrint = [];
  addEventListener('beforeprint', () => {
    openBeforePrint = $$('.xp details').map((d) => d.open);
    $$('.xp details').forEach((d) => (d.open = true));
  });
  addEventListener('afterprint', () => {
    $$('.xp details').forEach((d, i) => (d.open = openBeforePrint[i]));
  });

  function printResume() {
    toast('Choose “Save as PDF” to download');
    setTimeout(() => print(), 400);
  }
  $$('[data-print-resume]').forEach((b) => b.addEventListener('click', printResume));

  /* ---------------------------------------------------------------- theme */

  const themeListeners = [];

  const themeMeta = $('meta[name="theme-color"]');

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeMeta.setAttribute('content', t === 'dark' ? '#0a0c10' : '#f6f7f9');
    storage.set('theme', t);
    themeListeners.forEach((fn) => fn(t));
  }

  const currentTheme = () => document.documentElement.getAttribute('data-theme');
  const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');

  $('[data-theme-toggle]').addEventListener('click', toggleTheme);

  /* ------------------------------------------------------------ customize */

  const ACCENTS = ['teal', 'violet', 'blue', 'amber', 'rose'];
  const customize = $('[data-customize]');
  const customizeBtn = $('[data-customize-toggle]');

  function syncCustomize() {
    const accent = document.documentElement.getAttribute('data-accent') || 'teal';
    $$('[data-accent-choice]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.accentChoice === accent)));
    $$('[data-theme-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === currentTheme())));
    $$('[data-motion-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.motionChoice === (motionOff() ? 'off' : 'full'))));
  }

  function setAccent(a) {
    if (!ACCENTS.includes(a)) return false;
    if (a === 'teal') document.documentElement.removeAttribute('data-accent');
    else document.documentElement.setAttribute('data-accent', a);
    storage.set('accent', a);
    themeListeners.forEach((fn) => fn(currentTheme())); // repaint canvas-drawn parts
    syncCustomize();
    return true;
  }

  function setMotion(m) {
    if (m === 'off') document.documentElement.setAttribute('data-motion', 'off');
    else document.documentElement.removeAttribute('data-motion');
    storage.set('motion', m === 'off' ? 'off' : 'full');
    syncCustomize();
  }

  function openCustomize(open = customize.hidden) {
    customize.hidden = !open;
    customizeBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      syncCustomize();
      ($('[aria-checked="true"]', customize) || $('button', customize)).focus();
    }
  }

  customizeBtn.addEventListener('click', () => openCustomize());
  customize.addEventListener('click', (e) => {
    const a = e.target.closest('[data-accent-choice]');
    const t = e.target.closest('[data-theme-choice]');
    const m = e.target.closest('[data-motion-choice]');
    if (a) setAccent(a.dataset.accentChoice);
    if (t) setTheme(t.dataset.themeChoice);
    if (m) setMotion(m.dataset.motionChoice);
  });
  // arrow keys move between accent swatches, like a radio group
  $('[data-swatches]').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const list = $$('[data-accent-choice]');
    const i = list.indexOf(document.activeElement);
    const next = list[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + list.length) % list.length];
    next.focus();
    setAccent(next.dataset.accentChoice);
  });
  document.addEventListener('click', (e) => {
    if (!customize.hidden && !customize.contains(e.target) && !customizeBtn.contains(e.target)) openCustomize(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !customize.hidden) {
      openCustomize(false);
      customizeBtn.focus();
    }
  });
  themeListeners.push(syncCustomize);
  themeMeta.setAttribute('content', currentTheme() === 'dark' ? '#0a0c10' : '#f6f7f9');

  /* ------------------------------------------------------- header & nav */

  const progress = $('[data-scroll-progress]');

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // soft accent glow that follows the cursor (mouse only, skipped when motion is reduced)
  const spotlight = $('[data-spotlight]');
  if (matchMedia('(pointer: fine)').matches) {
    let frame = 0;
    addEventListener(
      'pointermove',
      (e) => {
        if (motionOff() || reducedMotion) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          spotlight.style.setProperty('--x', e.clientX + 'px');
          spotlight.style.setProperty('--y', e.clientY + 'px');
          spotlight.classList.add('on');
        });
      },
      { passive: true }
    );
  }

  // highlight the nav link for the last section whose top passed 40% of the viewport
  const navLinks = $$('[data-nav-link]');
  const navSections = navLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let navFrame = 0;
  function updateActiveNav() {
    const line = innerHeight * 0.4;
    let current = navSections[0];
    for (const sec of navSections) if (sec.getBoundingClientRect().top <= line) current = sec;
    // at the very bottom, the last section wins even if it's short
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = navSections[navSections.length - 1];
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  }
  addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(navFrame);
      navFrame = requestAnimationFrame(updateActiveNav);
    },
    { passive: true }
  );
  addEventListener('resize', updateActiveNav);
  updateActiveNav();

  $$('[data-mod-key]').forEach((k) => (k.textContent = isMac ? '⌘K' : 'Ctrl K'));
  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', copyEmail));
  $('[data-year]').textContent = new Date().getFullYear();
  $('[data-years]').textContent = yearsShipping();

  /* ---------------------------------------------------------- local time */

  function tickClock() {
    const t = new Date().toLocaleTimeString('en-GB', {
      timeZone: P.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    $$('[data-local-time]').forEach((el) => (el.textContent = t));
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* --------------------------------------------------------- typed roles */

  (function typed() {
    const el = $('[data-typed]');
    const words = S.roles;
    let i = 0;

    if (reducedMotion) {
      setInterval(() => (el.textContent = words[(i = (i + 1) % words.length)]), 3500);
      return;
    }

    let text = words[0];
    let deleting = false;
    function step() {
      if (motionOff()) {
        // motion turned off in Customize: swap whole words, slowly
        el.textContent = words[(i = (i + 1) % words.length)];
        text = el.textContent;
        deleting = false;
        return setTimeout(step, 3500);
      }
      const target = words[i];
      if (!deleting) {
        text = target.slice(0, text.length + 1);
        el.textContent = text;
        if (text === target) {
          deleting = true;
          return setTimeout(step, 2200);
        }
        return setTimeout(step, 55);
      }
      text = text.slice(0, -1);
      el.textContent = text;
      if (!text) {
        deleting = false;
        i = (i + 1) % words.length;
        return setTimeout(step, 300);
      }
      setTimeout(step, 28);
    }
    setTimeout(() => {
      deleting = true;
      step();
    }, 2600);
  })();

  /* ---------------------------------------------- simulated telemetry */

  (function telemetry() {
    const canvas = $('[data-spark]');
    const readout = $('[data-spark-readout]');
    const log = $('[data-console-log]');
    const N = 60;
    const series = [];
    let hover = -1;
    let base = 42;

    for (let k = 0; k < N; k++) series.push(next());

    function next() {
      base += (42 - base) * 0.15 + (Math.random() - 0.5) * 4;
      let v = base + Math.random() * 6;
      if (Math.random() < 0.04) v += 25 + Math.random() * 30; // occasional tail spike
      return Math.max(18, Math.round(v));
    }

    function draw() {
      const dpr = devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const pad = { t: 8, r: 4, b: 16, l: 28 };
      const max = Math.max(100, ...series);
      const x = (k) => pad.l + (k / (N - 1)) * (w - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      const accent = cssVar('--accent');
      const muted = cssVar('--muted');

      // recessive grid + y ticks
      ctx.strokeStyle = cssVar('--chart-grid');
      ctx.lineWidth = 1;
      ctx.fillStyle = muted;
      ctx.font = '10px ' + cssVar('--font-mono');
      ctx.textBaseline = 'middle';
      [0, 50, 100].forEach((t) => {
        if (t > max) return;
        ctx.beginPath();
        ctx.moveTo(pad.l, Math.round(y(t)) + 0.5);
        ctx.lineTo(w - pad.r, Math.round(y(t)) + 0.5);
        ctx.stroke();
        ctx.fillText(String(t), 0, y(t));
      });

      // area + 2px line
      ctx.beginPath();
      series.forEach((v, k) => (k ? ctx.lineTo(x(k), y(v)) : ctx.moveTo(x(k), y(v))));
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.lineTo(x(N - 1), y(0));
      ctx.lineTo(x(0), y(0));
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.globalAlpha = 1;

      // crosshair
      const k = hover >= 0 ? hover : N - 1;
      if (hover >= 0) {
        ctx.strokeStyle = muted;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x(k), pad.t);
        ctx.lineTo(x(k), h - pad.b);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(x(k), y(series[k]), 4, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = cssVar('--surface');
      ctx.stroke();

      ctx.fillStyle = muted;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('-60s', pad.l, h - 2);
      ctx.textAlign = 'right';
      ctx.fillText('now', w - pad.r, h - 2);
      ctx.textAlign = 'left';

      const ago = N - 1 - k;
      readout.textContent = (ago ? '−' + ago + 's · ' : 'now · ') + series[k] + ' ms';
    }

    function pick(evt) {
      const r = canvas.getBoundingClientRect();
      const px = (evt.touches ? evt.touches[0].clientX : evt.clientX) - r.left;
      const frac = (px - 28) / (r.width - 32);
      hover = Math.max(0, Math.min(N - 1, Math.round(frac * (N - 1))));
      draw();
    }
    canvas.addEventListener('mousemove', pick);
    canvas.addEventListener('touchmove', pick, { passive: true });
    canvas.addEventListener('mouseleave', () => {
      hover = -1;
      draw();
    });

    const paths = ['POST /v1/payments', 'GET /v1/payments/:id', 'POST /webhooks/stripe', 'POST /callbacks/mpesa', 'GET /v1/merchants/:id'];
    const lines = [];
    function logLine() {
      const t = new Date().toLocaleTimeString('en-GB');
      const r = Math.random();
      let line;
      if (r < 0.55) {
        const p = paths[Math.floor(Math.random() * paths.length)];
        const code = p.startsWith('POST /v1') ? 201 : 200;
        line = '<span class="muted">' + t + '</span> <span class="ok">' + code + '</span> ' + p + ' <span class="muted">' + series[N - 1] + 'ms</span>';
      } else if (r < 0.75) {
        line = '<span class="muted">' + t + '</span> <span class="info">cache</span> HIT merchant:' + Math.floor(1000 + Math.random() * 9000);
      } else if (r < 0.9) {
        line = '<span class="muted">' + t + '</span> <span class="info">idem</span> duplicate webhook dropped';
      } else {
        line = '<span class="muted">' + t + '</span> <span class="ok">reconcile</span> batch ok · 0 discrepancies';
      }
      lines.push(line);
      if (lines.length > 6) lines.shift();
      log.innerHTML = lines.join('\n');
    }

    function tick() {
      series.push(next());
      series.shift();
      if (hover >= 0) hover = Math.max(0, hover - 1);
      $('[data-tele="latency"]').textContent = series[N - 1];
      $('[data-tele="rps"]').textContent = (1150 + Math.round(Math.random() * 260)).toLocaleString();
      $('[data-tele="hit"]').textContent = (94 + Math.random() * 3).toFixed(1);
      logLine();
      draw();
    }

    tick();
    for (let k = 0; k < 4; k++) logLine();

    // pause while the console is off-screen or the tab is hidden
    let onScreen = true;
    new IntersectionObserver((e) => (onScreen = e[0].isIntersecting)).observe(canvas);
    setInterval(() => {
      if (onScreen && !document.hidden) tick();
    }, reducedMotion ? 3000 : 1000);
    addEventListener('resize', draw);
    themeListeners.push(() => draw());
  })();

  /* ------------------------------------------------------------ count up */

  const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const end = +e.target.dataset.count;
      if (reducedMotion) return (e.target.textContent = end);
      const t0 = performance.now();
      (function frame(now) {
        const p = Math.min(1, (now - t0) / 1200);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame);
      })(t0);
    });
  });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ----------------------------------------------- service hover glow */

  $$('.service').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  /* ------------------------------------------------------------ projects */

  const projectList = $('[data-projects]');
  const projectEmpty = $('[data-projects-empty]');
  const projectSearch = $('[data-project-search]');
  const activeSkillEl = $('[data-active-skill]');
  const CATEGORY_LABEL = { data: 'Data & ML', systems: 'Systems', apps: 'Apps' };
  const projectState = { filter: 'all', query: '', skill: null };

  const lc = (s) => s.toLowerCase();

  // projects without a real screenshot get a generated code cover
  function projectMedia(p, cls) {
    if (p.image) return `<div class="${cls}"><img src="./assets/images/${p.image}" alt="" loading="lazy" />`;
    const lines = p.cover
      .map((l) => {
        const t = l.trimStart();
        const kind = /^(#|\/\/|--)/.test(t) ? 'c-comment' : t.startsWith('$') ? 'c-prompt' : '';
        return `<span class="${kind}">${esc(l)}</span>`;
      })
      .join('\n');
    return `<div class="${cls} cover cover-${p.category}" aria-hidden="true"><pre>${lines}</pre>`;
  }

  function projectMatches(p) {
    if (projectState.filter !== 'all' && p.category !== projectState.filter) return false;
    if (projectState.skill && !p.stack.some((t) => lc(t) === lc(projectState.skill))) return false;
    const q = projectState.query.trim().toLowerCase();
    if (!q) return true;
    const hay = lc([p.title, p.summary, p.stack.join(' '), CATEGORY_LABEL[p.category]].join(' '));
    return q.split(/\s+/).every((tok) => hay.includes(tok));
  }

  function renderProjects() {
    const items = S.projects.filter(projectMatches);
    projectList.innerHTML = items
      .map(
        (p, idx) => `
      <li class="card project" style="animation-delay:${idx * 40}ms">
        <button class="project-open" type="button" data-open-project="${p.id}" aria-label="Open ${esc(p.title)} details">
          ${projectMedia(p, 'project-media')}
            <span class="project-badge">${CATEGORY_LABEL[p.category]}</span>
          </div>
          <div class="project-body">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.summary)}</p>
            <div class="tags">${p.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          </div>
        </button>
      </li>`
      )
      .join('');
    projectEmpty.hidden = items.length > 0;
    decorateProjects();

    if (projectState.skill) {
      activeSkillEl.hidden = false;
      activeSkillEl.innerHTML =
        'Showing projects using <span class="tag">' + esc(projectState.skill) + '</span>' +
        '<button type="button" data-clear-skill><ion-icon name="close-circle-outline"></ion-icon>clear</button>';
    } else {
      activeSkillEl.hidden = true;
    }
  }

  function setProjectFilter(f) {
    projectState.filter = f;
    $$('[data-project-filters] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
    renderProjects();
  }

  function setProjectSkill(skill) {
    projectState.skill = skill;
    setProjectFilter('all');
  }

  $$('[data-project-filters] button').forEach((b) => b.addEventListener('click', () => setProjectFilter(b.dataset.filter)));
  projectSearch.addEventListener('input', () => {
    projectState.query = projectSearch.value;
    renderProjects();
  });
  activeSkillEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-skill]')) setProjectSkill(null);
  });
  projectList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-project]');
    if (btn) openProject(btn.dataset.openProject);
  });

  /* ------------------------------------------------------- project modal */

  const modal = $('[data-project-modal]');
  const modalBody = $('[data-modal-body]');

  function openProject(id) {
    const p = S.projects.find((x) => x.id === id);
    if (!p) return;
    history.replaceState(null, '', '#project/' + p.id);
    modalBody.innerHTML = `
      ${projectMedia(p, 'modal-hero')}</div>
      <div class="modal-content">
        <span class="tag">${CATEGORY_LABEL[p.category]}</span>
        <h2 id="modal-title">${esc(p.title)}</h2>
        <p>${esc(p.summary)}</p>
        <h3>Highlights</h3>
        <ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <h3>Stack</h3>
        <div class="tags">${p.stack.map((t) => `<button type="button" class="tag" data-modal-skill="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div class="modal-actions">
          <a class="btn btn-primary" href="${p.repo}" target="_blank" rel="noopener noreferrer">
            <ion-icon name="logo-github"></ion-icon> View on GitHub
          </a>
          <a class="btn btn-ghost" href="#contact" data-modal-contact>
            <ion-icon name="chatbubbles-outline"></ion-icon> Discuss this project
          </a>
        </div>
      </div>`;
    modal.showModal();
  }

  $('[data-modal-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    if (location.hash.startsWith('#project/')) history.replaceState(null, '', '#work');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) return modal.close();
    if (e.target.closest('[data-modal-contact]')) return modal.close();
    const skillBtn = e.target.closest('[data-modal-skill]');
    if (skillBtn) {
      modal.close();
      selectSkill(skillBtn.dataset.modalSkill);
      scrollToId('skills');
    }
  });

  /* -------------------------------------------------------- architecture */

  (function architecture() {
    const tabs = $('[data-arch-tabs]');
    const flow = $('[data-arch-flow]');
    const caption = $('[data-arch-caption]');
    const detail = $('[data-arch-detail]');

    tabs.innerHTML = S.architectures
      .map((a, i) => `<button type="button" aria-pressed="${i === 0}" data-arch="${a.id}">${esc(a.label)}</button>`)
      .join('');

    function showNode(arch, nodeId) {
      for (const st of arch.stages) {
        const n = st.nodes.find((x) => x.id === nodeId);
        if (!n) continue;
        $$('.arch-node', flow).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.node === nodeId)));
        detail.innerHTML = '<strong>' + esc(st.name) + ' › ' + esc(n.label) + '</strong>' + esc(n.detail);
      }
    }

    function render(id) {
      const arch = S.architectures.find((a) => a.id === id);
      $$('button', tabs).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.arch === id)));
      caption.textContent = arch.caption;
      flow.innerHTML = arch.stages
        .map(
          (st, i) => `
        <div class="arch-stage" style="animation-delay:${i * 70}ms">
          <span class="arch-stage-name">${String(i + 1).padStart(2, '0')} · ${esc(st.name)}</span>
          <div class="arch-stage-nodes">
            ${st.nodes.map((n) => `<button type="button" class="arch-node" aria-pressed="false" data-node="${n.id}">${esc(n.label)}</button>`).join('')}
          </div>
        </div>`
        )
        .join('');
      flow.onclick = (e) => {
        const b = e.target.closest('[data-node]');
        if (b) showNode(arch, b.dataset.node);
      };
      showNode(arch, arch.stages[0].nodes[0].id);
    }

    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-arch]');
      if (b) render(b.dataset.arch);
    });
    render(S.architectures[0].id);
  })();

  /* ---------------------------------------------------------- experience */

  // bold the quantified outcomes so they scan
  const emphasize = (s) =>
    esc(s).replace(/(over \d+%|\d+%\+?|halving [a-z ]+discrepancies|millions of daily [a-z ]+events|minutes rather than hours|dozens of engineering hours)/gi, '<strong>$1</strong>');

  const SHOWN_BULLETS = 3;
  $('[data-experience]').innerHTML = S.experience
    .map((j) => {
      const more = j.bullets.slice(SHOWN_BULLETS);
      return `
    <li class="xp">
      <p class="xp-date mono">${esc(j.start)} — ${esc(j.end)}</p>
      <div class="xp-body">
        <h3>${esc(j.title)} <span class="xp-at">· ${esc(j.company)}</span></h3>
        <p class="xp-meta">${esc(j.domain)} · ${esc(j.location)}</p>
        <ul>${j.bullets.slice(0, SHOWN_BULLETS).map((b) => `<li>${emphasize(b)}</li>`).join('')}</ul>
        ${more.length
          ? `<details><summary>${more.length} more</summary><ul>${more.map((b) => `<li>${emphasize(b)}</li>`).join('')}</ul></details>`
          : ''}
        <div class="tags">${j.stack.map((t) => `<button type="button" class="tag" data-pick-skill="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      </div>
    </li>`;
    })
    .join('');

  $('[data-education]').innerHTML = S.education
    .map(
      (e) => `
    <li class="card">
      <h4>${esc(e.name)}</h4>
      <p class="edu-detail">${esc(e.detail)}</p>
      <p>${esc(e.text)}</p>
    </li>`
    )
    .join('');

  $('[data-experience]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick-skill]');
    if (b) {
      selectSkill(b.dataset.pickSkill);
      scrollToId('skills');
    }
  });

  /* -------------------------------------------------------------- skills */

  const skillPanel = $('[data-skill-panel]');
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function skillUsage(skill) {
    const re = new RegExp('(^|[^A-Za-z])' + reEsc(skill) + '(?![A-Za-z])');
    const inStack = (arr) => arr.some((t) => lc(t) === lc(skill));
    return {
      jobs: S.experience.filter((j) => inStack(j.stack) || j.bullets.some((b) => re.test(b))),
      projects: S.projects.filter((p) => inStack(p.stack))
    };
  }

  $('[data-skills]').innerHTML = S.skills
    .map(
      (g) => `
    <div class="skill-group">
      <h3>${esc(g.group)}</h3>
      <div>${g.items
        .map((s) => {
          const u = skillUsage(s);
          const n = u.jobs.length + u.projects.length;
          return `<button type="button" class="skill" aria-pressed="false" data-skill="${esc(s)}">${esc(s)}${n ? `<span class="count">${n}</span>` : ''}</button>`;
        })
        .join('')}</div>
    </div>`
    )
    .join('');

  function selectSkill(skill) {
    $$('[data-skill]').forEach((b) => b.setAttribute('aria-pressed', String(lc(b.dataset.skill) === lc(skill))));
    const u = skillUsage(skill);
    const group = S.skills.find((g) => g.items.some((s) => lc(s) === lc(skill)));
    let html = `<p class="eyebrow">${esc(group ? group.group : 'skill')}</p><h3>${esc(skill)}</h3>`;
    if (!u.jobs.length && !u.projects.length) {
      html += '<p class="muted">Part of my toolkit — no public write-up here yet. Ask me about it on a call.</p>';
    }
    if (u.jobs.length) {
      html += '<h4>Roles</h4><ul>' + u.jobs.map((j) => `<li>${esc(j.title)} · ${esc(j.company)} <span class="muted mono">${esc(j.start)}–${esc(j.end)}</span></li>`).join('') + '</ul>';
    }
    if (u.projects.length) {
      html += '<h4>Projects</h4><ul>' + u.projects.map((p) => `<li>${esc(p.title)}</li>`).join('') + '</ul>';
      html += `<button type="button" class="link-btn" data-show-projects="${esc(skill)}">Show these projects <ion-icon name="arrow-forward-outline"></ion-icon></button>`;
    }
    skillPanel.innerHTML = html;
  }

  $('[data-skills]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-skill]');
    if (b) selectSkill(b.dataset.skill);
  });
  skillPanel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-show-projects]');
    if (b) {
      setProjectSkill(b.dataset.showProjects);
      scrollToId('work');
    }
  });

  /* ------------------------------------------------------------- writing */

  $('[data-posts]').innerHTML = S.writing
    .map(
      (w) => `
    <li class="post">
      <a href="${w.url}" target="_blank" rel="noopener noreferrer">
        <time datetime="${w.date}">${formatDate(w.date)}</time>
        <div>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.summary)}</p>
        </div>
        <span class="post-cat">${esc(w.category)}</span>
      </a>
    </li>`
    )
    .join('');

  /* -------------------------------------------------------------- github */

  const GH_CACHE_KEY = 'gh-cache-v1';
  const GH_TTL = 60 * 60 * 1000;

  async function loadGitHub() {
    let data;
    try {
      const cached = JSON.parse(sessionStorage.getItem(GH_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.t < GH_TTL) data = cached.data;
    } catch (e) { /* ignore */ }

    if (!data) {
      const api = 'https://api.github.com/users/' + P.handle;
      const [userRes, reposRes] = await Promise.all([fetch(api), fetch(api + '/repos?per_page=100&sort=updated')]);
      if (!userRes.ok || !reposRes.ok) throw new Error('GitHub API responded ' + (userRes.ok ? reposRes.status : userRes.status));
      const user = await userRes.json();
      const repos = await reposRes.json();
      data = {
        user: { public_repos: user.public_repos, followers: user.followers, created_at: user.created_at },
        repos: repos.map((r) => ({
          name: r.name,
          url: r.html_url,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          fork: r.fork,
          pushed_at: r.pushed_at
        }))
      };
      try { sessionStorage.setItem(GH_CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch (e) { /* ignore */ }
    }
    return data;
  }

  function renderGitHub(data) {
    const own = data.repos.filter((r) => !r.fork);
    const stars = own.reduce((s, r) => s + r.stars, 0);

    $('[data-gh-stats]').innerHTML = [
      [data.user.public_repos, 'public repositories'],
      [stars, 'stars on original repos'],
      [new Date(data.user.created_at).getFullYear(), 'on GitHub since']
    ]
      .map(([v, l]) => `<div class="stat"><span class="stat-value">${esc(v)}</span><span class="stat-label">${l}</span></div>`)
      .join('');

    // language share by primary language of original repos
    const counts = {};
    own.forEach((r) => r.language && (counts[r.language] = (counts[r.language] || 0) + 1));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    let rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (rows.length > 7) {
      const rest = rows.slice(6).reduce((s, r) => s + r[1], 0);
      rows = rows.slice(0, 6).concat([['Other', rest]]);
    }
    const maxShare = rows.length ? rows[0][1] / total : 1;
    $('[data-gh-langs]').innerHTML = rows.length
      ? rows
          .map(([lang, n]) => {
            const pct = (n / total) * 100;
            return `<div class="lang-row" tabindex="0">
              <span class="lang-name">${esc(lang)}</span>
              <div class="lang-track"><div class="lang-bar" style="width:${(pct / (maxShare * 100)) * 100}%"></div></div>
              <span class="lang-pct">${Math.round(pct)}%</span>
              <span class="lang-tip">${esc(lang)} · ${n} of ${total} repos</span>
            </div>`;
          })
          .join('')
      : '<p class="muted">No language data.</p>';

    const recent = own.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 6);
    $('[data-gh-repos]').innerHTML = recent
      .map(
        (r) => `
      <li>
        <a class="card repo" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
          <h3><ion-icon name="git-branch-outline"></ion-icon>${esc(r.name)}</h3>
          <p>${esc(r.description || 'No description provided.')}</p>
          <div class="repo-meta">
            ${r.language ? `<span><ion-icon name="code-slash-outline"></ion-icon>${esc(r.language)}</span>` : ''}
            <span><ion-icon name="star-outline"></ion-icon>${r.stars}</span>
            <span><ion-icon name="time-outline"></ion-icon>${timeAgo(r.pushed_at)}</span>
          </div>
        </a>
      </li>`
      )
      .join('');
  }

  let ghData = null;
  let ghPromise = null;
  // one request set shared by the GitHub section, project cards, and terminal
  const getGitHub = () =>
    ghPromise ||
    (ghPromise = loadGitHub().then((d) => {
      ghData = d;
      decorateProjects();
      return d;
    }));

  // live stars / language / last push on cards whose repo exists on GitHub
  function repoFor(p) {
    const m = /github\.com\/[^/]+\/([^/?#]+)/i.exec(p.repo || '');
    return m && ghData ? ghData.repos.find((r) => r.name.toLowerCase() === m[1].toLowerCase()) : null;
  }

  function decorateProjects() {
    if (!ghData) return;
    $$('[data-open-project]', projectList).forEach((btn) => {
      const p = S.projects.find((x) => x.id === btn.dataset.openProject);
      const r = p && repoFor(p);
      const body = $('.project-body', btn);
      if (!r || !body || $('.project-live', body)) return;
      // only when the repo matches the card: a language outside the stack means the link is off
      if (r.language && !p.stack.some((t) => lc(t) === lc(r.language))) return;
      body.insertAdjacentHTML(
        'beforeend',
        `<p class="project-live" title="Live from GitHub">
          ${r.stars ? `<span><ion-icon name="star-outline"></ion-icon>${r.stars}</span>` : ''}
          ${r.language ? `<span><ion-icon name="code-slash-outline"></ion-icon>${esc(r.language)}</span>` : ''}
          <span><ion-icon name="git-commit-outline"></ion-icon>updated ${timeAgo(r.pushed_at)}</span>
        </p>`
      );
    });
  }

  new IntersectionObserver(
    (entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      getGitHub().catch(() => {}); // cards simply stay without stats
    },
    { rootMargin: '400px' }
  ).observe($('#work'));

  /* ----------------------------------------------------------- build log */

  // GitHub's events API no longer carries commit messages, so read the latest
  // commits from the most recently pushed repos instead.
  const LOG_CACHE_KEY = 'gh-log-v1';

  async function loadBuildLog(data) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(LOG_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.t < GH_TTL) return cached.entries;
    } catch (e) {
      /* ignore */
    }
    const active = data.repos
      .filter((r) => !r.fork)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 4);
    const lists = await Promise.all(
      active.map(async (r) => {
        const res = await fetch(`https://api.github.com/repos/${P.handle}/${encodeURIComponent(r.name)}/commits?per_page=6`);
        if (!res.ok) return [];
        return (await res.json()).map((c) => ({
          repo: r.name,
          sha: c.sha.slice(0, 7),
          url: c.html_url,
          msg: (c.commit.message || '').split('\n')[0],
          date: c.commit.author.date
        }));
      })
    );
    const entries = lists
      .flat()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    try {
      sessionStorage.setItem(LOG_CACHE_KEY, JSON.stringify({ t: Date.now(), entries }));
    } catch (e) {
      /* ignore */
    }
    return entries;
  }

  function dayLabel(iso) {
    const d = new Date(iso);
    const key = (x) => x.toDateString();
    const today = new Date();
    const yesterday = new Date(Date.now() - 864e5);
    if (key(d) === key(today)) return 'Today';
    if (key(d) === key(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
  }

  function renderBuildLog(entries) {
    const el = $('[data-gh-log]');
    if (!entries.length) {
      el.innerHTML = '<li class="muted">No recent public commits.</li>';
      return;
    }
    let last = '';
    el.innerHTML = entries
      .map((e) => {
        const day = dayLabel(e.date);
        const head = day !== last ? `<li class="log-day">${esc(day)}</li>` : '';
        last = day;
        return `${head}<li class="log-item">
          <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">
            <span class="log-repo">${esc(e.repo)}</span>
            <span class="log-msg">${esc(e.msg)}</span>
            <span class="log-sha mono">${esc(e.sha)}</span>
          </a>
        </li>`;
      })
      .join('');
  }

  const ghObserver = new IntersectionObserver(
    (entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      getGitHub()
        .then((d) => {
          renderGitHub(d);
          loadBuildLog(d)
            .then(renderBuildLog)
            .catch(() => ($('[data-gh-log]').closest('.gh-log').hidden = true));
          return d;
        })
        .catch((err) => {
          $('[data-gh-stats]').innerHTML = '';
          $('[data-gh-langs]').closest('.gh-langs').hidden = true;
          $('[data-gh-log]').closest('.gh-log').hidden = true;
          const el = $('[data-gh-error]');
          el.hidden = false;
          el.textContent = "Couldn't reach the GitHub API right now (" + err.message + '). Browse the repositories directly instead.';
        });
    },
    { rootMargin: '400px' }
  );
  ghObserver.observe($('#github'));

  /* ----------------------------------------------------------- scheduler */

  // Native booker on Cal.com's public API (no key needed for public event
  // types; CORS is open). Falls back to the Cal.com embed if the API fails.
  (function scheduler() {
    const CAL_API = 'https://api.cal.com/v2';
    const CAL = P.cal;
    const card = $('.scheduler');
    const frame = $('[data-scheduler-frame]');
    const alt = $('[data-scheduler-alt]');
    const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone || P.timezone;
    const HORIZON_DAYS = 28;

    if (visitorTz !== P.timezone) $('[data-visitor-tz]').textContent = ' (' + visitorTz.replace(/_/g, ' ') + ')';

    // skeleton month grid while we load
    $('[data-sk-grid]').innerHTML = Array.from({ length: 35 }, (_, i) => `<span class="${i > 24 && i % 7 < 5 ? 'on' : ''}"></span>`).join('');

    async function calApi(path, version, init = {}) {
      const res = await fetch(CAL_API + path, {
        ...init,
        headers: { 'cal-api-version': version, 'Content-Type': 'application/json', ...init.headers }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.status === 'error') {
        const err = new Error((body.error && body.error.message) || body.message || 'Cal.com request failed');
        err.status = res.status;
        throw err;
      }
      return body.data;
    }

    // the configured event, or the first public one if it was renamed/removed
    let eventSlug = CAL.event;
    async function fetchEvent() {
      const list = await calApi(`/event-types?username=${encodeURIComponent(CAL.username)}`, '2024-06-14');
      const visible = (Array.isArray(list) ? list : [list]).filter((e) => e && !e.hidden);
      const et = visible.find((e) => e.slug === CAL.event) || visible[0];
      if (!et) throw new Error('no public event types');
      eventSlug = et.slug;
      return et;
    }

    // open slots from `from` (ms) for HORIZON_DAYS, flattened to ISO starts
    async function fetchSlots(from) {
      const start = new Date(from);
      const end = new Date(from + HORIZON_DAYS * 864e5);
      const day = (d) => d.toISOString().slice(0, 10);
      const data = await calApi(
        '/slots?' +
          new URLSearchParams({
            username: CAL.username,
            eventTypeSlug: eventSlug,
            start: day(start),
            end: day(end),
            timeZone: 'UTC'
          }),
        '2024-09-04'
      );
      const now = Date.now();
      const slots = Object.values(data || {})
        .flat()
        .map((s) => new Date(s.start).toISOString())
        .filter((iso) => Date.parse(iso) > now)
        .sort();
      return { slots, to: end.toISOString() };
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        fetchEvent()
          .then((et) => fetchSlots(Date.now()).then((s) => mountNative(et, s)))
          .catch(mountEmbed);
      },
      { rootMargin: '600px' }
    );
    obs.observe(card);

    /* ---------- native booker ---------- */

    const LOCATION_LABEL = {
      'cal-video': 'Cal Video',
      'google-meet': 'Google Meet',
      zoom: 'Zoom',
      'office365-video': 'Microsoft Teams',
      'whereby-video': 'Whereby'
    };
    // a fixed meeting link: name the service from its host
    function linkLabel(link) {
      try {
        const host = new URL(link).hostname;
        if (host === 'meet.google.com') return 'Google Meet';
        if (host.endsWith('zoom.us')) return 'Zoom';
        if (host.endsWith('teams.microsoft.com') || host.endsWith('teams.live.com')) return 'Microsoft Teams';
        if (host.endsWith('whereby.com')) return 'Whereby';
      } catch (e) {
        /* not a URL */
      }
      return '';
    }

    // booking fields Cal.com handles itself or we render explicitly
    const BUILTIN_FIELDS = ['name', 'email', 'location', 'guests', 'rescheduleReason', 'notes'];
    const pad = (n) => String(n).padStart(2, '0');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function mountNative(et, initial) {
      const booker = $('[data-booker]');
      const daysEl = $('[data-cal-days]');
      const timesEl = $('[data-times]');
      const form = $('[data-step="form"]');
      const errorEl = $('[data-form-error]');
      const submitBtn = $('[data-submit]');
      const steps = $$('[data-step]', booker);

      // book with the event's first location (an integration like Google Meet, or a fixed link)
      const loc = (et.locations || [])[0] || {};
      const locationLabel = LOCATION_LABEL[loc.integration] || linkLabel(loc.link) || 'video call';
      const bookingLocation =
        loc.type === 'integration' ? { type: 'integration', integration: loc.integration } : loc.type === 'link' ? { type: 'link' } : null;
      const duration = et.lengthInMinutes || 30;
      // custom questions the host added in Cal.com
      const questions = (et.bookingFields || [])
        .filter((f) => !f.hidden && !BUILTIN_FIELDS.includes(f.slug))
        .map((f) => ({
          slug: f.slug,
          label: f.label || f.slug,
          type: f.type,
          required: !!f.required,
          choices: (f.options || []).map((o) => (typeof o === 'string' ? o : o.label || o.value))
        }));

      const state = {
        tz: visitorTz,
        slots: initial.slots,
        loadedTo: initial.to,
        byDay: new Map(),
        month: null, // { y, m } with m = 0..11
        day: null, // 'YYYY-MM-DD' in state.tz
        slot: null
      };

      $('[data-location-label]').textContent = locationLabel;
      $('[data-duration-label]').textContent = duration + ' min';
      $('[data-event-title]').textContent = duration + '-minute intro call';

      // ---- date helpers (all in the visitor's chosen timezone)
      function dayKey(iso) {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: state.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso));
        const get = (t) => parts.find((p) => p.type === t).value;
        return `${get('year')}-${get('month')}-${get('day')}`;
      }
      const timeLabel = (iso) => new Date(iso).toLocaleTimeString([], { timeZone: state.tz, hour: 'numeric', minute: '2-digit' });
      function longDate(key) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString([], { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
      }
      const tzLabel = () => state.tz.replace(/_/g, ' ');

      function index() {
        state.byDay = new Map();
        state.slots.forEach((s) => {
          const k = dayKey(s);
          if (!state.byDay.has(k)) state.byDay.set(k, []);
          state.byDay.get(k).push(s);
        });
      }

      function showStep(name) {
        steps.forEach((s) => (s.hidden = s.dataset.step !== name));
      }

      // ---- calendar
      function renderMonth() {
        const { y, m } = state.month;
        $('[data-cal-title]').textContent = new Date(Date.UTC(y, m, 1, 12)).toLocaleDateString([], { timeZone: 'UTC', month: 'long', year: 'numeric' });

        const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday-first
        const count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const today = dayKey(new Date().toISOString());
        let html = '<span></span>'.repeat(lead);
        for (let d = 1; d <= count; d++) {
          const key = `${y}-${pad(m + 1)}-${pad(d)}`;
          const n = (state.byDay.get(key) || []).length;
          const label = longDate(key) + (n ? `, ${n} time${n > 1 ? 's' : ''} available` : ', unavailable');
          html += `<button type="button" class="day${n ? ' has' : ''}${key === today ? ' today' : ''}" data-day="${key}"
            aria-pressed="${key === state.day}" aria-label="${label}" ${n ? '' : 'disabled'}>${d}</button>`;
        }
        daysEl.innerHTML = html;

        const now = today.split('-').map(Number);
        $('[data-cal-prev]').disabled = y < now[0] || (y === now[0] && m <= now[1] - 1);
        $('[data-cal-next]').disabled = (y - now[0]) * 12 + (m - (now[1] - 1)) >= 2; // ~ next 2 months
      }

      function renderTimes() {
        const list = state.day ? state.byDay.get(state.day) || [] : [];
        $('[data-day-title]').textContent = state.day ? longDate(state.day) : 'Pick a day';
        timesEl.innerHTML = list.map((s) => `<li><button type="button" class="time" data-slot="${s}">${timeLabel(s)}</button></li>`).join('');
        $('[data-times-note]').textContent = state.slots.length
          ? state.day
            ? `${duration}-minute ${locationLabel} call · times in ${tzLabel()}`
            : 'Days with open times are highlighted.'
          : 'No open times in the next few weeks. Email me and we will find one.';
      }

      function selectDay(key) {
        state.day = key;
        renderMonth();
        renderTimes();
        showStep('times');
      }

      // first day with availability in the current month (or none)
      function autoSelectDay() {
        const prefix = `${state.month.y}-${pad(state.month.m + 1)}`;
        state.day = [...state.byDay.keys()].sort().find((k) => k.startsWith(prefix)) || null;
      }

      async function changeMonth(delta) {
        let { y, m } = state.month;
        m += delta;
        if (m < 0) (m = 11), y--;
        if (m > 11) (m = 0), y++;
        state.month = { y, m };

        // load more availability if this month runs past what we have
        if (Date.UTC(y, m + 1, 1) > Date.parse(state.loadedTo)) {
          daysEl.setAttribute('aria-busy', 'true');
          try {
            const more = await fetchSlots(Date.parse(state.loadedTo));
            state.slots = [...new Set(state.slots.concat(more.slots))].sort();
            state.loadedTo = more.to;
            index();
          } catch (e) {
            /* keep what we have */
          }
          daysEl.removeAttribute('aria-busy');
        }
        autoSelectDay();
        renderMonth();
        renderTimes();
        showStep('times');
      }

      async function refreshSlots() {
        const fresh = await fetchSlots(Date.now());
        state.slots = fresh.slots;
        state.loadedTo = fresh.to;
        index();
      }

      // ---- form
      function renderQuestions() {
        $('[data-questions]').innerHTML = questions
          .map((q, i) => {
            const req = q.required ? ' required' : '';
            const label = `<span>${esc(q.label)}${q.required ? '' : ' <span class="muted">(optional)</span>'}</span>`;
            const name = `q${i}`;
            if (q.type === 'textarea') return `<label>${label}<textarea name="${name}" rows="3" maxlength="2000"${req}></textarea></label>`;
            if (q.type === 'select' || q.type === 'radio')
              return `<label>${label}<select name="${name}"${req}><option value="">Choose…</option>${q.choices.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>`;
            if (q.type === 'multiselect' || q.type === 'checkbox')
              return `<fieldset><legend>${label}</legend>${q.choices
                .map((c) => `<label class="check"><input type="checkbox" name="${name}" value="${esc(c)}" /> ${esc(c)}</label>`)
                .join('')}</fieldset>`;
            if (q.type === 'boolean') return `<label class="check"><input type="checkbox" name="${name}" value="yes" /> ${esc(q.label)}</label>`;
            const type = q.type === 'phone' ? 'tel' : q.type === 'number' ? 'number' : 'text';
            return `<label>${label}<input type="${type}" name="${name}" maxlength="500"${req} /></label>`;
          })
          .join('');
      }

      function collect() {
        const fd = new FormData(form);
        const responses = {};
        questions.forEach((q, i) => {
          const name = 'q' + i;
          let v;
          if (q.type === 'multiselect' || q.type === 'checkbox') v = fd.getAll(name).map(String);
          else if (q.type === 'boolean') v = fd.get(name) === 'yes';
          else if (q.type === 'number') v = fd.get(name) === '' || fd.get(name) === null ? '' : Number(fd.get(name));
          else v = String(fd.get(name) || '').trim();
          if (v !== '' && !(Array.isArray(v) && !v.length)) responses[q.slug] = v;
        });
        const notes = String(fd.get('notes') || '').trim();
        if (notes) responses.notes = notes;
        return {
          name: String(fd.get('name') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          website: String(fd.get('website') || ''),
          responses
        };
      }

      function validate(v) {
        if (!v.name) return 'Please enter your name.';
        if (!EMAIL_RE.test(v.email)) return 'Please enter a valid email.';
        const missing = questions.find((q) => q.required && q.type !== 'boolean' && v.responses[q.slug] === undefined);
        return missing ? `Please answer: ${missing.label}` : '';
      }

      function showError(msg, html) {
        errorEl.hidden = !(msg || html);
        if (html) errorEl.innerHTML = html;
        else errorEl.textContent = msg;
      }

      function openSlot(slotStart) {
        if (!state.slots.includes(slotStart)) return;
        state.slot = slotStart;
        const end = new Date(Date.parse(slotStart) + duration * 60000).toISOString();
        $('[data-summary]').innerHTML =
          `<strong>${esc(longDate(state.day))}</strong><br />${timeLabel(slotStart)} – ${timeLabel(end)} · ${esc(tzLabel())}<br />` +
          `${duration} min · ${esc(locationLabel)}`;
        showError('');
        showStep('form');
        $('input[name="name"]', form).focus();
      }

      // Cal.com's own page for this slot, prefilled: the escape hatch on errors
      function slotPageUrl(v) {
        const url = new URL(`https://cal.com/${CAL.username}/${eventSlug}`);
        url.searchParams.set('date', dayKey(state.slot));
        url.searchParams.set('month', dayKey(state.slot).slice(0, 7));
        url.searchParams.set('slot', state.slot);
        url.searchParams.set('name', v.name);
        url.searchParams.set('email', v.email);
        if (v.responses.notes) url.searchParams.set('notes', v.responses.notes);
        return url.toString();
      }

      function showDone(title, text, links) {
        $('[data-done-title]').textContent = title;
        $('[data-done-text]').textContent = text;
        $('[data-done-links]').innerHTML = links;
        showStep('done');
        $('[data-step="done"]').focus();
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = collect();
        if (v.website) return; // honeypot: bots fill hidden fields
        const problem = validate(v);
        if (problem) return showError(problem);

        const when = `${longDate(state.day)} at ${timeLabel(state.slot)} (${tzLabel()})`;
        submitBtn.disabled = true;
        showError('');
        try {
          const booking = await calApi('/bookings', '2026-02-25', {
            method: 'POST',
            body: JSON.stringify({
              start: state.slot,
              eventTypeSlug: eventSlug,
              username: CAL.username,
              attendee: { name: v.name, email: v.email, timeZone: state.tz, language: 'en' },
              ...(bookingLocation && { location: bookingLocation }),
              ...(Object.keys(v.responses).length && { bookingFieldsResponses: v.responses }),
              metadata: { source: 'kdbor.engineer' }
            })
          });
          const b = Array.isArray(booking) ? booking[0] : booking;
          toast("You're booked. Check your inbox for the invite.");
          showDone(
            "You're booked.",
            `${when}. A calendar invite with the ${locationLabel} link is on its way to ${v.email}.`,
            b && b.uid
              ? `<a href="https://cal.com/booking/${encodeURIComponent(b.uid)}" target="_blank" rel="noopener noreferrer">View booking</a> · ` +
                  `<a href="https://cal.com/reschedule/${encodeURIComponent(b.uid)}" target="_blank" rel="noopener noreferrer">Reschedule</a> · ` +
                  `<a href="https://cal.com/booking/${encodeURIComponent(b.uid)}?cancel=true" target="_blank" rel="noopener noreferrer">Cancel</a>`
              : ''
          );
        } catch (err) {
          if (err.status === 400 || err.status === 409) {
            // most often the slot was just taken: refresh and send them back to pick again
            try {
              await refreshSlots();
            } catch (e) {
              state.slots = state.slots.filter((s) => s !== state.slot);
              index();
            }
            if (!state.slots.includes(state.slot)) {
              selectDay(state.day && state.byDay.has(state.day) ? state.day : (autoSelectDay(), state.day));
              $('[data-times-note]').textContent = 'That time was just taken. Here is what is still open.';
              return;
            }
          }
          showError(
            '',
            `${esc(err.message || 'Booking failed.')} You can <a href="${esc(slotPageUrl(v))}" target="_blank" rel="noopener noreferrer">finish on Cal.com</a> instead.`
          );
        } finally {
          submitBtn.disabled = false;
        }
      });

      // ---- events
      daysEl.addEventListener('click', (e) => {
        const b = e.target.closest('[data-day]');
        if (b && !b.disabled) selectDay(b.dataset.day);
      });
      timesEl.addEventListener('click', (e) => {
        const b = e.target.closest('[data-slot]');
        if (b) openSlot(b.dataset.slot);
      });
      $('[data-back]').addEventListener('click', () => {
        showStep('times');
        const b = $(`[data-slot="${CSS.escape(state.slot)}"]`, timesEl);
        if (b) b.focus();
      });
      $('[data-cal-prev]').addEventListener('click', () => changeMonth(-1));
      $('[data-cal-next]').addEventListener('click', () => changeMonth(1));

      // timezone picker
      const tzSelect = $('[data-tz-select]');
      let zones = [];
      try {
        zones = Intl.supportedValuesOf('timeZone');
      } catch (e) {
        /* older browsers */
      }
      if (!zones.includes(state.tz)) zones.unshift(state.tz);
      tzSelect.innerHTML = zones.map((z) => `<option value="${z}"${z === state.tz ? ' selected' : ''}>${z.replace(/_/g, ' ')}</option>`).join('');
      tzSelect.addEventListener('change', () => {
        state.tz = tzSelect.value;
        index();
        if (!(state.day && state.byDay.has(state.day))) autoSelectDay();
        renderMonth();
        renderTimes();
        showStep('times');
      });
      $('[data-tz-text]').hidden = true;
      $('[data-tz-pick]').hidden = false;

      // ---- first paint
      index();
      const first = state.slots[0] ? dayKey(state.slots[0]) : dayKey(new Date().toISOString());
      const [fy, fm] = first.split('-').map(Number);
      state.month = { y: fy, m: fm - 1 };
      state.day = state.slots[0] ? first : null;
      renderQuestions();
      renderMonth();
      renderTimes();
      showStep('times');

      frame.hidden = true;
      booker.hidden = false;
    }

    /* ---------- fallback: official Cal.com embed ---------- */

    function mountEmbed() {
      // Cal.com's documented loader snippet
      (function (C, A, L) {
        const p = (a, ar) => a.q.push(ar);
        const d = C.document;
        C.Cal =
          C.Cal ||
          function () {
            const cal = C.Cal;
            const ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement('script')).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () {
                p(api, arguments);
              };
              const namespace = ar[1];
              api.q = api.q || [];
              if (typeof namespace === 'string') {
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ['initNamespace', namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
      })(window, 'https://app.cal.com/embed/embed.js', 'init');

      const brand = () => ({
        light: { 'cal-brand': '#087a66' },
        dark: { 'cal-brand': '#34d3b4' }
      });
      frame.innerHTML = '';
      frame.classList.add('ready', 'embed');
      frame.removeAttribute('aria-busy');
      frame.style.height = 'auto';

      window.Cal('init', 'intro', { origin: 'https://app.cal.com' });
      window.Cal.ns.intro('inline', {
        elementOrSelector: frame,
        calLink: `${CAL.username}/${eventSlug}`,
        config: { layout: 'month_view', theme: currentTheme() }
      });
      window.Cal.ns.intro('ui', { theme: currentTheme(), cssVarsPerTheme: brand(), hideEventTypeDetails: true, layout: 'month_view' });
      window.Cal.ns.intro('on', {
        action: 'bookingSuccessful',
        callback: () => toast("You're booked. Check your inbox for the invite.")
      });
      themeListeners.push((t) => window.Cal.ns.intro('ui', { theme: t }));
      alt.classList.add('stalled');
    }
  })();

  /* ------------------------------------------------------------ terminal */

  (function terminal() {
    const out = $('[data-term-out]');
    const body = $('[data-term-body]');
    const form = $('[data-term-form]');
    const input = $('[data-term-input]');
    const history = [];
    let hIdx = 0;

    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(text || href)}</a>`;
    const files = {
      'readme.md': () => 'I build data and ML systems that stay fast, reliable, and cheap to run.\nOpen to collaboration on data/ML infra, event streaming, payment layers,\nopen source, mentorship, and technical writing.',
      'contact.txt': () => cmds.contact(),
      'stack.json': () => esc(JSON.stringify(Object.fromEntries(S.skills.map((g) => [g.group, g.items])), null, 2))
    };

    const cmds = {
      help: () =>
        [
          ['whoami', 'who is this?'],
          ['about', 'short bio'],
          ['experience', 'work history'],
          ['projects [query]', 'list projects, optionally filtered'],
          ['open <id>', 'open a project, e.g. open payments'],
          ['skills', 'tech stack by group'],
          ['writing', 'technical posts'],
          ['github', 'live GitHub stats'],
          ['contact', 'ways to reach me'],
          ['book', 'schedule a 30-min call'],
          ['email', 'copy my email address'],
          ['resume', 'download a PDF résumé'],
          ['ls / cat <file>', 'browse files'],
          ['neofetch', 'system info'],
          ['theme [dark|light]', 'switch theme'],
          ['accent <color>', 'teal · violet · blue · amber · rose'],
          ['clear', 'clear the screen']
        ]
          .map(([c, d]) => '<span class="hl">' + c.padEnd(20) + '</span>' + d)
          .join('\n') + '\n\nTip: Tab completes, ↑/↓ walks history.',
      whoami: () => `<span class="hl">${P.name}</span> — ${P.role}\n${P.location} · ${yearsShipping()}+ years shipping production data systems`,
      about: () => files['readme.md'](),
      experience: () =>
        S.experience
          .map((j) => `<span class="hl">${esc(j.start)} — ${esc(j.end)}</span>  ${esc(j.title)} @ ${esc(j.company)} <span class="hl2">(${esc(j.domain)})</span>\n  ${esc(j.bullets[0])}`)
          .join('\n\n'),
      projects: (args) => {
        const q = args.join(' ').toLowerCase();
        const list = S.projects.filter((p) => !q || lc(p.title + ' ' + p.stack.join(' ')).includes(q));
        if (!list.length) return 'No projects match "' + esc(q) + '".';
        return list.map((p) => `<span class="hl">${p.id.padEnd(12)}</span>${esc(p.title)} <span class="muted">[${esc(p.stack.join(', '))}]</span>`).join('\n') + '\n\nRun <span class="hl">open &lt;id&gt;</span> for details.';
      },
      open: (args) => {
        const p = S.projects.find((x) => x.id === args[0]);
        if (!p) return '<span class="err">open: no such project. Try `projects`.</span>';
        openProject(p.id);
        return 'Opening ' + esc(p.title) + '…';
      },
      skills: () => S.skills.map((g) => `<span class="hl">${esc(g.group.padEnd(18))}</span>${esc(g.items.join(' · '))}`).join('\n'),
      writing: () => S.writing.map((w) => `<span class="muted">${formatDate(w.date)}</span>  ${link(w.url, w.title)}`).join('\n'),
      github: () => {
        if (!ghData) return 'Fetching… scroll to the GitHub section or try again in a moment. ' + link(P.github);
        const own = ghData.repos.filter((r) => !r.fork);
        return `repos   ${ghData.user.public_repos}\nstars   ${own.reduce((s, r) => s + r.stars, 0)}\nlatest  ${esc(own[0] ? own[0].name : '-')}\n${link(P.github)}`;
      },
      contact: () =>
        `email     ${link('mailto:' + P.email, P.email)}\nbook      ${link(P.cal.url)}\nlinkedin  ${link(P.linkedin)}\ngithub    ${link(P.github)}\ntwitter   ${link(P.twitter)}`,
      book: () => {
        scrollToId('contact');
        return 'Scrolling to the scheduler… or open ' + link(P.cal.url);
      },
      resume: () => {
        printResume();
        return 'Opening print dialog — choose “Save as PDF”.';
      },
      email: () => {
        copyEmail();
        return 'Copied ' + P.email + ' to clipboard.';
      },
      ls: () => Object.keys(files).join('  '),
      cat: (args) => (files[args[0]] ? files[args[0]]() : '<span class="err">cat: ' + esc(args[0] || '') + ': No such file</span>'),
      neofetch: () => {
        const art = ['   ▄▄▄▄▄▄   ', '  █ ▄▄ ▄▄ █ ', '  █ ██ ██ █─●', '  █ ▀▀ ▀▀ █─●', '   ▀▀▀▀▀▀   '];
        const info = [
          `<span class="hl">guest@kdbor</span>`,
          `<span class="hl">role</span>    ${P.role}`,
          `<span class="hl">loc</span>     ${P.location} (UTC+3)`,
          `<span class="hl">uptime</span>  ${yearsShipping()}+ years in production`,
          `<span class="hl">langs</span>   Python · Go · TypeScript · SQL · C`
        ];
        return art.map((a, i) => '<span class="hl2">' + a + '</span>  ' + (info[i] || '')).join('\n');
      },
      theme: (args) => {
        const t = args[0] === 'light' || args[0] === 'dark' ? args[0] : currentTheme() === 'dark' ? 'light' : 'dark';
        setTheme(t);
        return 'Theme set to ' + t + '.';
      },
      accent: (args) =>
        setAccent((args[0] || '').toLowerCase())
          ? 'Accent set to ' + esc(args[0].toLowerCase()) + '.'
          : 'Usage: accent ' + ACCENTS.join(' | '),
      date: () => new Date().toString(),
      echo: (args) => esc(args.join(' ')),
      history: () => history.map((h, i) => String(i + 1).padStart(3) + '  ' + esc(h)).join('\n'),
      sudo: (args) => (args.join(' ') === 'hire-me' || args.join(' ') === 'hire me' ? (scrollToId('contact'), 'Permission granted. Redirecting to booking… 🚀') : '<span class="err">guest is not in the sudoers file. Try `sudo hire-me`.</span>'),
      exit: () => 'There is no escape. Try `book` instead.',
      clear: () => {
        out.innerHTML = '';
        return null;
      }
    };
    cmds.exp = cmds.experience;
    cmds.blog = cmds.writing;

    function print(cmd, res) {
      if (cmd !== null) {
        const c = document.createElement('div');
        c.className = 'cmd';
        c.innerHTML = '<span class="prompt">guest@kdbor:~$</span>' + esc(cmd);
        out.appendChild(c);
      }
      if (res !== null && res !== undefined) {
        const r = document.createElement('div');
        r.className = 'res';
        r.innerHTML = res;
        out.appendChild(r);
      }
      body.scrollTop = body.scrollHeight;
    }

    function run(raw) {
      const line = raw.trim();
      if (!line) return print('', null);
      history.push(line);
      hIdx = history.length;
      const [name, ...args] = line.split(/\s+/);
      const fn = cmds[name.toLowerCase()];
      if (!fn) return print(line, '<span class="err">command not found: ' + esc(name) + '</span> — type <span class="hl">help</span>');
      const res = fn(args);
      if (name.toLowerCase() === 'clear') return;
      print(line, res);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      run(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx > 0) input.value = history[--hIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const [name, arg] = input.value.split(/\s+/);
        if (arg !== undefined && (name === 'open' || name === 'cat')) {
          const pool = name === 'open' ? S.projects.map((p) => p.id) : Object.keys(files);
          const hits = pool.filter((x) => x.startsWith(arg));
          if (hits.length === 1) input.value = name + ' ' + hits[0];
          else if (hits.length) print(input.value, hits.join('  '));
          return;
        }
        const hits = Object.keys(cmds).filter((c) => c.startsWith(input.value));
        if (hits.length === 1) input.value = hits[0] + ' ';
        else if (hits.length > 1) print(input.value, hits.join('  '));
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      }
    });

    body.addEventListener('click', () => {
      if (!getSelection().toString()) input.focus({ preventScroll: true });
    });

    print(null, 'Welcome to <span class="hl">kdbor.engineer</span> — type <span class="hl">help</span> to get started.');
  })();

  /* ----------------------------------------------------- command palette */

  (function palette() {
    const dlg = $('[data-palette]');
    const input = $('[data-palette-input]');
    const list = $('[data-palette-list]');
    let shown = [];
    let sel = 0;

    const go = (id) => () => scrollToId(id);
    const ext = (url) => () => open(url, '_blank', 'noopener');

    const items = [
      ...[
        ['top', 'Home', 'home-outline'],
        ['about', 'About', 'person-outline'],
        ['work', 'Projects', 'grid-outline'],
        ['systems', 'Architecture explorer', 'git-network-outline'],
        ['experience', 'Experience', 'briefcase-outline'],
        ['skills', 'Skills explorer', 'layers-outline'],
        ['github', 'Live GitHub', 'logo-github'],
        ['writing', 'Writing', 'document-text-outline'],
        ['terminal', 'Terminal', 'terminal-outline'],
        ['contact', 'Contact', 'mail-outline']
      ].map(([id, label, icon]) => ({ group: 'Go to', label, icon, run: go(id) })),
      { group: 'Actions', label: 'Book a 30-min call', icon: 'calendar-outline', hint: 'Cal.com', run: go('contact') },
      { group: 'Actions', label: 'Copy email address', icon: 'copy-outline', run: copyEmail },
      { group: 'Actions', label: 'Download résumé (PDF)', icon: 'download-outline', keywords: 'resume cv print', run: printResume },
      { group: 'Actions', label: 'Toggle light / dark theme', icon: 'contrast-outline', run: toggleTheme },
      { group: 'Actions', label: 'Customize appearance', icon: 'color-palette-outline', keywords: 'accent color motion theme', run: () => setTimeout(() => openCustomize(true)) },
      {
        group: 'Actions',
        label: 'Open terminal',
        icon: 'terminal-outline',
        run: () => {
          scrollToId('terminal');
          setTimeout(() => $('[data-term-input]').focus({ preventScroll: true }), 500);
        }
      },
      { group: 'Actions', label: 'GitHub profile', icon: 'logo-github', hint: '@' + P.handle, run: ext(P.github) },
      { group: 'Actions', label: 'LinkedIn profile', icon: 'logo-linkedin', run: ext(P.linkedin) },
      ...S.projects.map((p) => ({ group: 'Projects', label: p.title, icon: 'cube-outline', hint: p.stack.slice(0, 2).join(' · '), keywords: p.stack.join(' '), run: () => openProject(p.id) })),
      ...S.writing.map((w) => ({ group: 'Writing', label: w.title, icon: 'reader-outline', hint: formatDate(w.date), keywords: w.category, run: ext(w.url) }))
    ];

    function render() {
      const q = input.value.trim().toLowerCase();
      shown = items.filter((it) => {
        const hay = lc(it.group + ' ' + it.label + ' ' + (it.keywords || '') + ' ' + (it.hint || ''));
        return q.split(/\s+/).every((t) => hay.includes(t));
      });
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      if (!shown.length) {
        list.innerHTML = '<li class="palette-empty">No results for “' + esc(q) + '”</li>';
        return;
      }
      let html = '';
      let group = '';
      shown.forEach((it, i) => {
        if (it.group !== group) {
          group = it.group;
          html += '<li class="palette-group" role="presentation">' + esc(group) + '</li>';
        }
        html += `<li class="palette-item" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === sel}">
          <ion-icon name="${it.icon}"></ion-icon><span>${esc(it.label)}</span>${it.hint ? `<span class="hint">${esc(it.hint)}</span>` : ''}</li>`;
      });
      list.innerHTML = html;
      input.setAttribute('aria-activedescendant', 'pal-' + sel);
      const active = $('#pal-' + sel, list);
      if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function openPalette() {
      if (dlg.open) return;
      input.value = '';
      sel = 0;
      render();
      dlg.showModal();
      input.focus();
    }

    function choose(i) {
      const it = shown[i];
      if (!it) return;
      dlg.close();
      it.run();
    }

    input.addEventListener('input', () => {
      sel = 0;
      render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sel = (sel + 1) % shown.length;
        render();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel - 1 + shown.length) % shown.length;
        render();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choose(sel);
      }
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('[data-i]');
      if (li) choose(+li.dataset.i);
    });
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('[data-i]');
      if (li && +li.dataset.i !== sel) {
        sel = +li.dataset.i;
        $$('.palette-item', list).forEach((x) => x.setAttribute('aria-selected', String(+x.dataset.i === sel)));
      }
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });

    $('[data-palette-open]').addEventListener('click', openPalette);
    addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dlg.open ? dlg.close() : openPalette();
        return;
      }
      const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if (e.key === '/' && !typing && !modal.open) {
        e.preventDefault();
        openPalette();
      }
    });
  })();

  /* -------------------------------------------------------------- reveal */

  renderProjects();

  const deepLink = location.hash.match(/^#project\/([\w-]+)$/);
  if (deepLink && S.projects.some((p) => p.id === deepLink[1])) {
    scrollToId('work');
    openProject(deepLink[1]);
  }

  if (!reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          obs.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    $$('.section-head, .services, .impact, .arch, .exp-layout, .skills-layout, .posts, .term, .contact-layout').forEach((el) => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }
})();
