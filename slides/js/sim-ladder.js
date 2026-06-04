(function () {
  const TASKS = ['SSH 접속','JDK 설치','JAR 전송','포트 열기','systemd 등록','재시작 관리','스케일링','롤백'];
  const STAGES = ['aws','railway','eks','gitops'];
  const STAGE_LABEL = { aws:'AWS EC2', railway:'Railway', eks:'EKS', gitops:'GitOps' };
  // 누적: 단계가 올라갈수록 더 많은 작업이 platform 으로 이동
  const PLATFORM_BY_STAGE = {
    aws:     [],
    railway: ['SSH 접속','JDK 설치','JAR 전송','포트 열기','systemd 등록','재시작 관리'],
    eks:     ['SSH 접속','JDK 설치','JAR 전송','포트 열기','systemd 등록','재시작 관리','스케일링'],
    gitops:  TASKS.slice()
  };

  // 순수 로직
  function ladderState(stage) {
    const platform = PLATFORM_BY_STAGE[stage] || [];
    const me = TASKS.filter(t => !platform.includes(t));
    return { me, platform };
  }
  window.ladderState = ladderState;
  window.LADDER_STAGES = STAGES;

  // DOM
  function renderLadder(container) {
    container.classList.add('sim-ladder');
    container.innerHTML = `
      <div class="ladder-tabs">${STAGES.map((s,i) =>
        `<button class="ladder-tab${i===0?' on':''}" data-stage="${s}">${STAGE_LABEL[s]}</button>`).join('')}</div>
      <div class="ladder-col"><div class="ladder-head">🙋 내가 하는 일</div><div class="ladder-me chips"></div></div>
      <div class="ladder-col"><div class="ladder-head">🤖 플랫폼이 하는 일</div><div class="ladder-pf chips"></div></div>
      <div class="ladder-callback"></div>`;
    const meBox = container.querySelector('.ladder-me');
    const pfBox = container.querySelector('.ladder-pf');
    function paint(stage) {
      const { me, platform } = ladderState(stage);
      meBox.innerHTML = me.map(t => `<span class="chip me">${t}</span>`).join('') || '<span class="empty">(없음)</span>';
      pfBox.innerHTML = platform.map(t => `<span class="chip pf">${t}</span>`).join('') || '<span class="empty">(없음 — 모든 작업을 내가 합니다)</span>';
      const cb = container.querySelector('.ladder-callback');
      if (cb) cb.innerHTML = stage === 'gitops' ? '💡 Railway 기억나죠? 그게 아기 GitOps였어요.' : '';
    }
    container.querySelectorAll('.ladder-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.ladder-tab').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        paint(btn.dataset.stage);
      });
    });
    paint('aws');
  }
  window.renderLadder = renderLadder;
})();
