# গানের কথা — Bangla Song Lyrics Archive

A copyright-first Bangla song lyrics website. Static site, zero dependencies,
GitHub Pages ready (same pattern as bishwa-barta).

## What's on it

- **Home** — hero + live search, latest songs, A–Z strip, category cards
- **অ–হ (A–Z)** — full alphabetical index of all songs
- **বিভাগ** — categories: রক ব্যালাড, অ্যাকোস্টিক, লোকগীতি, পার্টি / EDM
- **Song pages** — full lyrics (section-styled), meta table, copy / print / share buttons
- **লিরিক্স জমা দিন** — submission form (copyright-first rules + mailto draft)
- **কপিরাইট নীতি** — takedown policy page
- `search.json`, `sitemap.xml`, `robots.txt`, `404.html` included

## Content rule (important)

Only two kinds of lyrics are published here:

1. **মৌলিক রচনা** — original lyrics you own (your Ganer Dhol songs)
2. **পাবলিক ডোমেইন** — verified public-domain works (Lalon, Hasan Raja, traditional folk)

Never publish copyrighted lyrics (modern bands, film songs, other artists' work).
The submit page and copyright page enforce this for contributors too.

## Admin panel (login + post from browser)

- Open **https://naimxislambd.github.io/bangla-lyrics/admin/**
- First time: create a fine-grained PAT at
  `github.com/settings/tokens?type=beta` → repo **bangla-lyrics** →
  **Contents: Read and write** → paste it on the admin login page
  (token stays only in your browser)
- Fill the form → **প্রকাশ করুন** → the song JSON is committed to
  `data/songs/` via the GitHub API
- A GitHub Actions workflow (`.github/workflows/build.yml`) auto-runs
  `node build.js`, rebuilds `docs/`, and pushes — the site updates in ~1-2 min
- You can also edit or delete published songs from the panel

## Add a new song (manual)

1. Copy a JSON from `data/songs/` as a template into `data/songs/your-slug.json`
2. Fill in: title, transliteration, artist, writer, year, category, lyrics
   (`rights`: `"original"` or `"public-domain"`)
3. Run `node build.js` — the whole `docs/` site rebuilds

## Deploy to GitHub Pages

```bash
cd ~/workspace/bangla-lyrics
git init && git add -A && git commit -m "গানের কথা lyrics site"
gh repo create bangla-lyrics --public --source=. --push
# then: repo → Settings → Pages → Deploy from branch → main → /docs
```

Live URL will be: `https://<username>.github.io/bangla-lyrics/`

## Current content (8 songs)

Originals: শেষ আশ্রয় · চোখের জল · বৃষ্টিভেজা শহর · নদীর অপেক্ষা · ধুমধাড়াক্কা
Public domain folk: সব লোকে কয় লালন · খাঁচার ভিতর অচিন পাখি · আমি কোথায় পাব তারে
