(function () {
  // 순수 로직: 보안그룹이 열렸는지에 따라 패킷이 도달하는 노드 경로 반환
  const JourneyModel = {
    path(sgOpen) {
      const ids = (window.MAP_NODES || []).map(n => n.id);
      const sgIdx = ids.indexOf('sg');
      if (!sgOpen && sgIdx >= 0) {
        return { reached: ids.slice(0, sgIdx + 1), blocked: true };
      }
      return { reached: ids.slice(), blocked: false };
    }
  };
  window.JourneyModel = JourneyModel;

  // DOM: 마운트 컨테이너에 입력·버튼·노드체인·캡션을 그리고 애니메이션 재생
  function mountJourney(container) {
    const nodes = window.MAP_NODES || [];
    container.classList.add('sim-journey');
    container.innerHTML = `
      <div class="sim-controls">
        <input class="sim-input" value="api.myapp.com">
        <button class="sim-go">▶ 요청 보내기</button>
        <label class="sim-toggle"><input type="checkbox" class="sim-sg" checked> 보안그룹 443 열림</label>
      </div>
      <div class="sim-chain"></div>
      <div class="sim-caption">도메인을 입력하고 ▶ 를 눌러보세요.</div>`;
    const chain = container.querySelector('.sim-chain');
    const caption = container.querySelector('.sim-caption');
    chain.innerHTML = nodes.map((n, idx) =>
      `<div class="mapnode" data-id="${n.id}"><div class="mapicon">${n.icon}</div>
        <div class="maplabel">${n.label}</div></div>` +
      (idx < nodes.length - 1 ? '<span class="maparrow">▶</span>' : '')).join('');

    let timer = null;
    function play() {
      if (timer) { clearInterval(timer); timer = null; }
      chain.querySelectorAll('.mapnode').forEach(el => el.classList.remove('cur','blocked','ret'));
      const sgOpen = container.querySelector('.sim-sg').checked;
      const { reached, blocked } = JourneyModel.path(sgOpen);
      let k = 0;
      timer = setInterval(() => {
        if (k >= reached.length) {
          clearInterval(timer); timer = null;
          if (k > 0) chain.querySelector(`.mapnode[data-id="${reached[k-1]}"]`)?.classList.remove('cur');
          const last = reached[reached.length - 1];
          if (blocked) {
            chain.querySelector(`.mapnode[data-id="${last}"]`)?.classList.add('blocked');
            caption.innerHTML = '🛑 <b>보안그룹</b>에서 차단! 443 포트가 닫혀 패킷이 서버에 닿지 못합니다.';
          } else {
            playReturn(reached);
          }
          return;
        }
        if (k > 0) chain.querySelector(`.mapnode[data-id="${reached[k-1]}"]`)?.classList.remove('cur');
        const node = nodes.find(n => n.id === reached[k]);
        chain.querySelector(`.mapnode[data-id="${reached[k]}"]`)?.classList.add('cur');
        caption.innerHTML = `💬 <b>${node.label}</b>: ${node.caption}`;
        k++;
      }, 900);
    }
    function playReturn(reached) {
      const rev = reached.slice().reverse();
      let k = 0;
      caption.innerHTML = '↩️ 응답이 같은 길을 거꾸로 돌아갑니다…';
      timer = setInterval(() => {
        if (k > 0) chain.querySelector(`.mapnode[data-id="${rev[k-1]}"]`)?.classList.remove('ret');
        if (k >= rev.length) {
          clearInterval(timer); timer = null;
          caption.innerHTML = '✅ 응답이 앱에 도착했습니다. 이것이 요청 한 번의 여정입니다.';
          return;
        }
        chain.querySelector(`.mapnode[data-id="${rev[k]}"]`)?.classList.add('ret');
        k++;
      }, 500);
    }
    container.querySelector('.sim-go').addEventListener('click', play);
  }
  window.mountJourney = mountJourney;
})();
