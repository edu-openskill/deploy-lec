/* sim-pipeline.js — EKS + GitOps 통합 파이프라인 시뮬레이터
   코드 push → GitHub Actions(테스트·빌드) → ECR 저장 → Manifest Repo(GitOps 상태) 갱신
   → Argo CD 감지 → EKS Pod 롤링 교체.
   + 쿠버네티스 self-healing(Pod 죽이기), Argo CD selfHeal(드리프트 복구) 체험. */
(function (global) {
  'use strict';
  var C = global.SimCore;

  var CSS = [
    '.sim-pl .pl-row{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap;margin-bottom:10px}',
    '.sim-pl .pl-node{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px;flex:1;min-width:118px}',
    '.sim-pl .pl-node .h{font-weight:800;font-size:12px;color:var(--ink);margin-bottom:5px}',
    '.sim-pl .pl-node .s{font-size:10.5px;color:var(--muted)}',
    '.sim-pl .pl-node.dev{flex:0 0 108px;text-align:center}',
    '.sim-pl .pl-commit{font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:#f8fafc;border:1px solid var(--line);border-radius:6px;padding:2px 6px;margin-top:3px;color:var(--ink)}',
    '.sim-pl .pl-commit.new{background:var(--accent-soft);border-color:#c7d2fe;color:#3730a3}',
    '.sim-pl .pl-acts{display:flex;flex-direction:column;gap:4px;margin-top:4px}',
    '.sim-pl .pl-act{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:var(--muted);background:#fafafa;border:1px solid var(--line);border-radius:7px;padding:4px 7px;transition:all .25s}',
    '.sim-pl .pl-act .st{width:14px;height:14px;border-radius:50%;background:#f1f5f9;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:8.5px;flex:0 0 14px}',
    '.sim-pl .pl-act.run{border-color:#c7d2fe;background:var(--accent-soft);color:#3730a3}',
    '.sim-pl .pl-act.ok{border-color:#bbf7d0;background:var(--ok-soft);color:#15803d}',
    '.sim-pl .pl-act.ok .st{background:#16a34a;border-color:#16a34a;color:#fff}',
    '.sim-pl .pl-imgs{display:flex;flex-direction:column;gap:4px;margin-top:4px;max-height:74px;overflow:hidden}',
    '.sim-pl .pl-img{font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:#fff7ed;border:1px solid #fed7aa;color:#c2680c;border-radius:6px;padding:2px 7px}',
    '.sim-pl .pl-img.new{outline:2px solid #fdba74}',
    '.sim-pl .pl-yaml{font-family:ui-monospace,monospace;font-size:10px;line-height:1.7;background:#0d1117;color:#e6edf3;border-radius:8px;padding:7px 9px;margin-top:4px;white-space:pre}',
    '.sim-pl .pl-yaml .hl{background:#3b2300;color:#fdba74;border-radius:3px;padding:0 3px}',
    '.sim-pl .pl-argo .badge{display:inline-block;font-size:10px;font-weight:800;border-radius:7px;padding:2px 8px;margin-left:5px;vertical-align:1px}',
    '.sim-pl .badge.sync{background:var(--ok-soft);color:#15803d;border:1px solid #bbf7d0}',
    '.sim-pl .badge.out{background:var(--bad-soft);color:#b91c1c;border:1px solid #fecaca}',
    '.sim-pl .badge.ing{background:var(--accent-soft);color:#3730a3;border:1px solid #c7d2fe}',
    '.sim-pl .pl-cmp{display:flex;flex-direction:column;gap:4px;margin-top:6px}',
    '.sim-pl .pl-cmp .row{display:flex;gap:5px;align-items:center;font-size:10px;font-weight:700}',
    '.sim-pl .pl-cmp .who{flex:0 0 56px;color:var(--muted)}',
    '.sim-pl .pl-cmp .val{font-family:ui-monospace,monospace;background:#f8fafc;border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:var(--ink)}',
    '.sim-pl .pl-cmp.diff .val{background:var(--bad-soft);border-color:#fecaca;color:#b91c1c}',
    '.sim-pl .pl-eks{border:1.5px dashed var(--accent);background:#f5f7ff}',
    '.sim-pl .pl-pods{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;min-height:46px}',
    '.sim-pl .pl-pod{font-size:10px;font-weight:800;border-radius:9px;padding:7px 9px;text-align:center;border:1.5px solid #bbf7d0;background:var(--ok-soft);color:#15803d;transition:all .3s;cursor:pointer}',
    '.sim-pl .pl-pod small{display:block;font-family:ui-monospace,monospace;font-weight:700;font-size:9px;opacity:.8}',
    '.sim-pl .pl-pod.old{border-color:#e5e7eb;background:#f8fafc;color:#9ca3af}',
    '.sim-pl .pl-pod.dying{border-color:#fecaca;background:var(--bad-soft);color:#b91c1c;opacity:.6;transform:scale(.92)}',
    '.sim-pl .pl-pod.boot{border-color:#c7d2fe;background:var(--accent-soft);color:#3730a3}',
    '.sim-pl .pl-hint{font-size:10px;color:var(--muted);margin-top:4px}',
    '.sim-pl .pl-arrowrow{display:flex;justify-content:center;margin:-4px 0 6px;color:var(--muted);font-size:11px;font-weight:700;gap:6px;align-items:center}'
  ].join('\n');

  var PHASES = ['push', '테스트', '빌드', 'ECR 저장', 'Manifest 갱신', 'Argo 감지', 'Sync', '완료'];

  function hash() { return Math.random().toString(16).slice(2, 8); }

  function render(root) {
    C.injectStyle('sim-pl-css', CSS);
    root.innerHTML = '';
    root.classList.add('sim', 'sim-pl');

    /* ── 헤더/컨트롤 ── */
    var head = C.el('div', 'sim-head');
    head.appendChild(C.el('div', 'sim-title', '☸️ EKS + GitOps 파이프라인 — git push가 Pod 교체까지'));
    var ctr = C.el('div', 'sim-controls');
    var btnPush = C.el('button', 'sim-btn', '코드 수정 & git push ▶');
    var btnKill = C.el('button', 'sim-btn danger', 'Pod 죽이기 💥');
    var btnDrift = C.el('button', 'sim-btn warn', 'kubectl로 몰래 변경 🔧');
    var btnReset = C.el('button', 'sim-btn ghost', '↺');
    ctr.appendChild(btnPush); ctr.appendChild(btnKill); ctr.appendChild(btnDrift); ctr.appendChild(btnReset);
    head.appendChild(ctr);
    root.appendChild(head);

    var stepsBar = C.el('div', 'sim-steps');
    var stepEls = PHASES.map(function (t) {
      var s = C.el('div', 'sim-step', t);
      stepsBar.appendChild(s);
      return s;
    });
    root.appendChild(stepsBar);

    var stage = C.el('div', 'sim-stage');

    /* ── 1행: CI ── */
    var row1 = C.el('div', 'pl-row');
    var dev = C.el('div', 'pl-node dev', '<div class="h">💻 개발자</div><div class="s">코드 수정<br>git push</div>');
    var appRepo = C.el('div', 'pl-node', '<div class="h">🐙 App Repo</div><div class="s">소스 + Dockerfile</div>');
    var commitList = C.el('div', null);
    appRepo.appendChild(commitList);
    var actions = C.el('div', 'pl-node', '<div class="h">⚙️ GitHub Actions <span class="s">(CI)</span></div>');
    var actList = C.el('div', 'pl-acts');
    var ACT_DEFS = ['테스트 실행', '이미지 빌드', 'ECR push', 'manifest 태그 수정'];
    var actEls = ACT_DEFS.map(function (t) {
      var a = C.el('div', 'pl-act');
      a.appendChild(C.el('span', 'st', ''));
      a.appendChild(C.el('span', null, t));
      actList.appendChild(a);
      return a;
    });
    actions.appendChild(actList);
    var ecr = C.el('div', 'pl-node', '<div class="h">🗄 ECR</div><div class="s">이미지 창고</div>');
    var imgList = C.el('div', 'pl-imgs');
    ecr.appendChild(imgList);
    row1.appendChild(dev); row1.appendChild(appRepo); row1.appendChild(actions); row1.appendChild(ecr);
    stage.appendChild(row1);

    stage.appendChild(C.el('div', 'pl-arrowrow', '⬇ CI가 끝나면, 배포는 아래 CD 라인이 이어받는다 ⬇'));

    /* ── 2행: CD ── */
    var row2 = C.el('div', 'pl-row');
    var mani = C.el('div', 'pl-node', '<div class="h">📋 Manifest Repo <span class="s">(GitOps 상태 = 정답)</span></div>');
    var yaml = C.el('div', 'pl-yaml', '');
    mani.appendChild(yaml);
    var argo = C.el('div', 'pl-node pl-argo');
    var argoH = C.el('div', 'h', '🔱 Argo CD');
    var badge = C.el('span', 'badge sync', 'Synced ✓');
    argoH.appendChild(badge);
    argo.appendChild(argoH);
    var cmp = C.el('div', 'pl-cmp');
    var cmpGit = C.el('div', 'row');
    cmpGit.appendChild(C.el('span', 'who', 'Git 정답'));
    var cmpGitVal = C.el('span', 'val', '');
    cmpGit.appendChild(cmpGitVal);
    var cmpClu = C.el('div', 'row');
    cmpClu.appendChild(C.el('span', 'who', '클러스터'));
    var cmpCluVal = C.el('span', 'val', '');
    cmpClu.appendChild(cmpCluVal);
    cmp.appendChild(cmpGit); cmp.appendChild(cmpClu);
    argo.appendChild(cmp);
    argo.appendChild(C.el('div', 'pl-hint', '3분마다 Git ↔ 클러스터 비교'));
    var eks = C.el('div', 'pl-node pl-eks', '<div class="h">☸️ EKS 클러스터 <span class="s">· Deployment replicas: 3</span></div>');
    var podsBox = C.el('div', 'pl-pods');
    eks.appendChild(podsBox);
    eks.appendChild(C.el('div', 'pl-hint', 'Pod를 클릭해도 죽일 수 있어요 💥'));
    row2.appendChild(mani); row2.appendChild(argo); row2.appendChild(eks);
    stage.appendChild(row2);
    root.appendChild(stage);

    var status = C.el('div', 'sim-status', '');
    root.appendChild(status);
    var term = C.el('div', 'sim-term');
    C.log(term, '# EKS + GitOps 파이프라인 로그', 'c');
    root.appendChild(term);

    /* ── 상태 ── */
    var S = {
      gitTag: hash(),   // Manifest Repo(=정답)의 이미지 태그
      gitReplicas: 3,
      cluTag: null,     // 클러스터에 떠 있는 태그
      cluReplicas: 3,
      busy: false
    };
    S.cluTag = S.gitTag;

    function refreshYaml(hl) {
      yaml.innerHTML =
        'kind: Deployment\n' +
        'replicas: <span class="' + (hl === 'r' ? 'hl' : '') + '">' + S.gitReplicas + '</span>\n' +
        'image: …/spring-api:<span class="' + (hl === 'i' ? 'hl' : '') + '">' + S.gitTag + '</span>';
    }
    function refreshCmp() {
      cmpGitVal.textContent = S.gitTag + ' · x' + S.gitReplicas;
      var liveCnt = podsBox.querySelectorAll('.pl-pod:not(.dying)').length;
      cmpCluVal.textContent = (S.cluTag || '—') + ' · x' + liveCnt;
      var same = S.cluTag === S.gitTag && liveCnt === S.gitReplicas;
      cmp.className = 'pl-cmp' + (same ? '' : ' diff');
      return same;
    }
    function setBadge(kind, text) {
      badge.className = 'badge ' + kind;
      badge.innerHTML = text;
    }
    function addPod(tag, cls) {
      var p = C.el('div', 'pl-pod ' + (cls || '') + ' pop', 'Pod<small>' + tag + '</small>');
      p.addEventListener('click', function () { killPod(p); });
      podsBox.appendChild(p);
      return p;
    }
    function phase(i) { C.markSteps(stepEls, i); }
    function donePhases() { stepEls.forEach(function (s) { s.className = 'sim-step done'; }); }
    function resetPhases() { stepEls.forEach(function (s) { s.className = 'sim-step'; }); }

    /* 초기 배포 상태 */
    for (var i = 0; i < 3; i++) addPod(S.gitTag);
    imgList.appendChild(C.el('div', 'pl-img', 'spring-api:' + S.gitTag));
    refreshYaml();
    refreshCmp();
    C.setStatus(status,
      '이미 v1(<b>' + S.gitTag + '</b>)이 배포되어 Pod 3개가 돌고 있습니다. ' +
      '<b>코드 수정 & git push ▶</b> 로 전체 파이프라인을 돌려보거나, <b>Pod 죽이기 💥</b> / <b>kubectl로 몰래 변경 🔧</b> 으로 쿠버네티스와 Argo CD의 복구 능력을 시험해보세요.');

    /* ── ① 전체 파이프라인 ── */
    function push() {
      if (S.busy) return;
      S.busy = true;
      btnPush.disabled = btnKill.disabled = btnDrift.disabled = true;
      resetPhases();
      actEls.forEach(function (a) { a.className = 'pl-act'; a.querySelector('.st').innerHTML = ''; });
      var newTag = hash();

      phase(0);
      C.log(term, '$ git push origin main  (App Repo)', 'p');
      C.setStatus(status, '<b>git push.</b> 개발자가 하는 일은 이게 전부입니다. 커밋이 App Repo로 올라갑니다.');
      C.fly(stage, dev, appRepo, { cls: 'file', tag: 'commit ' + newTag, dur: 750 })
        .then(function () {
          var c = C.el('div', 'pl-commit new', newTag);
          commitList.insertBefore(c, commitList.firstChild);
          if (commitList.children.length > 2) commitList.removeChild(commitList.lastChild);
          stepEls[0].className = 'sim-step done';
          phase(1);
          /* 테스트 */
          actEls[0].className = 'pl-act run';
          actEls[0].querySelector('.st').innerHTML = '<span class="spin"></span>';
          C.log(term, 'Actions: ./gradlew test', 'c');
          C.setStatus(status, '<b>GitHub Actions 기동.</b> 먼저 <b>테스트</b>. 깨진 코드는 여기서 걸러져 배포 자체가 중단됩니다 — 이것이 CI의 안전망.');
          return C.sleep(1000);
        })
        .then(function () {
          actEls[0].className = 'pl-act ok';
          actEls[0].querySelector('.st').textContent = '✓';
          C.log(term, '142 tests passed ✓', 'o');
          stepEls[1].className = 'sim-step done';
          phase(2);
          /* 빌드 */
          actEls[1].className = 'pl-act run';
          actEls[1].querySelector('.st').innerHTML = '<span class="spin"></span>';
          C.log(term, 'Actions: docker build -t spring-api:' + newTag, 'c');
          C.setStatus(status, '<b>이미지 빌드.</b> JAR을 Docker 이미지로 포장합니다. 태그는 커밋 해시 <b>' + newTag + '</b> — 어떤 코드가 어떤 이미지인지 1:1 추적됩니다.');
          return C.sleep(1000);
        })
        .then(function () {
          actEls[1].className = 'pl-act ok';
          actEls[1].querySelector('.st').textContent = '✓';
          stepEls[2].className = 'sim-step done';
          phase(3);
          /* ECR push */
          actEls[2].className = 'pl-act run';
          actEls[2].querySelector('.st').innerHTML = '<span class="spin"></span>';
          C.log(term, 'Actions: docker push …/spring-api:' + newTag + '  (ECR)', 'c');
          C.setStatus(status, '<b>ECR 저장.</b> 이미지가 창고에 올라갑니다. EKS는 나중에 <b>여기서</b> 이미지를 pull합니다 — kubectl apply가 아니라 docker push가 이미지를 올린다는 것, 기억하세요(S2의 흔한 오해).');
          return C.fly(stage, actions, ecr, { cls: 'file', tag: ':' + newTag, dur: 800 });
        })
        .then(function () {
          actEls[2].className = 'pl-act ok';
          actEls[2].querySelector('.st').textContent = '✓';
          var im = C.el('div', 'pl-img new', 'spring-api:' + newTag);
          imgList.insertBefore(im, imgList.firstChild);
          if (imgList.children.length > 3) imgList.removeChild(imgList.lastChild);
          stepEls[3].className = 'sim-step done';
          phase(4);
          /* manifest 갱신 */
          actEls[3].className = 'pl-act run';
          actEls[3].querySelector('.st').innerHTML = '<span class="spin"></span>';
          C.log(term, 'Actions: sed -i "s|image: .*|image: …:' + newTag + '|" deployment.yaml && git push (Manifest Repo)', 'c');
          C.setStatus(status, '<b>GitOps 상태 저장.</b> Actions가 Manifest Repo의 deployment.yaml에서 image 태그만 새 해시로 바꿔 커밋합니다. 이 커밋이 곧 <b>"운영 환경의 새 정답"</b>이 됩니다.');
          return C.fly(stage, actions, mani, { cls: 'file', tag: 'yaml 커밋', dur: 850 });
        })
        .then(function () {
          actEls[3].className = 'pl-act ok';
          actEls[3].querySelector('.st').textContent = '✓';
          S.gitTag = newTag;
          refreshYaml('i');
          refreshCmp();
          stepEls[4].className = 'sim-step done';
          phase(5);
          C.setStatus(status, 'CI 끝. 여기서부터 <b>사람도 Actions도 클러스터를 직접 건드리지 않습니다.</b> Argo CD가 Git을 폴링하다가 변경을 발견하면…');
          return C.sleep(1300);
        })
        .then(function () {
          setBadge('out', 'OutOfSync');
          C.log(term, 'ArgoCD: Git(' + S.gitTag + ') ≠ Cluster(' + S.cluTag + ') → OutOfSync', 'e');
          C.setStatus(status, '<b>Argo CD 발동.</b> Git의 정답(' + S.gitTag + ')과 클러스터 실제 상태(' + S.cluTag + ')가 다릅니다 → <b>OutOfSync</b>. 자동 sync가 시작됩니다.', 'bad');
          return C.fly(stage, mani, argo, { cls: 'req', tag: '감지', dur: 800 });
        })
        .then(function () {
          stepEls[5].className = 'sim-step done';
          phase(6);
          setBadge('ing', '<span class="spin"></span> Syncing');
          C.log(term, 'ArgoCD: sync 시작 → 롤링 업데이트', 'c');
          return C.fly(stage, argo, eks, { cls: 'req', tag: 'sync', dur: 800 });
        })
        .then(function () {
          /* 롤링 교체: Pod 하나씩 */
          var olds = Array.prototype.slice.call(podsBox.querySelectorAll('.pl-pod'));
          olds.forEach(function (p) { p.classList.add('old'); });
          var p = Promise.resolve();
          olds.forEach(function (oldPod, idx) {
            p = p.then(function () {
              var np = addPod(S.gitTag, 'boot');
              np.innerHTML = 'Pod<small><span class="spin"></span> 기동</small>';
              C.setStatus(status, '<b>롤링 업데이트 ' + (idx + 1) + '/3.</b> 새 Pod(' + S.gitTag + ')가 ECR에서 이미지를 받아 뜨고, 준비되면 옛 Pod가 내려갑니다 — 무중단.');
              return C.sleep(850).then(function () {
                np.className = 'pl-pod pop';
                np.innerHTML = 'Pod<small>' + S.gitTag + '</small>';
                np.addEventListener('click', function () { killPod(np); });
                oldPod.classList.add('dying');
                return C.sleep(450);
              }).then(function () {
                oldPod.remove();
                refreshCmp();
              });
            });
          });
          return p;
        })
        .then(function () {
          S.cluTag = S.gitTag;
          refreshYaml();
          refreshCmp();
          setBadge('sync', 'Synced ✓');
          stepEls[6].className = 'sim-step done';
          donePhases();
          C.log(term, 'ArgoCD: Synced ✓ — Git = Cluster', 'o');
          C.setStatus(status,
            '<b>배포 완료.</b> 사람이 한 일은 <b>git push 한 번</b>. 테스트 → 빌드 → ECR → manifest 커밋 → Argo CD sync → Pod 교체가 전부 자동으로 이어졌습니다. ' +
            '롤백이 필요하면? Manifest Repo에서 <b>git revert</b> 하면 같은 파이프라인이 거꾸로 한 번 더 돌 뿐입니다.', 'ok');
          S.busy = false;
          btnPush.disabled = btnKill.disabled = btnDrift.disabled = false;
        });
    }

    /* ── ② Pod 죽이기: 쿠버네티스 self-healing ── */
    function killPod(target) {
      if (S.busy) return;
      var pods = podsBox.querySelectorAll('.pl-pod:not(.dying)');
      if (!pods.length) return;
      var victim = target && target.parentNode === podsBox ? target : pods[Math.floor(Math.random() * pods.length)];
      S.busy = true;
      btnPush.disabled = btnKill.disabled = btnDrift.disabled = true;
      victim.classList.add('dying');
      victim.innerHTML = 'Pod<small>💀 죽음</small>';
      C.log(term, '$ kubectl delete pod ' + S.cluTag + '-' + hash().slice(0, 4), 'p');
      refreshCmp();
      C.setStatus(status, '<b>Pod 하나가 죽었습니다!</b> 클러스터: 2개 ≠ Deployment 선언: 3개. 누가 살릴까요? (Argo CD는 가만히 있습니다 — 지켜보세요)', 'bad');
      C.sleep(1400).then(function () {
        victim.remove();
        C.log(term, 'ReplicaSet: 3 선언 vs 2 실행 → 미달 감지, 새 Pod 생성', 'c');
        var np = addPod(S.cluTag, 'boot');
        np.innerHTML = 'Pod<small><span class="spin"></span> 기동</small>';
        return C.sleep(900).then(function () {
          np.className = 'pl-pod pop';
          np.innerHTML = 'Pod<small>' + S.cluTag + '</small>';
          np.addEventListener('click', function () { killPod(np); });
        });
      }).then(function () {
        refreshCmp();
        C.log(term, 'self-healing 완료 — 사람 개입 0', 'o');
        C.setStatus(status,
          '<b>쿠버네티스 자체의 self-healing.</b> Deployment의 "replicas: 3" 선언을 ReplicaSet이 지켰습니다. ' +
          'Argo CD는 관여하지 않았습니다 — Pod 개수 유지는 <b>쿠버네티스 본연의 일</b>이고, Argo CD는 "Git과 클러스터 선언의 차이"를 지킵니다. 그 차이는 🔧 버튼으로 확인해보세요.', 'ok');
        S.busy = false;
        btnPush.disabled = btnKill.disabled = btnDrift.disabled = false;
      });
    }

    /* ── ③ 드리프트: Argo CD selfHeal ── */
    function drift() {
      if (S.busy) return;
      S.busy = true;
      btnPush.disabled = btnKill.disabled = btnDrift.disabled = true;
      C.log(term, '$ kubectl scale deployment spring-api --replicas=2   # 누군가 새벽에 몰래…', 'p');
      var pods = podsBox.querySelectorAll('.pl-pod:not(.dying)');
      var victim = pods[pods.length - 1];
      victim.classList.add('dying');
      victim.innerHTML = 'Pod<small>수동 축소</small>';
      C.setStatus(status, '<b>누군가 kubectl로 클러스터를 직접 바꿨습니다</b> (replicas 3→2). 이번엔 Deployment 선언 자체가 2로 바뀌어서 쿠버네티스는 복구하지 않습니다. 하지만 Git의 정답은 여전히 3…', 'bad');
      C.sleep(1200).then(function () {
        victim.remove();
        refreshCmp();
        return C.sleep(1300);
      }).then(function () {
        setBadge('out', 'OutOfSync');
        C.log(term, 'ArgoCD: Git(replicas 3) ≠ Cluster(replicas 2) → OutOfSync', 'e');
        C.setStatus(status, '<b>Argo CD가 드리프트를 감지!</b> Git 정답(3개)과 클러스터(2개)가 어긋났습니다. <code>selfHeal: true</code> 이므로 자동으로 Git 쪽에 맞춥니다.', 'bad');
        return C.fly(stage, mani, argo, { cls: 'req', tag: '비교', dur: 750 });
      }).then(function () {
        setBadge('ing', '<span class="spin"></span> Syncing');
        return C.fly(stage, argo, eks, { cls: 'req', tag: '원상복구', dur: 750 });
      }).then(function () {
        C.log(term, 'ArgoCD: deployment replicas 2 → 3 되돌림', 'c');
        var np = addPod(S.cluTag, 'boot');
        np.innerHTML = 'Pod<small><span class="spin"></span> 기동</small>';
        return C.sleep(900).then(function () {
          np.className = 'pl-pod pop';
          np.innerHTML = 'Pod<small>' + S.cluTag + '</small>';
          np.addEventListener('click', function () { killPod(np); });
        });
      }).then(function () {
        refreshCmp();
        setBadge('sync', 'Synced ✓');
        C.log(term, 'ArgoCD: Synced ✓ — Git이 정답', 'o');
        C.setStatus(status,
          '<b>selfHeal — GitOps의 정수.</b> 손으로 바꾼 변경은 Git에 없으므로 <b>없던 일</b>이 됩니다. 운영 환경을 바꾸는 유일한 길은 Git 커밋뿐 — ' +
          '그래서 모든 변경이 기록되고, 롤백은 revert 한 번이고, "누가 언제 뭘 바꿨지?"가 사라집니다.', 'ok');
        S.busy = false;
        btnPush.disabled = btnKill.disabled = btnDrift.disabled = false;
      });
    }

    btnPush.addEventListener('click', push);
    btnKill.addEventListener('click', function () { killPod(null); });
    btnDrift.addEventListener('click', drift);
    btnReset.addEventListener('click', function () { render(root); });
  }

  global.renderPipelineSim = render;
})(window);
