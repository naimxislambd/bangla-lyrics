#!/usr/bin/env node
// গানের কথা — Bangla song lyrics archive
// Zero-dependency static site generator.
// Usage: node build.js   -> builds docs/ (GitHub Pages ready)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data', 'songs');
const OUT = path.join(ROOT, 'docs');
const BASE = ''; // repo root on GitHub Pages: set '/repo-name' if needed

const SITE = {
  name: 'গানের কথা',
  tagline: 'বাংলা গানের লিরিক্স আর্কাইভ',
  description: 'মৌলিক বাংলা গান ও পাবলিক-ডোমেইন লোকগীতির লিরিক্স সংগ্রহ — কপিরাইট-ফার্স্ট।',
};

const CATEGORIES = [
  { slug: 'rock-ballad', bn: 'রক ব্যালাড', desc: 'ইমোশনাল রক ব্যালাড ও রক গান' },
  { slug: 'acoustic', bn: 'অ্যাকোস্টিক', desc: 'আনপ্লাগড ও ফোক অ্যাকোস্টিক' },
  { slug: 'folk', bn: 'লোকগীতি', desc: 'ঐতিহ্যবাহী পাবলিক-ডোমেইন লোকগান' },
  { slug: 'party', bn: 'পার্টি / EDM', desc: 'ডান্স ও পার্টি এনার্জির গান' },
];

// ---------- helpers ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const bnCollator = new Intl.Collator('bn');

function loadSongs() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const songs = files.map(f => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
    return JSON.parse(raw);
  });
  songs.sort((a, b) => bnCollator.compare(a.title, b.title));
  return songs;
}

function firstChar(title) {
  return [...title][0];
}

function renderLyrics(lyrics) {
  return String(lyrics).split('\n').map(line => {
    const t = line.trim();
    if (!t) return '<div class="ly-gap"></div>';
    if (/^\[.*\]$/.test(t)) return `<div class="ly-section">${esc(t)}</div>`;
    if (/^\(.*\)$/.test(t)) return `<div class="ly-hum">${esc(t)}</div>`;
    return `<div class="ly-line">${esc(line)}</div>`;
  }).join('');
}

function rightsBadge(rights) {
  return rights === 'original'
    ? '<span class="badge badge-original">মৌলিক রচনা</span>'
    : '<span class="badge badge-pd">পাবলিক ডোমেইন</span>';
}

// ---------- layout ----------
function head(title, desc, depth) {
  const rel = depth ? '../' : '';
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(SITE.name)}</title>
<meta name="description" content="${esc(desc || SITE.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Tiro+Bangla:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}style.css">
</head>
<body>`;
}

function header(active, depth) {
  const rel = depth ? '../' : '';
  const nav = [
    ['index.html', 'হোম'],
    ['az.html', 'অ–হ'],
    ['categories.html', 'বিভাগ'],
    ['submit.html', 'লিরিক্স জমা দিন'],
    ['copyright.html', 'কপিরাইট'],
  ];
  const links = nav.map(([href, label]) =>
    `<a href="${rel}${href}" class="${active === href ? 'active' : ''}">${label}</a>`).join('');
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${rel}index.html">🎵 <span>${esc(SITE.name)}</span></a>
    <nav class="main-nav">${links}</nav>
  </div>
</header>`;
}

function footer(depth) {
  const rel = depth ? '../' : '';
  return `<footer class="site-footer">
  <div class="wrap">
    <p><strong>${esc(SITE.name)}</strong> — ${esc(SITE.tagline)}</p>
    <p class="fine">এই সাইটে শুধু মৌলিক রচনা ও যাচাইকৃত পাবলিক-ডোমেইন লিরিক্স প্রকাশিত হয়।
    কপিরাইট সংক্রান্ত অভিযোগ থাকলে <a href="${rel}copyright.html">কপিরাইট নীতি</a> দেখুন।</p>
    <p class="fine"><a href="${rel}admin/">অ্যাডমিন লগইন</a></p>
    <p class="fine">© 2026 ${esc(SITE.name)}</p>
  </div>
</footer>
<script src="${rel}app.js"></script>
</body>
</html>`;
}

function songCard(s, depth) {
  const rel = depth ? '../' : '';
  return `<a class="card" href="${rel}songs/${s.slug}.html">
    <div class="card-top">${rightsBadge(s.rights)}<span class="card-cat">${esc(s.category_bn)}</span></div>
    <h3 class="card-title">${esc(s.title)}</h3>
    <p class="card-sub">${esc(s.transliteration || '')} · ${esc(s.artist)}</p>
    <p class="card-desc">${esc(s.description || '')}</p>
  </a>`;
}

// ---------- pages ----------
function pageHome(songs) {
  const latest = songs.slice(-5).reverse();
  const cats = CATEGORIES.map(c => {
    const n = songs.filter(s => s.category === c.slug).length;
    return `<a class="cat-card" href="category/${c.slug}.html">
      <h3>${esc(c.bn)}</h3><p>${esc(c.desc)}</p><span class="count">${n}টি গান</span></a>`;
  }).join('');
  const azStrip = [...new Set(songs.map(s => firstChar(s.title)))]
    .sort((a, b) => bnCollator.compare(a, b))
    .map(ch => `<a href="az.html#ch-${encodeURIComponent(ch)}" class="az-chip">${esc(ch)}</a>`).join('');
  return head(SITE.name + ' — ' + SITE.tagline, SITE.description) + header('index.html') + `
<main class="wrap">
  <section class="hero">
    <h1>🎵 ${esc(SITE.name)}</h1>
    <p class="tagline">${esc(SITE.tagline)}</p>
    <p class="hero-sub">মৌলিক বাংলা গান ও ঐতিহ্যবাহী লোকগীতির লিরিক্স — অক্ষর ধরে খুঁজুন, পড়ুন, শেয়ার করুন।</p>
    <div class="search-box">
      <input id="searchInput" type="search" placeholder="গানের নাম লিখে খুঁজুন…" autocomplete="off">
      <div id="searchResults" class="search-results"></div>
    </div>
    <div class="hero-badges">${rightsBadge('original')} ${rightsBadge('public-domain')} <span class="badge badge-copy">কপিরাইট-ফার্স্ট</span></div>
  </section>

  <section>
    <h2 class="sec-title">সর্বশেষ যোগ</h2>
    <div class="grid">${latest.map(x => songCard(x)).join('')}</div>
  </section>

  <section>
    <h2 class="sec-title">অক্ষর ধরে খুঁজুন</h2>
    <div class="az-strip">${azStrip}</div>
    <p><a class="btn" href="az.html">সম্পূর্ণ অ–হ তালিকা →</a></p>
  </section>

  <section>
    <h2 class="sec-title">বিভাগ</h2>
    <div class="cat-grid">${cats}</div>
  </section>
</main>` + footer();
}

function pageAZ(songs) {
  const groups = {};
  songs.forEach(s => {
    const ch = firstChar(s.title);
    (groups[ch] = groups[ch] || []).push(s);
  });
  const chars = Object.keys(groups).sort((a, b) => bnCollator.compare(a, b));
  const body = chars.map(ch => `
    <section id="ch-${encodeURIComponent(ch)}" class="az-group">
      <h2 class="az-char">${esc(ch)}</h2>
      <div class="az-list">${groups[ch].map(s =>
        `<a class="az-item" href="songs/${s.slug}.html">
          <span class="az-title">${esc(s.title)}</span>
          <span class="az-meta">${esc(s.artist)} · ${esc(s.category_bn)}</span>
          ${rightsBadge(s.rights)}
        </a>`).join('')}
      </div>
    </section>`).join('');
  return head('অ–হ তালিকা', 'অক্ষর অনুযায়ী সব গানের তালিকা') + header('az.html') + `
<main class="wrap narrow">
  <h1 class="page-title">অ–হ তালিকা</h1>
  <p class="muted">মোট ${songs.length}টি গান</p>
  ${body}
</main>` + footer();
}

function pageCategories(songs) {
  const cards = CATEGORIES.map(c => {
    const n = songs.filter(s => s.category === c.slug).length;
    return `<a class="cat-card" href="category/${c.slug}.html">
      <h3>${esc(c.bn)}</h3><p>${esc(c.desc)}</p><span class="count">${n}টি গান</span></a>`;
  }).join('');
  return head('বিভাগ', 'জনর অনুযায়ী গান') + header('categories.html') + `
<main class="wrap">
  <h1 class="page-title">বিভাগ</h1>
  <div class="cat-grid">${cards}</div>
</main>` + footer();
}

function pageCategory(songs, cat) {
  const list = songs.filter(s => s.category === cat.slug);
  return head(cat.bn, cat.desc, 1) + header('categories.html', 1) + `
<main class="wrap">
  <p class="crumb"><a href="../categories.html">বিভাগ</a> / ${esc(cat.bn)}</p>
  <h1 class="page-title">${esc(cat.bn)}</h1>
  <p class="muted">${esc(cat.desc)} — ${list.length}টি গান</p>
  <div class="grid">${list.map(x => songCard(x, 1)).join('')}</div>
</main>` + footer(1);
}

function pageSong(songs, s) {
  const related = songs.filter(x => x.slug !== s.slug && x.category === s.category).slice(0, 4);
  const meta = [
    ['শিল্পী / চ্যানেল', s.artist],
    ['রচয়িতা', s.writer],
    ['বছর', s.year],
    ['কণ্ঠ', s.vocal],
    ['জনর', s.category_bn],
    ['টেম্পো', s.tempo],
    ['মুড', s.mood],
    ['অধিকার', s.rights_note],
  ].filter(([_, v]) => v).map(([k, v]) =>
    `<div class="meta-row"><span class="meta-k">${esc(k)}</span><span class="meta-v">${esc(v)}</span></div>`).join('');
  return head(s.title, s.description, 1) + header('', 1) + `
<main class="wrap narrow">
  <p class="crumb"><a href="../index.html">হোম</a> / <a href="../category/${s.category}.html">${esc(s.category_bn)}</a></p>
  <article class="song">
    <div class="song-head">
      <h1 class="song-title">${esc(s.title)}</h1>
      <p class="song-sub">${esc(s.transliteration || '')}</p>
      <div class="song-badges">${rightsBadge(s.rights)}<span class="badge badge-cat">${esc(s.category_bn)}</span></div>
      <p class="song-desc">${esc(s.description || '')}</p>
    </div>
    <div class="meta-table">${meta}</div>
    <div class="lyrics" id="lyricsBox">${renderLyrics(s.lyrics)}</div>
    ${s.accuracy_note ? `<p class="accuracy-note">📝 ${esc(s.accuracy_note)}</p>` : ''}
    <div class="song-actions">
      <button class="btn" onclick="copyLyrics()">📋 লিরিক্স কপি করুন</button>
      <button class="btn btn-ghost" onclick="window.print()">🖨️ প্রিন্ট</button>
      <button class="btn btn-ghost" onclick="shareSong('${esc(s.title)}')">🔗 শেয়ার</button>
    </div>
  </article>
  ${related.length ? `<section><h2 class="sec-title">একই বিভাগের আরও গান</h2><div class="grid">${related.map(x => songCard(x, 1)).join('')}</div></section>` : ''}
</main>` + footer(1);
}

function pageSubmit() {
  return head('লিরিক্স জমা দিন', 'আপনার মৌলিক গানের লিরিক্স জমা দিন') + header('submit.html') + `
<main class="wrap narrow">
  <h1 class="page-title">লিরিক্স জমা দিন</h1>
  <div class="info-box">
    <h3>✅ যা গ্রহণ করা হয়</h3>
    <ul>
      <li><strong>আপনার নিজের লেখা মৌলিক গানের লিরিক্স</strong> — কথা ও সুর আপনার নিজের।</li>
      <li><strong>যাচাইকৃত পাবলিক-ডোমেইন লিরিক্স</strong> — যেমন লালন, হাসান রাজা, ঐতিহ্যবাহী লোকগীতি (রচয়িতার মৃত্যুর ৬০+ বছর পার হয়েছে)।</li>
    </ul>
    <h3>❌ যা গ্রহণ করা হয় না</h3>
    <ul>
      <li>কপিরাইটেড গানের লিরিক্স (অন্যের লেখা আধুনিক গান, ব্যান্ড/সিনেমার গান)।</li>
      <li>অস্পষ্ট উৎসের লিরিক্স — রচয়িতা/অধিকার যাচাই না হলে প্রকাশ হয় না।</li>
    </ul>
    <p>নিচের ফর্মটি পূরণ করলে একটি ইমেইল ড্রাফট তৈরি হবে — লিরিক্স পাঠান, যাচাইয়ের পর প্রকাশ করা হবে।</p>
  </div>
  <form class="submit-form" onsubmit="return buildMail(event)">
    <label>গানের শিরোনাম *<input id="fTitle" required placeholder="যেমন: শেষ আশ্রয়"></label>
    <label>রচয়িতার নাম *<input id="fWriter" required placeholder="আপনার নাম"></label>
    <label>শিল্পী / চ্যানেল<input id="fArtist" placeholder="যেমন: গানের ঢোল"></label>
    <label>বিভাগ
      <select id="fCat">
        <option value="রক ব্যালাড">রক ব্যালাড</option>
        <option value="অ্যাকোস্টিক">অ্যাকোস্টিক</option>
        <option value="লোকগীতি">লোকগীতি</option>
        <option value="পার্টি / EDM">পার্টি / EDM</option>
      </select></label>
    <label>অধিকারের ধরন *
      <select id="fRights" required>
        <option value="মৌলিক — আমার নিজের রচনা">মৌলিক — আমার নিজের রচনা</option>
        <option value="পাবলিক ডোমেইন — রচয়িতার মৃত্যু ৬০+ বছর আগে">পাবলিক ডোমেইন — রচয়িতার মৃত্যু ৬০+ বছর আগে</option>
      </select></label>
    <label>লিরিক্স *<textarea id="fLyrics" required rows="12" placeholder="[Verse 1]&#10;আপনার লিরিক্স এখানে লিখুন…"></textarea></label>
    <label class="check"><input type="checkbox" id="fConfirm" required> আমি নিশ্চিত করছি — এই লিরিক্স আমার নিজের মৌলিক রচনা, অথবা যাচাইকৃত পাবলিক-ডোমেইন।</label>
    <button class="btn" type="submit">📧 ইমেইলে পাঠান</button>
  </form>
</main>` + footer();
}

function pageCopyright() {
  return head('কপিরাইট নীতি', 'সাইটের কপিরাইট নীতি ও অভিযোগ প্রক্রিয়া') + header('copyright.html') + `
<main class="wrap narrow">
  <h1 class="page-title">কপিরাইট নীতি</h1>
  <div class="prose">
    <h3>আমাদের অবস্থান</h3>
    <p>এই সাইট <strong>কপিরাইট-ফার্স্ট</strong> — এখানে শুধু দুই ধরনের লিরিক্স প্রকাশিত হয়:</p>
    <ol>
      <li><strong>মৌলিক রচনা</strong> — রচয়িতার নিজের লেখা গান, যার প্রকাশের অনুমতি রচয়িতা নিজে দিয়েছেন।</li>
      <li><strong>পাবলিক-ডোমেইন</strong> — রচয়িতার মৃত্যুর ৬০ বছরের বেশি পার হওয়া ঐতিহ্যবাহী রচনা (যেমন লালন শাহ্, হাসান রাজা)।</li>
    </ol>
    <h3>যা আমরা করি না</h3>
    <p>কপিরাইটেড গানের লিরিক্স — আধুনিক ব্যান্ড, সিনেমা বা শিল্পীর অনুমতি ছাড়া লেখা গান — এখানে প্রকাশ করা হয় <strong>না</strong>। উৎস অস্পষ্ট হলে প্রকাশ স্থগিত থাকে।</p>
    <h3>অভিযোগ / টেকডাউন</h3>
    <p>কোনো লিরিক্স আপনার অধিকার লঙ্ঘন করছে বলে মনে হলে গানের শিরোনাম, URL এবং আপনার অধিকারের প্রমাণসহ জানান — যাচাই করে ৭২ ঘণ্টার মধ্যে ব্যবস্থা নেওয়া হবে।</p>
    <h3>ব্যাজের অর্থ</h3>
    <p>${rightsBadge('original')} — রচয়িতার নিজস্ব মৌলিক রচনা।<br>
    ${rightsBadge('public-domain')} — পাবলিক-ডোমেইন ঐতিহ্যবাহী রচনা।</p>
  </div>
</main>` + footer();
}

function pageAbout(songs) {
  const nOrig = songs.filter(s => s.rights === 'original').length;
  const nPd = songs.filter(s => s.rights !== 'original').length;
  return head('পরিচিতি', SITE.description) + header('') + `
<main class="wrap narrow">
  <h1 class="page-title">${esc(SITE.name)}</h1>
  <div class="prose">
    <p>${esc(SITE.description)}</p>
    <p>বর্তমানে <strong>${songs.length}</strong>টি গান সংরক্ষিত — ${nOrig}টি মৌলিক রচনা ও ${nPd}টি পাবলিক-ডোমেইন লোকগীতি।</p>
    <p>নতুন মৌলিক লিরিক্স যোগ করতে চাইলে <a href="submit.html">লিরিক্স জমা দিন</a> পাতা ব্যবহার করুন।</p>
  </div>
</main>` + footer();
}

// ---------- static assets ----------
const CSS = `:root{
  --bg:#07070f; --ink:#f2efff; --muted:#a89fc7;
  --acc1:#a78bfa; --acc2:#22d3ee; --acc3:#f472b6;
  --grad:linear-gradient(135deg,#a78bfa,#22d3ee);
  --glass:rgba(255,255,255,.045);
  --glass-border:rgba(255,255,255,.12);
}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;color:var(--ink);font-family:'Hind Siliguri',system-ui,sans-serif;line-height:1.7;
  background:var(--bg);min-height:100vh;overflow-x:hidden}
/* ambient glow orbs */
body::before,body::after{content:'';position:fixed;border-radius:50%;filter:blur(110px);z-index:-1;opacity:.5;pointer-events:none}
body::before{width:520px;height:520px;left:-140px;top:-120px;background:radial-gradient(circle,#7c3aed55,transparent 70%);animation:drift 22s ease-in-out infinite alternate}
body::after{width:460px;height:460px;right:-120px;bottom:-100px;background:radial-gradient(circle,#0ea5e955,transparent 70%);animation:drift 26s ease-in-out infinite alternate-reverse}
@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(70px,50px) scale(1.15)}}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px}.wrap.narrow{max-width:760px}
a{color:var(--acc2);text-decoration:none}a:hover{text-decoration:underline}
/* glass header */
.site-header{position:sticky;top:12px;z-index:50;margin:12px auto;max-width:1100px;border-radius:20px;
  background:rgba(15,12,28,.55);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);
  border:1px solid var(--glass-border);box-shadow:0 8px 32px rgba(0,0,0,.35)}
.header-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 20px;flex-wrap:wrap}
.logo{font-size:1.45rem;font-weight:700;color:var(--ink);background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.logo:hover{text-decoration:none}
.main-nav{display:flex;gap:4px;flex-wrap:wrap}
.main-nav a{color:var(--muted);padding:8px 14px;border-radius:12px;font-weight:500;transition:all .2s}
.main-nav a:hover{color:var(--ink);background:rgba(255,255,255,.07);text-decoration:none}
.main-nav a.active{color:#fff;background:linear-gradient(135deg,rgba(167,139,250,.35),rgba(34,211,238,.35));box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
/* hero */
.hero{text-align:center;padding:64px 0 36px;position:relative}
.hero::before{content:'♪';position:absolute;left:6%;top:18%;font-size:3rem;color:rgba(167,139,250,.35);animation:float 6s ease-in-out infinite}
.hero::after{content:'♫';position:absolute;right:7%;top:32%;font-size:2.4rem;color:rgba(34,211,238,.35);animation:float 7s ease-in-out infinite reverse}
@keyframes float{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-16px) rotate(6deg)}}
.hero h1{font-size:3rem;margin:0 0 6px;font-family:'Tiro Bangla',serif;
  background:linear-gradient(120deg,#e9d5ff,#a78bfa 30%,#22d3ee 70%,#a5f3fc);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 2px 18px rgba(167,139,250,.35))}
.tagline{color:var(--acc2);font-size:1.2rem;margin:0 0 8px;letter-spacing:.5px}
.hero-sub{color:var(--muted);max-width:560px;margin:0 auto 22px}
.hero-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px}
.search-box{position:relative;max-width:520px;margin:0 auto}
.search-box input{width:100%;padding:15px 20px;border-radius:18px;border:1px solid var(--glass-border);
  background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  color:var(--ink);font-size:1.05rem;font-family:inherit;box-shadow:0 8px 28px rgba(0,0,0,.3);transition:all .25s}
.search-box input::placeholder{color:var(--muted)}
.search-box input:focus{outline:none;border-color:var(--acc1);box-shadow:0 0 0 3px rgba(167,139,250,.25),0 8px 28px rgba(0,0,0,.3)}
.search-results{position:absolute;top:112%;left:0;right:0;background:rgba(20,16,36,.92);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
  border:1px solid var(--glass-border);border-radius:16px;overflow:hidden;display:none;z-index:60;text-align:left;max-height:320px;overflow-y:auto;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.search-results.show{display:block}
.search-results a{display:block;padding:11px 16px;color:var(--ink);border-bottom:1px solid rgba(255,255,255,.06)}
.search-results a:hover{background:rgba(167,139,250,.14);text-decoration:none}
.search-results .sr-sub{color:var(--muted);font-size:.85rem}
.sec-title{font-size:1.4rem;margin:40px 0 16px;padding-left:14px;position:relative}
.sec-title::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:4px;border-radius:4px;background:var(--grad);box-shadow:0 0 12px rgba(167,139,250,.6)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
/* glass cards */
.card{display:block;color:var(--ink);border-radius:22px;padding:20px;position:relative;overflow:hidden;
  background:var(--glass);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);
  border:1px solid var(--glass-border);box-shadow:0 10px 36px rgba(0,0,0,.35);transition:transform .25s,box-shadow .25s}
.card::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;pointer-events:none;
  background:linear-gradient(135deg,rgba(167,139,250,.5),transparent 40%,transparent 60%,rgba(34,211,238,.5));
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .25s}
.card:hover{transform:translateY(-6px);box-shadow:0 18px 48px rgba(124,58,237,.35);text-decoration:none}
.card:hover::before{opacity:1}
.card-top{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.card-title{margin:0 0 4px;font-size:1.3rem;font-family:'Tiro Bangla',serif}
.card-sub{color:var(--muted);font-size:.9rem;margin:0 0 8px}
.card-desc{color:var(--muted);font-size:.95rem;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-cat{font-size:.78rem;color:var(--acc2);border:1px solid rgba(34,211,238,.4);border-radius:20px;padding:2px 11px;background:rgba(34,211,238,.08)}
.badge{font-size:.75rem;font-weight:600;border-radius:20px;padding:3px 12px;display:inline-block;backdrop-filter:blur(8px)}
.badge-original{background:rgba(127,176,105,.16);color:#b7e6a8;border:1px solid rgba(127,176,105,.45)}
.badge-pd{background:rgba(232,163,61,.14);color:#f4cf8e;border:1px solid rgba(232,163,61,.45)}
.badge-copy{background:rgba(255,255,255,.07);color:#cfc8e8;border:1px solid var(--glass-border)}
.badge-cat{background:rgba(167,139,250,.12);color:#cdb9ff;border:1px solid rgba(167,139,250,.4)}
.az-strip{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px}
.az-chip{display:inline-block;font-size:1.25rem;color:var(--ink);border-radius:14px;padding:9px 16px;
  background:var(--glass);backdrop-filter:blur(12px);border:1px solid var(--glass-border);transition:all .2s}
.az-chip:hover{border-color:var(--acc1);box-shadow:0 0 18px rgba(167,139,250,.4);text-decoration:none;transform:translateY(-2px)}
.btn{display:inline-block;font-weight:700;padding:11px 24px;border-radius:14px;border:none;cursor:pointer;font-family:inherit;font-size:1rem;
  color:#0b0618;background:linear-gradient(135deg,#c4b5fd,#22d3ee);box-shadow:0 6px 24px rgba(124,58,237,.45);transition:all .2s}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(34,211,238,.5);text-decoration:none;color:#0b0618}
.btn-ghost{background:rgba(255,255,255,.06);color:var(--ink);border:1px solid var(--glass-border);box-shadow:none;backdrop-filter:blur(10px)}
.btn-ghost:hover{background:rgba(255,255,255,.12);box-shadow:0 6px 20px rgba(0,0,0,.35);color:#fff}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}
.cat-card{display:block;color:var(--ink);border-radius:22px;padding:22px;position:relative;overflow:hidden;
  background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--glass-border);box-shadow:0 10px 36px rgba(0,0,0,.35);transition:all .25s}
.cat-card::after{content:'';position:absolute;top:-40px;right:-40px;width:130px;height:130px;border-radius:50%;
  background:radial-gradient(circle,rgba(167,139,250,.35),transparent 70%);transition:all .3s}
.cat-card:hover{border-color:var(--acc1);text-decoration:none;transform:translateY(-4px);box-shadow:0 16px 44px rgba(124,58,237,.4)}
.cat-card:hover::after{transform:scale(1.5)}
.cat-card h3{margin:0 0 6px;font-family:'Tiro Bangla',serif;font-size:1.35rem;position:relative;z-index:1}
.cat-card p{color:var(--muted);margin:0 0 10px;font-size:.95rem;position:relative;z-index:1}
.count{font-size:.85rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.page-title{font-family:'Tiro Bangla',serif;font-size:2.1rem;margin:30px 0 8px;
  background:linear-gradient(120deg,#e9d5ff,#22d3ee);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.muted{color:var(--muted)}.crumb{color:var(--muted);font-size:.9rem;margin:22px 0 0}
.az-group{margin-bottom:30px}.az-char{font-size:1.9rem;font-family:'Tiro Bangla',serif;margin:0 0 6px;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.az-list{display:flex;flex-direction:column;background:var(--glass);backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:18px;padding:6px 18px}
.az-item{display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid rgba(255,255,255,.07);color:var(--ink);flex-wrap:wrap}
.az-item:last-child{border-bottom:none}
.az-item:hover{background:rgba(167,139,250,.08);text-decoration:none;border-radius:10px}
.az-title{font-weight:600;font-size:1.1rem}.az-meta{color:var(--muted);font-size:.9rem;margin-left:auto}
/* song page */
.song-head{text-align:center;padding:28px 0 8px}
.song-title{font-family:'Tiro Bangla',serif;font-size:2.4rem;margin:0;
  background:linear-gradient(120deg,#f5efff,#a78bfa 45%,#22d3ee);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 2px 16px rgba(167,139,250,.3))}
.song-sub{color:var(--muted);margin:4px 0 12px}
.song-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
.song-desc{color:var(--muted);max-width:600px;margin:0 auto}
.meta-table{border-radius:18px;padding:8px 20px;margin:22px 0;
  background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--glass-border);box-shadow:0 8px 28px rgba(0,0,0,.3)}
.meta-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.meta-row:last-child{border-bottom:none}.meta-k{color:var(--muted);font-size:.9rem}.meta-v{font-weight:500;text-align:right}
.lyrics{border-radius:20px;padding:30px 26px;margin:22px 0;font-size:1.1rem;position:relative;overflow:hidden;
  background:rgba(10,8,20,.6);backdrop-filter:blur(20px);border:1px solid var(--glass-border);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.lyrics::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--acc1),var(--acc2),transparent)}
.ly-section{font-weight:700;margin:16px 0 6px;font-size:.92rem;letter-spacing:1px;text-transform:uppercase;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ly-hum{color:var(--muted);font-style:italic;margin:4px 0}
.ly-line{margin:3px 0}.ly-gap{height:10px}
.accuracy-note{color:var(--muted);font-size:.9rem;border-radius:12px;padding:10px 14px;background:rgba(255,255,255,.05);border:1px solid var(--glass-border)}
.song-actions{display:flex;gap:10px;flex-wrap:wrap;margin:22px 0 38px}
.info-box{border-radius:18px;padding:22px 24px;margin:22px 0;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--glass-border)}
.info-box h3{margin:14px 0 6px}.info-box h3:first-child{margin-top:0}
.info-box ul{margin:6px 0;padding-left:20px}
.submit-form{border-radius:18px;padding:26px;margin:22px 0 42px;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--glass-border)}
.submit-form label{display:block;margin-bottom:16px;font-weight:500}
.submit-form input,.submit-form textarea,.submit-form select{width:100%;margin-top:6px;padding:12px 15px;border-radius:12px;
  border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:var(--ink);font-family:inherit;font-size:1rem}
.submit-form input:focus,.submit-form textarea,.submit-form select:focus{outline:none;border-color:var(--acc1)}
.submit-form select option{background:#141024}
.submit-form textarea{line-height:1.8}
.submit-form .check{display:flex;gap:10px;align-items:flex-start;font-weight:400}
.submit-form .check input{width:auto;margin-top:6px}
.prose{font-size:1.05rem}.prose h3{color:var(--acc1);margin-top:26px}
.site-footer{margin:56px auto 20px;max-width:1100px;border-radius:20px;padding:30px 20px;text-align:center;
  background:rgba(15,12,28,.5);backdrop-filter:blur(18px);border:1px solid var(--glass-border)}
.site-footer .fine{color:var(--muted);font-size:.85rem;max-width:640px;margin:8px auto}
@media(max-width:640px){.hero h1{font-size:2.1rem}.song-title{font-size:1.8rem}.lyrics{padding:22px 16px}.site-header{top:8px;margin:8px}}
@media print{.site-header,.site-footer,.song-actions,.crumb{display:none}body{background:#fff;color:#000}body::before,body::after{display:none}.lyrics{border:1px solid #ccc;box-shadow:none}}
`;

const JS = `// client-side search + song page helpers
(function(){
  const input = document.getElementById('searchInput');
  const box = document.getElementById('searchResults');
  if (input && box) {
    fetch('search.json')
      .then(r => r.json()).then(idx => {
        input.addEventListener('input', () => {
          const q = input.value.trim();
          if (q.length < 2) { box.classList.remove('show'); box.innerHTML=''; return; }
          const hits = idx.filter(s => (s.title+' '+s.transliteration+' '+s.artist).includes(q)).slice(0,8);
          box.innerHTML = hits.length
            ? hits.map(s => \`<a href="songs/\${s.slug}.html"><div>\${s.title}</div><div class="sr-sub">\${s.artist} · \${s.category_bn}</div></a>\`).join('')
            : '<a><div>কিছু পাওয়া যায়নি</div></a>';
          box.classList.add('show');
        });
        document.addEventListener('click', e => { if(!e.target.closest('.search-box')) box.classList.remove('show'); });
      }).catch(()=>{});
  }
})();
function copyLyrics(){
  const el = document.getElementById('lyricsBox');
  if(!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(()=>alert('লিরিক্স কপি হয়েছে ✅')).catch(()=>alert('কপি করা যায়নি'));
}
function shareSong(title){
  const url = location.href;
  if(navigator.share){ navigator.share({title: title, url: url}).catch(()=>{}); }
  else { navigator.clipboard.writeText(url).then(()=>alert('লিংক কপি হয়েছে ✅')); }
}
function buildMail(e){
  e.preventDefault();
  const g = id => document.getElementById(id).value.trim();
  if(!document.getElementById('fConfirm').checked){ alert('অনুগ্রহ করে নিশ্চিতকরণে টিক দিন।'); return false; }
  const subject = encodeURIComponent('লিরিক্স জমা: ' + g('fTitle'));
  const body = encodeURIComponent(
    'শিরোনাম: '+g('fTitle')+'\\nরচয়িতা: '+g('fWriter')+'\\nশিল্পী/চ্যানেল: '+g('fArtist')+
    '\\nবিভাগ: '+g('fCat')+'\\nঅধিকার: '+g('fRights')+'\\n\\n--- লিরিক্স ---\\n'+g('fLyrics'));
  location.href = 'mailto:lyrics@ganerkotha.example?subject='+subject+'&body='+body;
  return false;
}`;

// ---------- build ----------
function write(p, content) {
  const full = path.join(OUT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return p;
}

function main() {
  const songs = loadSongs();
  console.log(`Loaded ${songs.length} songs`);
  fs.rmSync(OUT, { recursive: true, force: true });

  write('style.css', CSS);
  write('app.js', JS);

  write('index.html', pageHome(songs));
  write('az.html', pageAZ(songs));
  write('categories.html', pageCategories(songs));
  write('submit.html', pageSubmit());
  write('copyright.html', pageCopyright());
  write('about.html', pageAbout(songs));
  write('404.html', head('পাওয়া যায়নি', '') + header('') +
    '<main class="wrap narrow"><h1 class="page-title">পাতা পাওয়া যায়নি</h1><p><a href="index.html">হোমে ফিরুন →</a></p></main>' + footer());

  CATEGORIES.forEach(c => write(`category/${c.slug}.html`, pageCategory(songs, c)));
  songs.forEach(s => write(`songs/${s.slug}.html`, pageSong(songs, s)));

  write('admin/index.html', pageAdmin());
  fs.copyFileSync(path.join(ROOT, 'admin-src', 'admin.js'), path.join(OUT, 'admin', 'admin.js'));
  fs.copyFileSync(path.join(ROOT, 'admin-src', 'admin.css'), path.join(OUT, 'admin', 'admin.css'));

  write('search.json', JSON.stringify(songs.map(s => ({
    slug: s.slug, title: s.title, transliteration: s.transliteration || '',
    artist: s.artist, category_bn: s.category_bn,
  })), null, 1));

  write('robots.txt', 'User-agent: *\nAllow: /\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['index.html','az.html','categories.html','submit.html','copyright.html','about.html']
  .concat(CATEGORIES.map(c=>`category/${c.slug}.html`))
  .concat(songs.map(s=>`songs/${s.slug}.html`))
  .map(p=>`  <url><loc>${p}</loc></url>`).join('\n')}
</urlset>`);

  console.log('Built docs/ with', songs.length, 'songs');
}

main();

function pageAdmin() {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>অ্যাডমিন — গানের কথা</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Tiro+Bangla:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="../index.html">🎵 <span>গানের কথা</span></a>
    <span class="badge badge-copy">অ্যাডমিন প্যানেল</span>
  </div>
</header>
<main class="wrap narrow">
  <div id="toast" class="toast"></div>

  <div id="loginView" class="glass-panel" style="display:none">
    <h2>🔐 অ্যাডমিন লগইন</h2>
    <p class="muted">GitHub token দিয়ে লগইন করুন। Token শুধু আপনার এই ব্রাউজারে থাকে।</p>
    <ol class="steps">
      <li><a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">এখানে ক্লিক করে</a> <strong>Generate new token</strong> চাপুন</li>
      <li>Repository access-এ <strong>Only select repositories</strong> → <strong>bangla-lyrics</strong> সিলেক্ট করুন</li>
      <li>Permissions-এ <strong>Contents</strong> → <strong>Read and write</strong> দিন</li>
      <li>Generate করে token-টি কপি করে নিচে পেস্ট করুন</li>
    </ol>
    <label>GitHub Token<input id="pat" type="password" placeholder="github_pat_..." autocomplete="off"></label>
    <button class="btn" onclick="doLogin()">লগইন →</button>
  </div>

  <div id="appView" style="display:none">
    <div class="topbar">
      <span id="whoami" class="muted"></span>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">🚪 লগআউট</button>
    </div>

    <div class="glass-panel">
      <h2 id="formTitle">➕ নতুন গান যোগ করুন</h2>
      <div class="admin-grid">
        <label class="full">গানের শিরোনাম *<input id="f_title" placeholder="যেমন: শেষ আশ্রয়"></label>
        <label>Transliteration (ইংরেজিতে)<input id="f_trans" placeholder="যেমন: Shesh Ashroy"></label>
        <label>Slug (auto)<input id="f_slug" placeholder="shesh-ashroy"></label>
        <label>শিল্পী / চ্যানেল<input id="f_artist" placeholder="যেমন: গানের ঢোল"></label>
        <label>রচয়িতা<input id="f_writer" placeholder="আপনার নাম"></label>
        <label>বিভাগ<select id="f_cat">
          <option value="rock-ballad">রক ব্যালাড</option>
          <option value="acoustic">অ্যাকোস্টিক</option>
          <option value="folk">লোকগীতি</option>
          <option value="party">পার্টি / EDM</option>
        </select></label>
        <label>অধিকার<select id="f_rights">
          <option value="original">মৌলিক — আমার নিজের রচনা</option>
          <option value="public-domain">পাবলিক ডোমেইন</option>
        </select></label>
        <label>বছর<input id="f_year" placeholder="২০২৬"></label>
        <label>কণ্ঠ<input id="f_vocal" placeholder="পুরুষ কণ্ঠ / নারী কণ্ঠ"></label>
        <label>টেম্পো<input id="f_tempo" placeholder="৯৫ BPM"></label>
        <label>মুড<input id="f_mood" placeholder="বিরহ, ভালোবাসা"></label>
        <label class="full">ছোট বিবরণ<textarea id="f_desc" rows="2" placeholder="গান সম্পর্কে ১-২ লাইন"></textarea></label>
        <label class="full">নির্ভুলতা নোট (ঐচ্ছিক)<input id="f_note" placeholder="যেমন: বহুপ্রচলিত সংস্করণ"></label>
        <label class="full">লিরিক্স *<textarea id="f_lyrics" rows="14" placeholder="[Verse 1]&#10;আপনার লিরিক্স এখানে…"></textarea></label>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
        <button id="saveBtn" class="btn" onclick="saveSong()">💾 প্রকাশ করুন</button>
        <button class="btn btn-ghost" onclick="resetForm()">↺ ফর্ম খালি করুন</button>
      </div>
      <p class="muted" style="margin-top:12px">⚖️ শুধু নিজের মৌলিক লিরিক্স বা যাচাইকৃত পাবলিক-ডোমেইন লিরিক্স পোস্ট করুন।</p>
    </div>

    <div class="glass-panel">
      <h2>📋 প্রকাশিত গান</h2>
      <div id="songList"><p class="muted">লোড হচ্ছে…</p></div>
    </div>
  </div>
</main>
<script src="admin.js"></script>
</body>
</html>`;
}
