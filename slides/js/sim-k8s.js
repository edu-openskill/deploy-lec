(function () {
  const DESIRED = 3;

  // 순수 로직: 살아있는 Pod 수가 desired 미만이면 부족분만큼 새 Pod 보충, 초과면 잘라냄.
  // pods: [{id, state, ...}] (state: 'live'|'dying'|'new'), desired: number
  function k8sReconcile(pods, desired) {
    const want = desired == null ? DESIRED : desired;
    const alive = pods.filter(p => p.state === 'live' || p.state === 'new').map(p => ({ ...p, state: 'live' }));
    let nextId = pods.reduce((m, p) => Math.max(m, typeof p.id === 'number' ? p.id : 0), 0) + 1;
    while (alive.length < want) alive.push({ id: nextId++, state: 'new', ver: 1 });
    return alive.slice(0, want);
  }
  window.k8sReconcile = k8sReconcile;
  window.K8S_DESIRED = DESIRED;

  function renderK8sArch(container) {
    container.classList.add('k8s-arch');
    container.innerHTML = `
      <div class="k8s-top">
        <div class="k8s-svc">🌐 Service <span>api.myapp.com · 로드밸런서</span></div>
        <div class="k8s-status"></div>
      </div>
      <div class="k8s-cp">☸️ Control Plane — 관제탑 <span class="k8s-cp-s">선언한 '원하는 상태'를 끊임없이 실제와 비교·복구</span></div>
      <div class="k8s-cluster">
        <div class="k8s-node" data-node="0"><div class="k8s-node-h">🖥️ Node #1 <span>(EC2 워커)</span></div><div class="k8s-pods"></div></div>
        <div class="k8s-node" data-node="1"><div class="k8s-node-h">🖥️ Node #2 <span>(EC2 워커)</span></div><div class="k8s-pods"></div></div>
      </div>
      <div class="k8s-caption sim-caption"></div>
      <div class="k8s-ctrl">
        <button class="sim-go k8s-btn k8s-req">요청 보내기 🌐</button>
        <button class="sim-go k8s-btn k8s-kill">Pod 죽이기 💥</button>
        <button class="sim-go k8s-btn k8s-up">스케일 ▲</button>
        <button class="sim-go k8s-btn k8s-down">스케일 ▼</button>
        <button class="sim-go k8s-btn k8s-roll">롤링 업데이트 🚀</button>
        <button class="sim-go k8s-btn k8s-node">Node 다운 🔥</button>
        <button class="ladder-tab k8s-reset">리셋</button>
      </div>`;

    const nodeEls = [container.querySelector('[data-node="0"] .k8s-pods'), container.querySelector('[data-node="1"] .k8s-pods')];
    const nodeBoxes = [container.querySelector('[data-node="0"]'), container.querySelector('[data-node="1"]')];
    const statusEl = container.querySelector('.k8s-status');
    const caption = container.querySelector('.k8s-caption');
    const btns = container.querySelectorAll('.k8s-btn');
    let pods = [], desired = DESIRED, version = 1, nodesUp = [true, true], busy = false, seq = 1, timer = null;

    function fresh() {
      pods = []; desired = DESIRED; version = 1; nodesUp = [true, true]; seq = 1;
      for (let i = 0; i < DESIRED; i++) pods.push({ id: seq++, state: 'live', ver: 1, node: i % 2 });
    }
    function lock (ms, fn) { busy = true; btns.forEach(b => b.disabled = true); timer = setTimeout(() => { fn(); busy = false; btns.forEach(b => b.disabled = false); paint(); }, ms); }
    function placeNode() { // 다운된 노드의 Pod는 살아있는 노드로 재배치
      const up = nodesUp.map((u, i) => i).filter(i => nodesUp[i]);
      pods.forEach((p, idx) => { if (!nodesUp[p.node]) p.node = up[idx % up.length]; });
    }

    function paint() {
      placeNode();
      nodeEls.forEach(e => e.innerHTML = '');
      nodeBoxes.forEach((b, i) => b.classList.toggle('down', !nodesUp[i]));
      pods.forEach(p => {
        const cls = [p.state === 'dying' ? 'dying' : (p.state === 'new' ? 'new' : 'live'), p.ver === 2 ? 'v2' : ''].join(' ');
        const hit = p.hit ? ' hit' : '';
        nodeEls[p.node].insertAdjacentHTML('beforeend',
          `<span class="k8s-pod ${cls}${hit}">📦 v${p.ver}</span>`);
      });
      const live = pods.filter(p => p.state === 'live').length;
      const match = live === desired;
      statusEl.innerHTML = `원하는 <b>${desired}</b> · 현재 <b class="${match ? 'ok' : 'bad'}">${live}</b> · 이미지 <b>v${version}</b>`;
    }
    function cap(html) { caption.innerHTML = html; }

    // 요청: 살아있는 Pod 중 하나로 라우팅
    container.querySelector('.k8s-req').addEventListener('click', () => {
      if (busy) return;
      const live = pods.filter(p => p.state === 'live');
      if (!live.length) { cap('❌ 살아있는 Pod가 없습니다.'); return; }
      const target = live[Math.floor(seq) % live.length]; seq++;
      pods.forEach(p => p.hit = false); target.hit = true; paint();
      cap(`🌐 Service가 요청을 살아있는 Pod 중 하나(v${target.ver})로 분배 — <b>로드밸런싱</b>.`);
      setTimeout(() => { pods.forEach(p => p.hit = false); paint(); }, 700);
    });

    // Pod 죽이기 → self-heal
    container.querySelector('.k8s-kill').addEventListener('click', () => {
      if (busy) return;
      const p = pods.find(x => x.state === 'live'); if (!p) return;
      p.state = 'dying'; paint();
      cap('💥 Pod 하나가 죽었습니다 — Control Plane이 곧 감지합니다…');
      lock(1000, () => { pods = k8sReconcile(pods, desired); cap(`🤖 <b>self-heal</b>: 죽은 Pod를 자동으로 되살려 항상 ${desired}개 유지. 손 안 댔습니다.`); });
    });

    // 스케일
    container.querySelector('.k8s-up').addEventListener('click', () => {
      if (busy || desired >= 6) return; desired += 2;
      pods = k8sReconcile(pods.map(p => ({ ...p, ver: p.ver })), desired); paint();
      cap(`📈 Deployment의 replicas를 <b>${desired}</b>로 올림 → 새 Pod 자동 생성. 트래픽 몰릴 때 명령 한 줄.`);
    });
    container.querySelector('.k8s-down').addEventListener('click', () => {
      if (busy || desired <= 1) return; desired -= 1;
      pods = pods.filter(p => p.state === 'live').slice(0, desired); paint();
      cap(`📉 replicas를 <b>${desired}</b>로 내림 → 남는 Pod 자동 종료.`);
    });

    // 롤링 업데이트 v1 → v2 (한 개씩 교체, 무중단)
    container.querySelector('.k8s-roll').addEventListener('click', () => {
      if (busy) return;
      const old = pods.filter(p => p.ver < 2 && p.state === 'live');
      if (!old.length) { cap('이미 모든 Pod가 v2입니다. (리셋으로 처음부터)'); return; }
      version = 2;
      let i = 0;
      cap('🚀 롤링 업데이트 시작 — v1 Pod를 v2로 한 개씩 교체(나머지는 계속 응답 → 무중단).');
      btns.forEach(b => b.disabled = true); busy = true;
      const tick = () => {
        if (i >= old.length) { busy = false; btns.forEach(b => b.disabled = false); cap('✅ 무중단 롤링 업데이트 완료 — 전부 v2. 문제 생기면 되돌리기(rollback)도 한 줄.'); paint(); return; }
        const target = pods.find(p => p === old[i]); if (target) { target.ver = 2; target.state = 'new'; }
        paint(); i++;
        setTimeout(() => { if (target) target.state = 'live'; timer = setTimeout(tick, 450); }, 350);
      };
      tick();
    });

    // Node 다운 → Pod 재배치(rescheduling)
    container.querySelector('.k8s-node').addEventListener('click', () => {
      if (busy) return;
      if (!nodesUp[1]) { cap('Node #2는 이미 다운 상태입니다. (리셋으로 복구)'); return; }
      nodesUp[1] = false;
      pods.filter(p => p.node === 1).forEach(p => p.state = 'dying'); paint();
      cap('🔥 Node #2 다운! 그 위의 Pod도 함께 사라집니다 — 스케줄러가 감지 중…');
      lock(1100, () => { pods = k8sReconcile(pods, desired); pods.forEach(p => p.node = 0); cap('🤖 스케줄러가 살아있는 Node #1로 Pod를 <b>재배치(reschedule)</b> → 서비스 계속 유지.'); });
    });

    container.querySelector('.k8s-reset').addEventListener('click', () => { if (timer) clearTimeout(timer); busy = false; btns.forEach(b => b.disabled = false); fresh(); paint(); cap(`Pod ${DESIRED}개가 안정적으로 떠 있습니다. 버튼으로 죽이기·스케일·롤링업데이트·Node 다운을 시험해 보세요.`); });

    fresh(); paint();
    cap(`Pod ${DESIRED}개가 안정적으로 떠 있습니다. 버튼으로 죽이기·스케일·롤링업데이트·Node 다운을 시험해 보세요.`);
  }
  window.renderK8sArch = renderK8sArch;
})();
