(function () {
  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const progress = document.getElementById('progress');
  const hud = document.getElementById('hud');
  const notes = document.getElementById('notes');
  let i = 0;

  function clampIndex(n){ return Math.max(0, Math.min(slides.length - 1, n)); }

  function render() {
    slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    progress.style.width = ((i + 1) / slides.length * 100) + '%';
    const part = slides[i].dataset.part || '-';
    hud.textContent = `${part}부 · ${i + 1} / ${slides.length}`;
    const note = slides[i].querySelector('.note');
    notes.textContent = note ? note.textContent : '(스피커 노트 없음)';
    if (location.hash !== '#s' + i) history.replaceState(null, '', '#s' + i);
  }

  function go(n){ i = clampIndex(n); render(); }
  function next(){ go(i + 1); }
  function prev(){ go(i - 1); }

  // 화면 크기에 맞춰 16:9 스케일
  function fit(){
    const sw = window.innerWidth / 1280, sh = window.innerHeight / 720;
    deck.style.setProperty('--scale', Math.min(sw, sh).toFixed(4));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { prev(); }
    else if (e.key === 's' || e.key === 'S') { notes.classList.toggle('show'); }
    else if (e.key === 'Home') { go(0); }
    else if (e.key === 'End') { go(slides.length - 1); }
  });
  document.getElementById('navL').addEventListener('click', prev);
  document.getElementById('navR').addEventListener('click', next);
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', () => {
    const m = /^#s(\d+)$/.exec(location.hash);
    if (m && +m[1] !== i) go(+m[1]);
  });

  // 초기 위치: 해시 우선
  const m = /^#s(\d+)$/.exec(location.hash);
  if (m) i = clampIndex(+m[1]);
  fit(); render();

  window.Deck = { go, next, prev, count: () => slides.length };
})();
