#!/usr/bin/env node
// Renders the profile README's SVG cards (dark + light) from live GitHub data.
//
//   GITHUB_TOKEN=... node scripts/readme/generate.mjs --out dist        # data cards
//   node scripts/readme/generate.mjs --static assets/readme             # banner + CTA
//
// No dependencies. Text uses system font stacks because GitHub serves SVGs as
// images, which can't load web fonts.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const LOGIN = 'sirbor843';
const FEATURED = ['Commandline_Calculator', 'astraLauncher', 'Jikoni', 'FlightsAnalysis', 'simple_shell', 'Kibeti'];

// clearer one-liners for cards whose GitHub description is terse
const DESCRIPTIONS = {
  simple_shell: 'A Unix shell written from scratch in C: fork/exec, pipes, signals, and built-ins.',
  Commandline_Calculator: 'A scientific calculator for the terminal, written in C for POSIX systems.',
  Kibeti: 'An iOS take on the M-Pesa mobile-money app, built in Swift.',
  FlightsAnalysis: 'Departure and arrival analysis between JKIA (Nairobi) and Bole (Addis Ababa).',
  Jikoni: 'An iOS restaurant app for booking appointments and showcasing menus and recipes.'
};

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";

const THEMES = {
  dark: {
    bg: '#0d1117',
    card: '#11141a',
    card2: '#171b23',
    border: '#262b35',
    text: '#e8eaed',
    text2: '#b3bac5',
    muted: '#8b93a1',
    accent: '#34d3b4',
    accent2: '#fbbf24',
    glow: 'rgba(52,211,180,0.16)',
    grid: 'rgba(255,255,255,0.04)',
    // sequential ramp for the heatmap: empty -> most active
    ramp: ['#1a1f27', '#0f4f43', '#188c76', '#26b39a', '#34d3b4']
  },
  light: {
    bg: '#ffffff',
    card: '#ffffff',
    card2: '#f4f6f8',
    border: '#d0d7de',
    text: '#0d1117',
    text2: '#3a4250',
    muted: '#59636e',
    accent: '#087a66',
    accent2: '#b45309',
    glow: 'rgba(8,122,102,0.10)',
    grid: 'rgba(13,17,23,0.05)',
    ramp: ['#ebedf0', '#b3e4d9', '#6cc7b2', '#2a9d85', '#087a66']
  }
};

/* ------------------------------------------------------------------ utils */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const fmt = (n) => Number(n).toLocaleString('en-US');

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  for (const [u, n] of [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]]) {
    const v = Math.floor(s / n);
    if (v >= 1) return `${v}${u} ago`;
  }
  return 'just now';
}

// rough text wrap by average glyph width (good enough for card copy)
function wrap(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
      if (lines.length === maxLines) break;
    } else line += ' ' + w;
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim());
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

function svg(width, height, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .rise { opacity: 0; animation: rise .6s cubic-bezier(.22,1,.36,1) forwards; }
  .fade { opacity: 0; animation: fade .5s ease forwards; }
  @media (prefers-reduced-motion: reduce) { .rise, .fade { animation: none; opacity: 1; } }
</style>
${body}
</svg>`;
}

const frame = (w, h, t) =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="14" fill="${t.card}" stroke="${t.border}"/>`;

const label = (x, y, text, t) =>
  `<text x="${x}" y="${y}" class="mono" font-size="11" font-weight="600" letter-spacing="1.6" fill="${t.muted}">${esc(text.toUpperCase())}</text>`;

/* ------------------------------------------------------------------- data */

async function gh(path, token, body) {
  const res = await fetch('https://api.github.com' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `bearer ${token}`, 'User-Agent': 'kdbor-readme', Accept: 'application/vnd.github+json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`GitHub ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function loadData(token) {
  const query = `query($login: String!) {
    user(login: $login) {
      createdAt
      followers { totalCount }
      repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
        totalCount
        nodes {
          name description url stargazerCount forkCount pushedAt
          primaryLanguage { name color }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        }
      }
      contributionsCollection {
        totalCommitContributions totalPullRequestContributions totalIssueContributions restrictedContributionsCount
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
      }
    }
  }`;
  const { data, errors } = await gh('/graphql', token, { query, variables: { login: LOGIN } });
  if (errors) throw new Error(JSON.stringify(errors));
  const u = data.user;
  const repos = u.repositories.nodes;

  // latest commits across the most recently pushed repos (the events API has no messages)
  const recent = repos.slice(0, 4);
  const commitLists = await Promise.all(
    recent.map((r) =>
      gh(`/repos/${LOGIN}/${r.name}/commits?per_page=6`, token)
        .then((list) => list.map((c) => ({ repo: r.name, sha: c.sha.slice(0, 7), msg: c.commit.message.split('\n')[0], date: c.commit.author.date })))
        .catch(() => [])
    )
  );
  const commits = commitLists.flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  return { user: u, repos, commits };
}

function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // current streak may end yesterday if today has nothing yet
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return { longest, current };
}

/* ------------------------------------------------------------------ cards */

function overviewCard({ user, repos }, t) {
  const W = 480;
  const H = 210;
  const c = user.contributionsCollection;
  const days = c.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  const { longest } = streaks(days);
  const langs = new Set(repos.flatMap((r) => r.languages.edges.map((e) => e.node.name)));
  const years = new Date().getFullYear() - new Date(user.createdAt).getFullYear();
  const stats = [
    [fmt(c.contributionCalendar.totalContributions), 'contributions · 12 mo'],
    [fmt(c.totalCommitContributions), 'commits · 12 mo'],
    [fmt(c.totalPullRequestContributions), 'pull requests · 12 mo'],
    [fmt(user.repositories.totalCount), 'public repositories'],
    [fmt(langs.size), 'languages used'],
    [`${longest}d`, 'longest streak']
  ];
  const cells = stats
    .map(([v, l], i) => {
      const x = 24 + (i % 3) * 150;
      const y = 92 + Math.floor(i / 3) * 62;
      return `<g class="rise" style="animation-delay:${0.08 * i}s">
        <text x="${x}" y="${y}" class="sans" font-size="26" font-weight="700" fill="${t.text}">${esc(v)}</text>
        <text x="${x}" y="${y + 20}" class="sans" font-size="12" fill="${t.muted}">${esc(l)}</text>
      </g>`;
    })
    .join('');
  return svg(
    W,
    H,
    `${frame(W, H, t)}
  ${label(24, 34, 'GitHub at a glance', t)}
  <text x="${W - 24}" y="34" text-anchor="end" class="mono" font-size="11" fill="${t.muted}">on GitHub ${years}y</text>
  <line x1="24" y1="48" x2="${W - 24}" y2="48" stroke="${t.border}"/>
  ${cells}`,
    'GitHub at a glance'
  );
}

function languagesCard({ repos }, t) {
  const W = 480;
  const H = 210;
  const bytes = new Map();
  const colors = new Map();
  for (const r of repos)
    for (const e of r.languages.edges) {
      bytes.set(e.node.name, (bytes.get(e.node.name) || 0) + e.size);
      colors.set(e.node.name, e.node.color || t.muted);
    }
  const total = [...bytes.values()].reduce((a, b) => a + b, 0) || 1;
  let rows = [...bytes.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length > 8) rows = rows.slice(0, 7).concat([['Other', rows.slice(7).reduce((s, r) => s + r[1], 0)]]);
  colors.set('Other', t.muted);

  // stacked bar with a 2px gap between segments
  const barW = W - 48;
  let x = 24;
  const bar = rows
    .map(([name, b], i) => {
      const w = Math.max(2, (b / total) * barW - 2);
      const seg = `<rect class="fade" style="animation-delay:${0.06 * i}s" x="${x.toFixed(1)}" y="62" width="${w.toFixed(1)}" height="10" rx="2" fill="${colors.get(name)}"/>`;
      x += w + 2;
      return seg;
    })
    .join('');
  const legend = rows
    .map(([name, b], i) => {
      const lx = 24 + (i % 2) * 220;
      const ly = 104 + Math.floor(i / 2) * 24;
      return `<g class="rise" style="animation-delay:${0.2 + 0.05 * i}s">
        <circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${colors.get(name)}"/>
        <text x="${lx + 18}" y="${ly}" class="sans" font-size="13" fill="${t.text2}">${esc(name)}</text>
        <text x="${lx + 196}" y="${ly}" text-anchor="end" class="mono" font-size="12" fill="${t.muted}">${((b / total) * 100).toFixed(1)}%</text>
      </g>`;
    })
    .join('');
  return svg(
    W,
    H,
    `${frame(W, H, t)}
  ${label(24, 34, 'Languages · by code volume', t)}
  <text x="${W - 24}" y="34" text-anchor="end" class="mono" font-size="11" fill="${t.muted}">${repos.length} repos</text>
  <line x1="24" y1="48" x2="${W - 24}" y2="48" stroke="${t.border}"/>
  ${bar}
  ${legend}`,
    'Languages by code volume'
  );
}

function activityCard({ user }, t) {
  const cal = user.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks;
  const cell = 13;
  const gap = 3;
  const left = 52;
  const top = 72;
  const W = left + weeks.length * (cell + gap) + 24;
  const H = top + 7 * (cell + gap) + 54;
  const level = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  const days = weeks.flatMap((w) => w.contributionDays);
  const { current, longest } = streaks(days);
  const active = days.filter((d) => d.contributionCount > 0).length;

  let monthLabels = '';
  let lastMonth = -1;
  const grid = weeks
    .map((w, wi) => {
      const first = new Date(w.contributionDays[0].date + 'T00:00:00Z');
      if (first.getUTCMonth() !== lastMonth && first.getUTCDate() <= 7) {
        lastMonth = first.getUTCMonth();
        if (wi < weeks.length - 1)
          monthLabels += `<text x="${left + wi * (cell + gap)}" y="${top - 10}" class="sans" font-size="11" fill="${t.muted}">${first.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`;
      }
      return w.contributionDays
        .map((d) => {
          const wd = new Date(d.date + 'T00:00:00Z').getUTCDay();
          const lv = level[d.contributionLevel] ?? 0;
          return `<rect x="${left + wi * (cell + gap)}" y="${top + wd * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${t.ramp[lv]}"${lv ? ` class="fade" style="animation-delay:${(wi * 0.012).toFixed(2)}s"` : ''}><title>${esc(d.date)}: ${d.contributionCount} contribution${d.contributionCount === 1 ? '' : 's'}</title></rect>`;
        })
        .join('');
    })
    .join('');
  const dayLabels = ['Mon', 'Wed', 'Fri']
    .map((d, i) => `<text x="24" y="${top + (1 + i * 2) * (cell + gap) + 10}" class="sans" font-size="11" fill="${t.muted}">${d}</text>`)
    .join('');
  const legendX = W - 24 - 5 * (cell + gap) - 70;
  const legend =
    `<text x="${legendX}" y="${H - 22}" class="sans" font-size="11" fill="${t.muted}">Less</text>` +
    t.ramp.map((c, i) => `<rect x="${legendX + 32 + i * (cell + gap)}" y="${H - 33}" width="${cell}" height="${cell}" rx="3" fill="${c}"/>`).join('') +
    `<text x="${legendX + 32 + 5 * (cell + gap) + 6}" y="${H - 22}" class="sans" font-size="11" fill="${t.muted}">More</text>`;
  return svg(
    W,
    H,
    `${frame(W, H, t)}
  ${label(24, 34, 'Contributions · last 12 months', t)}
  <text x="${W - 24}" y="34" text-anchor="end" class="mono" font-size="11" fill="${t.muted}">${fmt(cal.totalContributions)} total · ${active} active days · streak ${current}d (best ${longest}d)</text>
  ${monthLabels}
  ${dayLabels}
  ${grid}
  ${legend}`,
    `${cal.totalContributions} contributions in the last 12 months`
  );
}

function buildLogCard({ commits }, t) {
  const W = 980;
  const rowH = 30;
  const H = 74 + commits.length * rowH + 18;
  const rows = commits
    .map((c, i) => {
      const y = 92 + i * rowH;
      return `<g class="rise" style="animation-delay:${0.1 + 0.12 * i}s">
        <text x="24" y="${y}" class="mono" font-size="13" fill="${t.accent2}">${esc(c.sha)}</text>
        <text x="100" y="${y}" class="mono" font-size="13" fill="${t.accent}">${esc(c.repo.length > 18 ? c.repo.slice(0, 17) + '…' : c.repo)}</text>
        <text x="270" y="${y}" class="sans" font-size="14" fill="${t.text2}">${esc(c.msg.length > 78 ? c.msg.slice(0, 77) + '…' : c.msg)}</text>
        <text x="${W - 24}" y="${y}" text-anchor="end" class="mono" font-size="12" fill="${t.muted}">${timeAgo(c.date)}</text>
      </g>`;
    })
    .join('');
  return svg(
    W,
    H,
    `${frame(W, H, t)}
  <circle cx="30" cy="30" r="5" fill="#ff5f57"/><circle cx="48" cy="30" r="5" fill="#febc2e"/><circle cx="66" cy="30" r="5" fill="#28c840"/>
  <text x="88" y="34" class="mono" font-size="12" fill="${t.muted}">~/build-log $ git log --oneline --all-repos</text>
  <line x1="0" y1="52" x2="${W}" y2="52" stroke="${t.border}"/>
  ${rows}`,
    'Build log: latest commits'
  );
}

function projectCard(repo, t) {
  const W = 480;
  const H = 150;
  const lang = repo.primaryLanguage;
  const desc = wrap(DESCRIPTIONS[repo.name] || repo.description || 'No description yet.', 58, 2)
    .map((l, i) => `<text x="24" y="${78 + i * 20}" class="sans" font-size="13.5" fill="${t.text2}">${esc(l)}</text>`)
    .join('');
  const meta = [
    lang ? `<circle cx="29" cy="${H - 28}" r="5" fill="${lang.color || t.muted}"/><text x="40" y="${H - 24}" class="sans" font-size="12" fill="${t.muted}">${esc(lang.name)}</text>` : '',
    repo.stargazerCount ? `<text x="150" y="${H - 24}" class="sans" font-size="12" fill="${t.muted}">★ ${repo.stargazerCount}</text>` : '',
    `<text x="${W - 24}" y="${H - 24}" text-anchor="end" class="mono" font-size="11" fill="${t.muted}">updated ${timeAgo(repo.pushedAt)}</text>`
  ].join('');
  return svg(
    W,
    H,
    `${frame(W, H, t)}
  <g class="rise">
    <text x="24" y="44" class="mono" font-size="16" font-weight="700" fill="${t.accent}">${esc(repo.name)}</text>
    <text x="${W - 24}" y="44" text-anchor="end" class="sans" font-size="16" fill="${t.muted}">↗</text>
    ${desc}
    ${meta}
  </g>`,
    `${repo.name}: ${repo.description || ''}`
  );
}

/* --------------------------------------------------------- static assets */

function bannerSvg(t) {
  const W = 1200;
  const H = 340;
  const roles = ['real-time payment layers', 'event streaming pipelines', 'production ML systems', 'LLM & agentic workflows'];
  const cycle = roles.length * 3; // seconds per full cycle
  const roleText = roles
    .map(
      (r, i) =>
        `<text x="72" y="214" class="sans role" font-size="26" font-weight="600" fill="${t.accent}" style="animation-delay:${i * 3}s">${esc(r)}</text>`
    )
    .join('');
  // deterministic "latency" sparkline with a couple of tail spikes
  const pts = Array.from({ length: 48 }, (_, i) => {
    const base = 40 + Math.sin(i * 0.7) * 4 + Math.cos(i * 1.9) * 3;
    return i === 13 || i === 34 ? base + 34 : i === 24 ? base + 20 : base;
  });
  const sx = (i) => 780 + i * (340 / 47);
  const sy = (v) => 262 - (v / 100) * 80;
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dominic Bor, Data and ML Systems Engineer">
<title>Dominic Bor · Data &amp; ML Systems Engineer</title>
<defs>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${t.grid}"/></pattern>
  <radialGradient id="glow" cx="18%" cy="0%" r="70%"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity=".25"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  <clipPath id="card"><rect x="760" y="56" width="380" height="228" rx="14"/></clipPath>
</defs>
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  .role { opacity: 0; animation: role ${cycle}s infinite; }
  @keyframes role { 0% { opacity: 0; transform: translateY(8px); } 3%, 22% { opacity: 1; transform: none; } 25%, 100% { opacity: 0; transform: translateY(-8px); } }
  .caret { animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .line { stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 3.2s ease-out forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .pulse { animation: pulse 2s ease-out infinite; transform-origin: 1105px 82px; }
  @keyframes pulse { from { opacity: .9; transform: scale(.6); } to { opacity: 0; transform: scale(2.2); } }
  .in { opacity: 0; animation: in .8s cubic-bezier(.22,1,.36,1) forwards; }
  @keyframes in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .role, .line, .pulse, .in, .caret { animation: none; opacity: 1; stroke-dashoffset: 0; } .role ~ .role { opacity: 0; } }
</style>
<rect width="${W}" height="${H}" rx="18" fill="${t.card}"/>
<rect width="${W}" height="${H}" rx="18" fill="url(#grid)"/>
<rect width="${W}" height="${H}" rx="18" fill="url(#glow)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.border}"/>

<g class="in">
  <rect x="72" y="58" width="326" height="30" rx="15" fill="${t.card2}" stroke="${t.border}"/>
  <circle cx="92" cy="73" r="4.5" fill="#0ca30c"/>
  <text x="106" y="78" class="sans" font-size="13" fill="${t.text2}">Open to remote work · New York (ET)</text>
</g>
<text x="70" y="150" class="sans in" style="animation-delay:.1s" font-size="64" font-weight="800" letter-spacing="-1.5" fill="${t.text}">Dominic Bor</text>
<text x="72" y="182" class="mono in" style="animation-delay:.2s" font-size="16" fill="${t.muted}">Data &amp; ML Systems Engineer</text>
${roleText}
<text x="72" y="250" class="sans in" style="animation-delay:.3s" font-size="20" fill="${t.text2}">that stay fast, reliable, and cheap to run.</text>
<text x="72" y="296" class="mono in" style="animation-delay:.4s" font-size="13" fill="${t.muted}">fintech · gaming · healthcare   |   kdbor.engineer</text>

<g class="in" style="animation-delay:.25s">
  <rect x="760" y="56" width="380" height="228" rx="14" fill="${t.card2}" stroke="${t.border}"/>
  <g clip-path="url(#card)">
    <rect x="760" y="56" width="380" height="50" fill="${t.card}"/>
    <line x1="760" y1="106" x2="1140" y2="106" stroke="${t.border}"/>
  </g>
  <circle cx="782" cy="82" r="5" fill="#ff5f57"/><circle cx="799" cy="82" r="5" fill="#febc2e"/><circle cx="816" cy="82" r="5" fill="#28c840"/>
  <text x="834" y="86" class="mono" font-size="12" fill="${t.muted}">payments-api · prod</text>
  <circle class="pulse" cx="1105" cy="82" r="5" fill="none" stroke="#0ca30c" stroke-width="2"/>
  <circle cx="1105" cy="82" r="4" fill="#0ca30c"/>
  <text x="1094" y="86" text-anchor="end" class="sans" font-size="12" font-weight="600" fill="#0ca30c">healthy</text>
  <text x="780" y="134" class="sans" font-size="11" fill="${t.muted}">p99 latency</text>
  <text x="780" y="158" class="mono" font-size="20" font-weight="600" fill="${t.text}">42<tspan font-size="11" fill="${t.muted}"> ms</tspan></text>
  <text x="900" y="134" class="sans" font-size="11" fill="${t.muted}">latency cut</text>
  <text x="900" y="158" class="mono" font-size="20" font-weight="600" fill="${t.text}">-50%</text>
  <text x="1010" y="134" class="sans" font-size="11" fill="${t.muted}">cloud spend</text>
  <text x="1010" y="158" class="mono" font-size="20" font-weight="600" fill="${t.text}">-35%</text>
  <path d="${path} L${sx(47)} 262 L${sx(0)} 262 Z" fill="url(#area)" class="in" style="animation-delay:1.4s"/>
  <path d="${path}" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linejoin="round" class="line"/>
  <text x="780" y="276" class="mono" font-size="10" fill="${t.muted}">illustrative telemetry</text>
</g>
</svg>`;
}

function ctaSvg(t) {
  const W = 980;
  const H = 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Book a 45-minute intro call on cal.com/sirbor843/meeting">
<title>Book a 45-minute intro call</title>
<defs><radialGradient id="g" cx="85%" cy="50%" r="60%"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient></defs>
<style>
  .sans { font-family: ${SANS}; } .mono { font-family: ${MONO}; }
  .btn { animation: breathe 3s ease-in-out infinite; transform-origin: 830px 60px; }
  @keyframes breathe { 50% { transform: scale(1.03); } }
  @media (prefers-reduced-motion: reduce) { .btn { animation: none; } }
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.card}" stroke="${t.border}"/>
<rect width="${W}" height="${H}" rx="16" fill="url(#g)"/>
<text x="36" y="52" class="sans" font-size="24" font-weight="700" fill="${t.text}">Let's build something.</text>
<text x="36" y="80" class="sans" font-size="15" fill="${t.text2}">Pipelines, payment layers, production ML, or a full-time role. Pick a time that suits you.</text>
<g class="btn">
  <rect x="720" y="36" width="220" height="48" rx="24" fill="${t.accent}"/>
  <text x="830" y="66" text-anchor="middle" class="sans" font-size="16" font-weight="700" fill="${t.card}">Book a call  →</text>
</g>
</svg>`;
}

/* ------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

async function writeBoth(dir, name, render, data) {
  for (const [mode, t] of Object.entries(THEMES)) await writeFile(join(dir, `${name}-${mode}.svg`), render(data, t));
}

const staticDir = flag('--static');
const outDir = flag('--out');

if (staticDir) {
  await mkdir(staticDir, { recursive: true });
  await writeBoth(staticDir, 'banner', (_, t) => bannerSvg(t));
  await writeBoth(staticDir, 'cta', (_, t) => ctaSvg(t));
  console.log('static assets ->', staticDir);
}

if (outDir) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for data cards');
  await mkdir(outDir, { recursive: true });
  const data = await loadData(token);
  await writeBoth(outDir, 'overview', overviewCard, data);
  await writeBoth(outDir, 'languages', languagesCard, data);
  await writeBoth(outDir, 'activity', activityCard, data);
  await writeBoth(outDir, 'build-log', buildLogCard, data);
  for (const name of FEATURED) {
    const repo = data.repos.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (repo) await writeBoth(outDir, `project-${name.toLowerCase()}`, (r, t) => projectCard(r, t), repo);
    else console.warn('featured repo not found:', name);
  }
  console.log('data cards ->', outDir, `(${data.repos.length} repos, ${data.commits.length} commits)`);
}

if (!staticDir && !outDir) console.log('usage: generate.mjs [--static <dir>] [--out <dir>]');
