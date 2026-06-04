// renderMap(container, currentId): 노드 체인을 그리고 currentId 노드를 하이라이트.
(function () {
  function renderMap(container, currentId) {
    const nodes = window.MAP_NODES || [];
    container.classList.add('mapchain');
    container.innerHTML = nodes.map((n, idx) => {
      const cur = n.id === currentId ? ' cur' : '';
      const arrow = idx < nodes.length - 1 ? '<span class="maparrow">▶</span>' : '';
      return `<div class="mapnode${cur}" data-id="${n.id}">
                <div class="mapicon">${n.icon}</div>
                <div class="maplabel">${n.label}</div>
              </div>${arrow}`;
    }).join('');
  }
  window.renderMap = renderMap;
})();
