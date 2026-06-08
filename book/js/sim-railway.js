/* sim-railway.js — Railway PaaS 시뮬레이터
   개발자는 git push 한 번. 감지→빌드→컨테이너화→배포→HTTPS는 전부 플랫폼이.
   EC2 수동 배포(7단계)와의 대비가 핵심. */
(function (global) {
  'use strict';
  var C = global.SimCore;

  var CSS = [
    '.sim-rw .rw-wrap{display:flex;gap:14px;align-items:stretch;flex-wrap:wrap}',
    '.sim-rw .rw-node{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:11px;text-align:center;flex:0 0 138px;align-self:flex-start}',
    '.sim-rw .rw-node .h{font-weight:800;font-size:12.5px;color:var(--ink)}',
    '.sim-rw .rw-node .s{font-size:11px;color:var(--muted);margin-top:3px;min-height:16px}',
    '.sim-rw .rw-commits{margin-top:8px;display:flex;flex-direction:column;gap:4px;max-height:84px;overflow:hidden}',
    '.sim-rw .rw-commit{font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;background:#f8fafc;border:1px solid var(--line);border-radius:6px;padding:2px 7px;color:var(--ink)}',
    '.sim-rw .rw-commit.new{background:var(--accent-soft);border-color:#c7d2fe;color:#3730a3}',
    '.sim-rw .rw-platform{flex:1;min-width:240px;border:2px solid #a78bfa;border-radius:16px;background:#faf5ff;padding:12px}',
    '.sim-rw .rw-platform .ph{font-weight:800;font-size:12.5px;color:#6d28d9;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:9px}',
    '.sim-rw .rw-platform .ph .auto{font-size:10px;background:#ede9fe;border:1px solid #ddd6fe;border-radius:6px;padding:2px 7px;color:#6d28d9}',
    '.sim-rw .rw-stages{display:flex;flex-direction:column;gap:6px}',
    '.sim-rw .rw-stage{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line);border-radius:9px;padding:7px 10px;font-size:12px;color:var(--muted);transition:all .3s}',
    '.sim-rw .rw-stage .st{width:17px;height:17px;border-radius:50%;background:#f1f5f9;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:10px;flex:0 0 17px}',
    '.sim-rw .rw-stage b{color:var(--ink);font-size:12px}',
    '.sim-rw .rw-stage .d{font-size:10.5px}',
    '.sim-rw .rw-stage.run{border-color:#c7d2fe;background:var(--accent-soft)}',
    '.sim-rw .rw-stage.ok{border-color:#bbf7d0;background:var(--ok-soft)}',
    '.sim-rw .rw-stage.ok .st{background:#16a34a;border-color:#16a34a;color:#fff}',
    '.sim-rw .rw-url{margin-top:10px;display:none;font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;background:var(--ok-soft);border:1.5px solid #bbf7d0;color:#15803d;border-radius:9px;padding:7px 10px;text-align:center;word-break:break-all}',
    '.sim-rw .rw-url.show{display:block}',
    '.sim-rw .rw-score{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}',
    '.sim-rw .rw-card{flex:1;min-width:200px;border-radius:12px;padding:10px 13px;border:1.5px solid var(--line);background:#fff}',
    '.sim-rw .rw-card .t{font-size:11px;font-weight:800;letter-spacing:.06em;margin-bottom:6px}',
    '.sim-rw .rw-card.me .t{color:#c2680c}',
    '.sim-rw .rw-card.pf .t{color:#15803d}',
    '.sim-rw .rw-tags{display:flex;flex-wrap:wrap;gap:4px}',
    '.sim-rw .rw-tag{font-size:10.5px;font-weight:700;border-radius:6px;padding:2px 8px;border:1px solid var(--line);background:#fafafa;color:#9ca3af}',
    '.sim-rw .rw-tag.lit-me{background:#fff7ed;border-color:#fed7aa;color:#c2680c}',
    '.sim-rw .rw-tag.lit-pf{background:var(--ok-soft);border-color:#bbf7d0;color:#15803d}',
    '.sim-rw .rw-ver{display:inline-block;margin-left:6px;font-size:10px;background:#ede9fe;color:#6d28d9;border-radius:6px;padding:1px 6px;vertical-align:1px}'
  ].join('\n');

  function render(root) {
    C.injectStyle('sim-rw-css', CSS);
    root.innerHTML = '';
    root.classList.add('sim', 'sim-rw');

    var head = C.el('div', 'sim-head');
    head.appendChild(C.el('div', 'sim-title', '🚄 Railway PaaS — git push 하면 끝'));
    var ctr = C.el('div', 'sim-controls');
    var btnPush = C.el('button', 'sim-btn', 'git push ▶');
    var btnReset = C.el('button', 'sim-btn ghost', '↺ 처음부터');
    ctr.appendChild(btnPush); ctr.appendChild(btnReset);
    head.appendChild(ctr);
    root.appendChild(head);

    var stage = C.el('div', 'sim-stage');
    var wrap = C.el('div', 'rw-wrap');

    var dev = C.el('div', 'rw-node',
      '<div class="h">💻 개발자</div>');
    var devStat = C.el('div', 's', '코드 수정 완료');
    dev.appendChild(devStat);

    var gh = C.el('div', 'rw-node', '<div class="h">🐙 GitHub</div><div class="s">저장소 (main)</div>');
    var commits = C.el('div', 'rw-commits');
    gh.appendChild(commits);

    var pf = C.el('div', 'rw-platform');
    var ph = C.el('div', 'ph');
    ph.appendChild(C.el('span', null, '🚄 Railway 플랫폼'));
    ph.appendChild(C.el('span', 'auto', '전부 자동'));
    pf.appendChild(ph);
    var stWrap = C.el('div', 'rw-stages');
    var STAGE_DEFS = [
      ['🔔', '푸시 감지', 'GitHub webhook 수신'],
      ['🏗', '빌드', 'JDK 21 감지 → ./gradlew build'],
      ['📦', '컨테이너화', 'app.jar → 컨테이너 이미지'],
      ['🚀', '배포 · 롤아웃', '새 버전으로 무중단 교체'],
      ['🔐', 'HTTPS', 'TLS 인증서 자동 발급·갱신']
    ];
    var stageEls = STAGE_DEFS.map(function (d) {
      var s = C.el('div', 'rw-stage');
      s.appendChild(C.el('span', 'st', ''));
      s.appendChild(C.el('span', null, '<b>' + d[1] + '</b> <span class="d">— ' + d[2] + '</span>'));
      stWrap.appendChild(s);
      return s;
    });
    pf.appendChild(stWrap);
    var urlChip = C.el('div', 'rw-url', '');
    pf.appendChild(urlChip);

    wrap.appendChild(dev); wrap.appendChild(gh); wrap.appendChild(pf);
    stage.appendChild(wrap);
    root.appendChild(stage);

    /* 점수판: 내가 한 일 vs 플랫폼이 한 일 */
    var score = C.el('div', 'rw-score');
    var cardMe = C.el('div', 'rw-card me');
    cardMe.appendChild(C.el('div', 't', '🙋 내가 한 일'));
    var meTags = C.el('div', 'rw-tags');
    var tagPush = C.el('span', 'rw-tag', 'git push');
    meTags.appendChild(tagPush);
    cardMe.appendChild(meTags);
    var cardPf = C.el('div', 'rw-card pf');
    cardPf.appendChild(C.el('div', 't', '🚄 플랫폼이 대신한 일 (EC2에선 전부 내 몫)'));
    var pfTags = C.el('div', 'rw-tags');
    var PF_TASKS = ['서버 생성', 'SSH 접속', 'JDK 설치', '빌드', '파일 전송', '실행·재시작', '포트 개방', 'HTTPS 인증서'];
    var pfTagEls = PF_TASKS.map(function (t) {
      var e = C.el('span', 'rw-tag', t);
      pfTags.appendChild(e);
      return e;
    });
    cardPf.appendChild(pfTags);
    score.appendChild(cardMe); score.appendChild(cardPf);
    root.appendChild(score);

    var status = C.el('div', 'sim-status',
      'EC2에서 일곱 단계를 직접 했던 그 배포를, 이번엔 <b>git push 한 번</b>으로 해봅니다. 버튼을 눌러보세요.');
    root.appendChild(status);

    var ver = 0, busy = false;

    function hash() {
      return Math.random().toString(16).slice(2, 8);
    }

    function push() {
      if (busy) return;
      busy = true;
      btnPush.disabled = true;
      ver++;
      var h = hash();
      devStat.textContent = 'git push origin main';
      tagPush.className = 'rw-tag lit-me';
      stageEls.forEach(function (s) {
        s.className = 'rw-stage';
        s.querySelector('.st').innerHTML = '';
      });
      urlChip.classList.remove('show');
      C.setStatus(status, '<b>git push!</b> 커밋이 GitHub으로 올라갑니다…');

      C.fly(stage, dev, gh, { cls: 'file', tag: 'commit ' + h, dur: 800 })
        .then(function () {
          var c = C.el('div', 'rw-commit new', h + ' · v' + ver);
          commits.insertBefore(c, commits.firstChild);
          if (commits.children.length > 3) commits.removeChild(commits.lastChild);
          devStat.textContent = '✅ push 완료 — 이제 끝!';
          C.setStatus(status, '개발자의 일은 <b>여기서 끝</b>입니다. 이후는 전부 Railway가 알아서. (GitHub webhook이 Railway에 "새 커밋!"을 알립니다)');
          return C.fly(stage, gh, pf, { cls: 'req', tag: 'webhook', dur: 800 });
        })
        .then(function () {
          /* 플랫폼 스테이지 순차 실행 */
          var msgs = [
            '새 커밋 <b>' + h + '</b> 감지. 빌드 환경을 플랫폼이 직접 준비합니다 — EC2에서 손으로 했던 "JDK 설치"가 사라졌습니다.',
            '플랫폼이 코드를 분석해 JDK를 띄우고 <b>./gradlew build</b> 실행 중. 내 노트북 사양과 무관하게 항상 같은 환경에서 빌드됩니다.',
            'JAR을 컨테이너 이미지로 포장. "내 컴에선 되는데"가 원천 차단되는 단계입니다.',
            '기존 버전이 돌아가는 동안 새 버전을 띄우고 트래픽을 옮기는 <b>무중단 롤아웃</b>. EC2에서의 "scp + 재시작"이 자동화된 셈.',
            'HTTPS 인증서까지 자동 발급. 3부에서 배울 TLS를 플랫폼이 그냥 처리해줍니다.'
          ];
          var lights = [[0, 1], [2, 3], [2, 3], [4, 5], [7, 7]]; // pfTagEls 인덱스 점등
          var p = Promise.resolve();
          stageEls.forEach(function (s, i) {
            p = p.then(function () {
              s.className = 'rw-stage run';
              s.querySelector('.st').innerHTML = '<span class="spin"></span>';
              C.setStatus(status, '<b>' + STAGE_DEFS[i][1] + '</b> — ' + msgs[i]);
              return C.sleep(950);
            }).then(function () {
              s.className = 'rw-stage ok';
              s.querySelector('.st').textContent = '✓';
              for (var k = lights[i][0]; k <= lights[i][1]; k++) pfTagEls[k].className = 'rw-tag lit-pf';
            });
          });
          return p;
        })
        .then(function () {
          urlChip.innerHTML = '🌐 https://myapp.up.railway.app · 200 OK ✅<span class="rw-ver">v' + ver + '</span>';
          urlChip.classList.add('show', 'pop');
          pfTagEls.forEach(function (e) { e.className = 'rw-tag lit-pf'; });
          C.setStatus(status,
            '<b>배포 완료!</b> 내가 한 일: <b>git push 1번</b>. 플랫폼이 한 일: <b>8가지</b>. ' +
            'EC2의 일곱 단계가 전부 위임됐습니다 — 대신 서버 내부를 만질 수 있는 <b>제어권</b>을 내놓았죠. ' +
            '코드를 또 수정했다고 치고 <b>git push ▶</b> 를 다시 눌러보세요. v' + (ver + 1) + '로 무중단 교체됩니다.', 'ok');
          btnPush.disabled = false;
          busy = false;
        });
    }

    btnPush.addEventListener('click', push);
    btnReset.addEventListener('click', function () { render(root); });
  }

  global.renderRailwaySim = render;
})(window);
