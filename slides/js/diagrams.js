(function(){
  function renderGitopsLoop(c){
    c.classList.add('diagram','dg-loop');
    c.innerHTML = `
      <div class="drow">
        <div class="dbox dbox-git"><div class="dbox-t">📦 Git 저장소</div><div class="dbox-s">원하는 상태 (desired)</div></div>
        <div class="darrow">→<span class="darrow-l">읽기</span></div>
        <div class="dbox dbox-argo"><div class="dbox-t">🔄 ArgoCD</div><div class="dbox-s">컨트롤러</div></div>
        <div class="darrow">→<span class="darrow-l">맞춰 적용</span></div>
        <div class="dbox dbox-k8s"><div class="dbox-t">☸️ 클러스터</div><div class="dbox-s">실제 상태 (actual)</div></div>
      </div>
      <div class="dloop-label">↺ 실제 상태를 끊임없이 비교(reconcile) — 다르면 자동으로 맞춥니다</div>`;
  }
  function renderFlutterPipeline(c){
    c.classList.add('diagram','dg-pipe');
    const steps = [
      {t:'📝 소스', s:'Flutter 코드'},
      {t:'🔨 빌드', s:'AAB / IPA · 코드 서명'},
      {t:'🧪 내부 테스트', s:'Firebase · TestFlight'},
      {t:'🔒 비공개', s:'한정 사용자'},
      {t:'🚀 프로덕션', s:'Play · App Store'}
    ];
    c.innerHTML = '<div class="drow dwrap">'+steps.map((x,i)=>
      `<div class="dbox"><div class="dbox-t">${x.t}</div><div class="dbox-s">${x.s}</div></div>`+
      (i<steps.length-1?'<div class="darrow">▶</div>':'')).join('')+'</div>';
  }
  function renderEnvSplit(c){
    c.classList.add('diagram','dg-env');
    c.innerHTML = `
      <div class="denv-row">
        <div class="dbox dbox-app"><div class="dbox-t">📱 앱 (dev 빌드)</div></div>
        <div class="darrow">→<span class="darrow-l">baseURL: api-dev.myapp.com</span></div>
        <div class="dbox dbox-dev"><div class="dbox-t">🖥️ dev 백엔드</div><div class="dbox-s">dev DB</div></div>
      </div>
      <div class="denv-row">
        <div class="dbox dbox-app"><div class="dbox-t">📱 앱 (prod 빌드)</div></div>
        <div class="darrow">→<span class="darrow-l">baseURL: api.myapp.com</span></div>
        <div class="dbox dbox-prod"><div class="dbox-t">🖥️ prod 백엔드</div><div class="dbox-s">prod DB</div></div>
      </div>
      <div class="denv-note">같은 코드, baseURL만 바꿔 끼우면 다른 환경에 붙습니다</div>`;
  }
  function renderRailwayFlow(c){
    c.classList.add('diagram','dg-pipe');
    const steps = [
      {t:'⌨️ git push', s:'내가 하는 건 이것뿐'},
      {t:'📂 GitHub', s:'코드 도착'},
      {t:'🚂 Railway 감지', s:'새 커밋 발견'},
      {t:'🔨 빌드', s:'컨테이너로 패키징'},
      {t:'▶️ 실행', s:'자동 배포·기동'},
      {t:'🌐 도메인+HTTPS', s:'자동 발급'},
      {t:'✅ 라이브', s:'외부 접속 OK'}
    ];
    c.innerHTML = '<div class="drow dwrap">'+steps.map((x,i)=>
      `<div class="dbox${i===0?' dbox-app':''}"><div class="dbox-t">${x.t}</div><div class="dbox-s">${x.s}</div></div>`+
      (i<steps.length-1?'<div class="darrow">▶</div>':'')).join('')+'</div>'+
      '<div class="denv-note">AWS에서 손으로 한 7단계(JDK 설치·전송·실행·포트·systemd)가 전부 이 자동 파이프라인 안에 숨었습니다.</div>';
  }
  window.renderGitopsLoop = renderGitopsLoop;
  window.renderFlutterPipeline = renderFlutterPipeline;
  window.renderEnvSplit = renderEnvSplit;
  window.renderRailwayFlow = renderRailwayFlow;
})();
