(function () {
  const DESIRED = 3; // Deployment 가 유지하려는 Pod 개수

  // 순수 로직: 현재 살아있는 Pod 수가 desired 미만이면 부족분만큼 새 Pod 추가
  // pods: [{id, state}] (state: 'live' | 'dying'), desired: number
  // 반환: 부활 후 살아있는 Pod 배열 (dying/사망은 제거, 부족분은 새 'live' 추가)
  function k8sReconcile(pods, desired) {
    const want = desired == null ? DESIRED : desired;
    const alive = pods.filter(p => p.state === 'live');
    const result = alive.slice();
    let nextId = pods.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    while (result.length < want) {
      result.push({ id: nextId++, state: 'new' });
    }
    return result;
  }
  window.k8sReconcile = k8sReconcile;
  window.K8S_DESIRED = DESIRED;

  function renderK8sArch(container) {
    container.classList.add('k8s-arch');
    container.innerHTML = `
      <div class="k8s-cp">☸️ Control Plane — 관제탑 <span class="k8s-cp-s">(어느 Node에 Pod를 몇 개 띄울지 결정·감시)</span></div>
      <div class="k8s-cluster">
        <div class="k8s-node"><div class="k8s-node-h">🖥️ Node #1 <span>(EC2 워커)</span></div><div class="k8s-pods" data-node="0"></div></div>
        <div class="k8s-node"><div class="k8s-node-h">🖥️ Node #2 <span>(EC2 워커)</span></div><div class="k8s-pods" data-node="1"></div></div>
      </div>
      <div class="k8s-notes">
        <span class="k8s-note"><b>Deployment</b>: "Pod ${DESIRED}개 유지" (원하는 상태)</span>
        <span class="k8s-note"><b>Service</b>: 고정 주소 + 로드밸런서 → 어느 Pod로든 연결</span>
      </div>
      <div class="k8s-caption sim-caption"></div>
      <div class="ec2-ctrl">
        <button class="sim-go k8s-kill">Pod 하나 죽이기 💥</button>
        <button class="ladder-tab k8s-reset">리셋</button>
      </div>`;

    const podBoxes = [container.querySelector('[data-node="0"]'), container.querySelector('[data-node="1"]')];
    const caption = container.querySelector('.k8s-caption');
    const killBtn = container.querySelector('.k8s-kill');
    const resetBtn = container.querySelector('.k8s-reset');
    let pods = [];
    let timer = null;

    function fresh() {
      pods = [];
      for (let i = 0; i < DESIRED; i++) pods.push({ id: i + 1, state: 'live' });
    }

    function paint() {
      // Pod 들을 두 Node 에 번갈아 배치
      podBoxes.forEach(b => b.innerHTML = '');
      pods.forEach((p, idx) => {
        const cls = p.state === 'dying' ? ' dying' : (p.state === 'new' ? ' new' : '');
        const box = podBoxes[idx % 2];
        box.insertAdjacentHTML('beforeend', `<span class="k8s-pod${cls}">📦 Pod</span>`);
      });
    }

    function setCaption(html) { caption.innerHTML = html; }

    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      fresh();
      paint();
      killBtn.disabled = false;
      setCaption(`Pod ${DESIRED}개가 안정적으로 떠 있습니다. <b>Pod 하나 죽이기</b>를 눌러보세요.`);
    }

    killBtn.addEventListener('click', () => {
      const liveIdx = pods.findIndex(p => p.state === 'live');
      if (liveIdx < 0) return;
      pods[liveIdx].state = 'dying';
      paint();
      killBtn.disabled = true;
      setCaption('💥 Pod 하나가 죽었습니다 — 살아있는 Pod ' + pods.filter(p => p.state === 'live').length + '개. Deployment가 곧 알아챕니다…');
      timer = setTimeout(() => {
        pods = k8sReconcile(pods, DESIRED); // dying 제거 + 부족분 새 Pod
        paint();
        killBtn.disabled = false;
        setCaption(`🤖 Deployment가 ${DESIRED}개 미달을 감지 → 자동으로 새 Pod 생성(self-healing). <b>손 안 댔습니다.</b>`);
      }, 900);
    });
    resetBtn.addEventListener('click', reset);
    reset();
  }
  window.renderK8sArch = renderK8sArch;
})();
