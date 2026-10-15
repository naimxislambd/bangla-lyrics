/* গানের কথা — Admin panel
   Login = GitHub fine-grained PAT (Contents: read+write on bangla-lyrics repo).
   Token stays in this browser's localStorage only. */
'use strict';

const REPO_OWNER = 'naimxislambd';
const REPO_NAME = 'bangla-lyrics';
const BRANCH = 'main';
const LS_KEY = 'gk_admin_pat';

const CATS = [
  { slug: 'rock-ballad', bn: 'রক ব্যালাড' },
  { slug: 'acoustic',    bn: 'অ্যাকোস্টিক' },
  { slug: 'folk',        bn: 'লোকগীতি' },
  { slug: 'party',       bn: 'পার্টি / EDM' },
];

let token = localStorage.getItem(LS_KEY) || '';
let editingSha = null;   // sha of file being edited (null = new)
let songIndex = [];      // [{name, path, sha}]

const el = id => document.getElementById(id);
const show = (id, on) => { el(id).style.display = on ? '' : 'none'; };

function toast(msg, bad) {
  const t = el('toast');
  t.textContent = msg;
  t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3500);
}

async function api(path, method, body) {
  const res = await fetch('https://api.github.com' + path, {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
  return data;
}

const b64enc = s => btoa(unescape(encodeURIComponent(s)));
const b64dec = b => decodeURIComponent(escape(atob(b.replace(/\n/g, ''))));

/* ---------- login ---------- */
async function doLogin() {
  const t = el('pat').value.trim();
  if (!t) return toast('প্রথমে token পেস্ট করুন', true);
  token = t;
  try {
    const me = await api('/user');
    localStorage.setItem(LS_KEY, token);
    enterApp(me.login);
  } catch (e) {
    token = '';
    toast('লগইন ব্যর্থ: ' + e.message, true);
  }
}

function doLogout() {
  localStorage.removeItem(LS_KEY);
  token = '';
  location.reload();
}

function enterApp(username) {
  show('loginView', false);
  show('appView', true);
  el('whoami').textContent = 'লগইন: ' + username;
  resetForm();
  loadList();
}

/* ---------- song list ---------- */
async function loadList() {
  const box = el('songList');
  box.innerHTML = '<p class="muted">লোড হচ্ছে…</p>';
  try {
    const items = await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/songs?ref=${BRANCH}`);
    songIndex = items.filter(i => i.type === 'file' && i.name.endsWith('.json'));
    if (!songIndex.length) { box.innerHTML = '<p class="muted">এখনো কোনো গান নেই।</p>'; return; }
    box.innerHTML = songIndex.map((f, i) =>
      `<div class="song-row"><span class="song-row-name">${esc(f.name.replace(/\.json$/, ''))}</span>
       <span class="song-row-btns">
         <button class="btn btn-sm" onclick="editSong(${i})">✏️ এডিট</button>
         <button class="btn btn-sm btn-danger" onclick="deleteSong(${i})">🗑️ ডিলিট</button>
       </span></div>`).join('');
  } catch (e) {
    box.innerHTML = '<p class="muted">তালিকা আনা যায়নি: ' + esc(e.message) + '</p>';
  }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- form ---------- */
function slugify(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function resetForm() {
  editingSha = null;
  el('formTitle').textContent = '➕ নতুন গান যোগ করুন';
  ['f_title','f_trans','f_slug','f_artist','f_writer','f_year','f_vocal','f_tempo','f_mood','f_desc','f_note','f_lyrics']
    .forEach(id => { el(id).value = ''; });
  el('f_cat').selectedIndex = 0;
  el('f_rights').selectedIndex = 0;
  el('saveBtn').textContent = '💾 প্রকাশ করুন';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function editSong(i) {
  const f = songIndex[i];
  toast('লোড হচ্ছে…');
  try {
    const data = await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${f.path}?ref=${BRANCH}`);
    const song = JSON.parse(b64dec(data.content));
    editingSha = data.sha;
    el('formTitle').textContent = '✏️ এডিট: ' + song.title;
    el('f_title').value = song.title || '';
    el('f_trans').value = song.transliteration || '';
    el('f_slug').value = song.slug || '';
    el('f_artist').value = song.artist || '';
    el('f_writer').value = song.writer || '';
    el('f_year').value = song.year || '';
    el('f_cat').value = song.category || 'rock-ballad';
    el('f_vocal').value = song.vocal || '';
    el('f_tempo').value = song.tempo || '';
    el('f_mood').value = song.mood || '';
    el('f_rights').value = song.rights || 'original';
    el('f_desc').value = song.description || '';
    el('f_note').value = song.accuracy_note || '';
    el('f_lyrics').value = song.lyrics || '';
    el('saveBtn').textContent = '💾 আপডেট করুন';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('এডিট মোডে আছেন');
  } catch (e) {
    toast('লোড ব্যর্থ: ' + e.message, true);
  }
}

async function deleteSong(i) {
  const f = songIndex[i];
  const song = songIndex[i];
  if (!confirm('"' + f.name + '" ডিলিট করবেন? এই কাজ undo করা যাবে না!')) return;
  try {
    const data = await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${f.path}?ref=${BRANCH}`);
    await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${f.path}`, 'DELETE', {
      message: 'ডিলিট: ' + f.name,
      sha: data.sha,
      branch: BRANCH,
    });
    toast('🗑️ ডিলিট হয়েছে — সাইট ১-২ মিনিটে আপডেট হবে');
    loadList();
  } catch (e) {
    toast('ডিলিট ব্যর্থ: ' + e.message, true);
  }
}

function collectSong() {
  const title = el('f_title').value.trim();
  const trans = el('f_trans').value.trim();
  let slug = el('f_slug').value.trim() || slugify(trans) || slugify(title);
  const lyrics = el('f_lyrics').value.trim();
  if (!title) throw new Error('গানের শিরোনাম দিন');
  if (!lyrics) throw new Error('লিরিক্স দিন');
  if (!slug) throw new Error('slug বানানো যায়নি — transliteration ইংরেজিতে দিন');
  const cat = CATS.find(c => c.slug === el('f_cat').value);
  const rights = el('f_rights').value;
  const artist = el('f_artist').value.trim();
  const writer = el('f_writer').value.trim();
  return {
    slug,
    title,
    transliteration: trans,
    artist,
    writer,
    year: el('f_year').value.trim() || '২০২৬',
    category: cat.slug,
    category_bn: cat.bn,
    vocal: el('f_vocal').value.trim(),
    tempo: el('f_tempo').value.trim(),
    mood: el('f_mood').value.trim(),
    rights,
    rights_note: rights === 'original'
      ? 'সম্পূর্ণ মৌলিক রচনা — ' + (artist || writer || 'গানের কথা')
      : 'পাবলিক ডোমেইন — ' + (writer || 'ঐতিহ্যবাহী'),
    description: el('f_desc').value.trim(),
    accuracy_note: el('f_note').value.trim() || undefined,
    lyrics,
  };
}

async function saveSong() {
  let song;
  try { song = collectSong(); }
  catch (e) { return toast(e.message, true); }

  // copyright gate
  if (song.rights === 'original' && !confirm('নিশ্চিত করুন: এই লিরিক্স আপনার নিজের মৌলিক রচনা, অন্যের কপিরাইটেড গান নয়।\n\nঠিক আছে?')) return;

  const path = `data/songs/${song.slug}.json`;
  const content = b64enc(JSON.stringify(song, null, 2) + '\n');
  el('saveBtn').disabled = true;
  el('saveBtn').textContent = '⏳ সেভ হচ্ছে…';
  try {
    let sha = editingSha;
    if (!sha) {
      try {
        const existing = await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`);
        sha = existing.sha;
        if (!confirm('এই slug-এ গান already আছে। Overwrite করবেন?')) {
          el('saveBtn').disabled = false; el('saveBtn').textContent = '💾 প্রকাশ করুন'; return;
        }
      } catch (e) { /* not found = new file, fine */ }
    }
    const body = { message: (sha ? 'আপডেট' : 'নতুন গান') + ': ' + song.title, content, branch: BRANCH };
    if (sha) body.sha = sha;
    await api(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, 'PUT', body);
    toast('✅ সেভ হয়েছে! সাইট ১-২ মিনিটে আপডেট হবে।');
    resetForm();
    loadList();
  } catch (e) {
    toast('সেভ ব্যর্থ: ' + e.message, true);
  } finally {
    el('saveBtn').disabled = false;
  }
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  el('f_trans').addEventListener('input', () => {
    if (!editingSha && !el('f_slug').dataset.touched) el('f_slug').value = slugify(el('f_trans').value);
  });
  el('f_slug').addEventListener('input', () => { el('f_slug').dataset.touched = '1'; });
  if (token) {
    try {
      const me = await api('/user');
      enterApp(me.login);
    } catch (e) {
      localStorage.removeItem(LS_KEY);
      token = '';
      show('loginView', true);
      toast('সেশন শেষ — আবার লগইন করুন', true);
    }
  } else {
    show('loginView', true);
  }
});
