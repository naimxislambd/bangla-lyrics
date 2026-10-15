// client-side search + song page helpers
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
            ? hits.map(s => `<a href="songs/${s.slug}.html"><div>${s.title}</div><div class="sr-sub">${s.artist} · ${s.category_bn}</div></a>`).join('')
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
    'শিরোনাম: '+g('fTitle')+'\nরচয়িতা: '+g('fWriter')+'\nশিল্পী/চ্যানেল: '+g('fArtist')+
    '\nবিভাগ: '+g('fCat')+'\nঅধিকার: '+g('fRights')+'\n\n--- লিরিক্স ---\n'+g('fLyrics'));
  location.href = 'mailto:lyrics@ganerkotha.example?subject='+subject+'&body='+body;
  return false;
}