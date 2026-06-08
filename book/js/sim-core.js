/* sim-core.js — 시뮬레이터 공통 헬퍼 (의존성 없음) */
(function (global) {
  'use strict';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* stage 안에서 fromEl 중심 → toEl 중심으로 점을 날린다 */
  function fly(stage, fromEl, toEl, opts) {
    opts = opts || {};
    var dur = opts.dur || 900;
    return new Promise(function (resolve) {
      var sr = stage.getBoundingClientRect();
      var fr = fromEl.getBoundingClientRect();
      var tr = toEl.getBoundingClientRect();
      var dot = el('div', 'sim-dot ' + (opts.cls || 'req'));
      if (opts.tag) dot.appendChild(el('span', 'tag', opts.tag));
      var sz = 14;
      dot.style.transitionDuration = dur + 'ms, ' + dur + 'ms';
      dot.style.left = (fr.left + fr.width / 2 - sr.left - sz / 2) + 'px';
      dot.style.top = (fr.top + fr.height / 2 - sr.top - sz / 2) + 'px';
      stage.appendChild(dot);
      // 강제 리플로우 후 목적지로
      void dot.offsetWidth;
      dot.style.left = (tr.left + tr.width / 2 - sr.left - sz / 2) + 'px';
      dot.style.top = (tr.top + tr.height / 2 - sr.top - sz / 2) + 'px';
      setTimeout(function () {
        dot.remove();
        resolve();
      }, dur + 60);
    });
  }

  /* 터미널 로그 한 줄 추가. kind: p(프롬프트) c(주석) e(에러) o(출력) */
  function log(term, text, kind) {
    var line = el('div', null);
    var span = el('span', kind ? 'tl-' + kind : null);
    span.textContent = text;
    line.appendChild(span);
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
    return line;
  }

  function setStatus(box, html, mood) {
    box.className = 'sim-status' + (mood ? ' ' + mood : '');
    box.innerHTML = html;
  }

  /* 진행 단계 칩 갱신 */
  function markSteps(stepEls, current) {
    stepEls.forEach(function (s, i) {
      s.className = 'sim-step' + (i < current ? ' done' : i === current ? ' on' : '');
    });
  }

  function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  global.SimCore = { el: el, sleep: sleep, fly: fly, log: log, setStatus: setStatus, markSteps: markSteps, injectStyle: injectStyle };
})(window);
