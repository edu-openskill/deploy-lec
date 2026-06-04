(function () {
  // 순수 로직: Git(원하는 상태) 와 클러스터(실제 상태) 비교 → 같으면 Synced, 다르면 클러스터를 Git에 맞춤
  // gitDesired: number(원하는 Pod 수), clusterActual: number(실제 Pod 수)
  // 반환: { status, cluster } — status는 비교 시점 기준, cluster는 reconcile 후 값
  function argoReconcile(gitDesired, clusterActual) {
    const status = gitDesired === clusterActual ? 'Synced' : 'OutOfSync';
    return { status, cluster: gitDesired }; // ArgoCD는 항상 Git(진실)에 맞춤
  }
  window.argoReconcile = argoReconcile;

  function renderArgoSync(container) {
    container.classList.add('argo-sim');
    let git = 3;       // Git 에 적힌 원하는 상태
    let cluster = 3;   // 클러스터 실제 상태
    let timer = null;

    container.innerHTML = `
      <div class="argo-row">
        <div class="dbox dbox-git argo-panel">
          <div class="dbox-t">📦 Git 저장소</div>
          <div class="dbox-s">원하는 상태 (진실)</div>
          <div class="argo-manifest">replicas: <b class="argo-git-n">3</b></div>
        </div>
        <div class="argo-mid">
          <div class="dbox dbox-argo argo-ctrl-box">
            <div class="dbox-t">🔄 ArgoCD</div>
            <div class="argo-badge"></div>
          </div>
        </div>
        <div class="dbox dbox-k8s argo-panel">
          <div class="dbox-t">☸️ 클러스터</div>
          <div class="dbox-s">실제 상태</div>
          <div class="argo-pods"></div>
        </div>
      </div>
      <div class="argo-caption sim-caption"></div>
      <div class="ec2-ctrl">
        <button class="sim-go argo-edit">Git 수정: replicas 3→5</button>
        <button class="sim-go argo-drift">클러스터 손상: Pod 삭제</button>
        <button class="ladder-tab argo-reset">리셋</button>
      </div>`;

    const gitN = container.querySelector('.argo-git-n');
    const podsBox = container.querySelector('.argo-pods');
    const badge = container.querySelector('.argo-badge');
    const caption = container.querySelector('.argo-caption');
    const editBtn = container.querySelector('.argo-edit');
    const driftBtn = container.querySelector('.argo-drift');
    const resetBtn = container.querySelector('.argo-reset');

    function paint() {
      gitN.textContent = git;
      podsBox.innerHTML = Array.from({ length: cluster }, () => '<span class="k8s-pod">📦</span>').join('');
      const synced = git === cluster;
      badge.textContent = synced ? 'Synced ✅' : 'OutOfSync ⚠️';
      badge.className = 'argo-badge ' + (synced ? 'synced' : 'drift');
    }

    function setButtons(disabled) {
      editBtn.disabled = disabled;
      driftBtn.disabled = disabled;
    }

    function reconcileAfter(delayMsg, doneMsg) {
      paint();
      caption.innerHTML = delayMsg;
      setButtons(true);
      timer = setTimeout(() => {
        const r = argoReconcile(git, cluster);
        cluster = r.cluster; // ArgoCD가 클러스터를 Git에 맞춤
        paint();
        caption.innerHTML = doneMsg;
        setButtons(false);
      }, 950);
    }

    editBtn.addEventListener('click', () => {
      if (timer) clearTimeout(timer);
      git = git === 3 ? 5 : 3; // 토글
      reconcileAfter(
        `📝 Git의 원하는 상태를 <b>${git}</b>로 바꿨습니다 → 클러스터와 달라짐(OutOfSync). ArgoCD가 감지 중…`,
        `🤖 ArgoCD가 클러스터를 <b>${git}개</b>로 맞춤(reconcile). 다시 Synced. <b>kubectl 한 번 안 쳤습니다.</b>`
      );
    });

    driftBtn.addEventListener('click', () => {
      if (timer) clearTimeout(timer);
      if (cluster > 0) cluster -= 1; // 누가 손으로 Pod 삭제 (drift)
      reconcileAfter(
        `💥 누군가 클러스터에서 Pod를 손으로 삭제 → 실제(${cluster}) ≠ Git(${git}), OutOfSync. ArgoCD가 감지 중…`,
        `🤖 손으로 바꿔도 <b>Git이 진실</b>. ArgoCD가 원래 ${git}개로 되돌림(self-heal).`
      );
    });

    resetBtn.addEventListener('click', () => {
      if (timer) clearTimeout(timer);
      git = 3; cluster = 3; setButtons(false); paint();
      caption.innerHTML = 'Git과 클러스터가 일치(Synced). 버튼으로 상태를 흔들어 보세요 — ArgoCD가 늘 Git에 맞춥니다.';
    });

    git = 3; cluster = 3; paint();
    caption.innerHTML = 'Git과 클러스터가 일치(Synced). 버튼으로 상태를 흔들어 보세요 — ArgoCD가 늘 Git에 맞춥니다.';
  }
  window.renderArgoSync = renderArgoSync;
})();
