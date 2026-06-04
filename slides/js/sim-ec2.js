(function () {
  // 서버 상태판 항목 (명령을 진행하며 하나씩 ❌→✅)
  const ITEMS = ['OS(우분투)', 'Java(JDK)', 'JAR 파일', '프로세스 실행', '방화벽 포트', '자동 재시작'];

  // 7단계: 빈 우분투 → 외부에서 접속 가능한 상시 실행 서버
  // cmd = 입력 명령, out = 실제로 찍히는 출력(여러 줄), done = 이 단계까지 ✅ 누적, min = 누적 소요(분)
  const STEPS = [
    {
      title: '1. EC2 인스턴스 생성',
      cmd: '# AWS 콘솔 → EC2 → 인스턴스 시작',
      out: 'AMI      : Ubuntu Server 22.04 LTS (ami-0abc123)\nType     : t2.micro  (vCPU 1 · RAM 1GB · 프리티어)\nKey pair : my-key.pem  ↓ 다운로드\nPublic IP: 13.124.53.12\n[ ✔ ] instance i-0a1b2c  state = running',
      done: ['OS(우분투)'],
      min: 3,
      caption: 'AWS 데이터센터에서 빈 가상 서버 한 대를 빌립니다. 우분투만 깔린 백지 상태.',
      analogy: '🏠 빈 원룸 임대 — 전기·수도(전원·공인 IP)는 들어오지만 가구는 0개.'
    },
    {
      title: '2. SSH 원격 접속',
      cmd: 'ssh -i my-key.pem ubuntu@13.124.53.12',
      out: "The authenticity of host '13.124.53.12' can't be established.\nAre you sure you want to continue connecting? yes\nWelcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15)\nubuntu@ip-172-31-9-12:~$",
      done: ['OS(우분투)'],
      min: 5,
      caption: '키페어(.pem)로 그 빈 서버에 원격 로그인. 이제부터 내 키보드가 서버에 연결됩니다.',
      analogy: '🔑 빌린 방에 처음 들어가 불을 켜는 순간.'
    },
    {
      title: '3. 런타임(JDK) 설치',
      cmd: 'sudo apt update && sudo apt install -y openjdk-17-jdk',
      out: 'Get:1 http://ap-northeast-2.ec2.archive.ubuntu.com jammy InRelease\nUnpacking openjdk-17-jdk (17.0.9) ...\nSetting up openjdk-17-jdk ...\n$ java -version\nopenjdk version "17.0.9" 2023-10-17',
      done: ['OS(우분투)', 'Java(JDK)'],
      min: 10,
      caption: '빈 우분투엔 java가 없습니다. JAR을 돌릴 JVM을 직접 설치 (로컬 IDE가 해주던 일).',
      analogy: '🛠️ 빈 방엔 가전이 없다 — 냉장고(java)를 직접 들여놓기.'
    },
    {
      title: '4. JAR 전송 (내 PC → 서버)',
      cmd: 'scp -i my-key.pem build/libs/app.jar ubuntu@13.124.53.12:~/',
      out: 'app.jar                       100%   48MB   4.9MB/s   00:09',
      done: ['OS(우분투)', 'Java(JDK)', 'JAR 파일'],
      min: 12,
      caption: '로컬에서 ./gradlew build로 만든 app.jar 한 개를 서버로 복사합니다.',
      analogy: '📦 내 PC의 이삿짐(jar)을 새 집으로 옮기기.'
    },
    {
      title: '5. 실행',
      cmd: 'java -jar app.jar',
      out: '  .   ____          _\n :: Spring Boot ::                (v3.2.0)\nTomcat started on port(s): 8080 (http)\nStarted Application in 4.213 seconds\n# …터미널이 점유됨. Ctrl+C/SSH 끊기면 프로세스 죽음!',
      done: ['OS(우분투)', 'Java(JDK)', 'JAR 파일', '프로세스 실행'],
      min: 13,
      caption: '서버가 8080 포트에 떴습니다. 하지만 방화벽이 막혀 외부에선 아직 못 들어와요.',
      analogy: '💡 불은 켰지만 정문이 잠겨 손님이 못 들어오는 가게.'
    },
    {
      title: '6. 보안그룹 포트 열기',
      cmd: '# AWS 보안그룹 인바운드 규칙 추가',
      out: 'Type: Custom TCP · Port: 8080 · Source: 0.0.0.0/0  (전체 허용)\nSecurity group sg-0a1b2c  →  updated\n이제 http://13.124.53.12:8080 외부 접속 가능!',
      done: ['OS(우분투)', 'Java(JDK)', 'JAR 파일', '프로세스 실행', '방화벽 포트'],
      min: 16,
      caption: '방화벽(보안그룹)에서 8080 포트를 열어야 비로소 외부 접속이 됩니다. 자주 빠뜨리는 단계!',
      analogy: '🛡️ 건물 정문 경비에게 "8080 문은 열어둬" 라고 지시.'
    },
    {
      title: '7. systemd 서비스 등록',
      cmd: 'sudo systemctl enable --now myapp',
      out: '/etc/systemd/system/myapp.service\n  [Service]\n  ExecStart=/usr/bin/java -jar /home/ubuntu/app.jar\n  Restart=always\nCreated symlink … → myapp.service\n● myapp.service   active (running)  ✔ 부팅 시 자동 시작',
      done: ['OS(우분투)', 'Java(JDK)', 'JAR 파일', '프로세스 실행', '방화벽 포트', '자동 재시작'],
      min: 22,
      caption: 'SSH를 끊거나 서버가 재부팅돼도 앱이 자동으로 다시 뜨도록 서비스로 등록.',
      analogy: '🔄 정전·재부팅에도 알아서 다시 켜지는 자동 셔터.'
    }
  ];

  // 순수 로직: step(0~6) → ✅ 누적 + 메타. step<0 = 시작 전. 외부접속은 (실행 && 포트) 일 때만 가능.
  function ec2State(step) {
    const s = STEPS[step];
    const done = s ? s.done.slice() : [];
    const checklist = ITEMS.map(name => ({ name, done: done.includes(name) }));
    const running = done.includes('프로세스 실행');
    const portOpen = done.includes('방화벽 포트');
    let external = 'down';                 // 서버 미실행
    if (running && !portOpen) external = 'blocked'; // 방화벽이 막음
    else if (running && portOpen) external = 'ok';  // 200 OK
    return {
      step, total: STEPS.length,
      title: s ? s.title : '', cmd: s ? s.cmd : '', out: s ? s.out : '',
      caption: s ? s.caption : '', analogy: s ? s.analogy : '',
      minutes: s ? s.min : 0,
      checklist, external
    };
  }
  window.ec2State = ec2State;
  window.EC2_STEPS = STEPS;

  function renderEc2Build(container) {
    container.classList.add('ec2-sim');
    container.innerHTML = `
      <div class="ec2-grid">
        <div class="ec2-term">
          <div class="ec2-term-bar">ubuntu@ec2 : ~ — bash<span class="ec2-clock">⏱ 0분</span></div>
          <pre class="ec2-term-body"></pre>
        </div>
        <div class="ec2-side">
          <div class="ec2-state ladder-col">
            <div class="ladder-head">🖥️ 서버 상태</div>
            <div class="ec2-rows"></div>
          </div>
          <div class="ec2-ext"><span class="ec2-ext-h">🌐 외부 브라우저</span><span class="ec2-ext-v"></span></div>
        </div>
      </div>
      <div class="ec2-caption sim-caption"></div>
      <div class="ec2-ctrl">
        <button class="sim-go ec2-next">다음 단계 ▶</button>
        <button class="ladder-tab ec2-reset">처음으로</button>
        <span class="ec2-progress"></span>
      </div>`;

    const termBody = container.querySelector('.ec2-term-body');
    const clock = container.querySelector('.ec2-clock');
    const rowsBox = container.querySelector('.ec2-rows');
    const ext = container.querySelector('.ec2-ext-v');
    const extBox = container.querySelector('.ec2-ext');
    const caption = container.querySelector('.ec2-caption');
    const nextBtn = container.querySelector('.ec2-next');
    const resetBtn = container.querySelector('.ec2-reset');
    const progress = container.querySelector('.ec2-progress');
    let step = -1;

    const EXT = {
      down:    { cls: '', txt: '⚪ 서버 미실행' },
      blocked: { cls: 'bad', txt: '🔴 Connection refused — 방화벽이 막음' },
      ok:      { cls: 'ok', txt: '🟢 200 OK · {"status":"UP"}' }
    };

    function paint() {
      const st = ec2State(step < 0 ? -1 : step);
      rowsBox.innerHTML = st.checklist.map(c =>
        `<div class="ec2-row${c.done ? ' done' : ''}"><span>${c.name}</span><span class="ec2-mark">${c.done ? '✅' : '❌'}</span></div>`).join('');
      const e = EXT[st.external];
      ext.textContent = e.txt; extBox.className = 'ec2-ext ' + e.cls;
      clock.textContent = '⏱ ' + st.minutes + '분';

      if (step < 0) {
        termBody.textContent = 'ubuntu@ip-172-31-9-12:~$ _\n\n(빈 우분투 한 대. "다음 단계 ▶"를 눌러 손으로 배포해 봅니다)';
        caption.innerHTML = '<b>빈 서버 한 대.</b> 똑같은 app.jar 하나를 손으로 올려봅니다 — 몇 단계, 몇 분이나 걸릴까요?';
      } else {
        termBody.textContent = STEPS.slice(0, step + 1)
          .map(s => `$ ${s.cmd}\n${s.out}`).join('\n\n');
        caption.innerHTML = `<b>${st.title}</b> &nbsp;<span class="ec2-min">(+${st.minutes}분)</span><br>${st.caption}<br><span class="ec2-analogy">${st.analogy}</span>`;
      }
      termBody.scrollTop = termBody.scrollHeight;

      const atEnd = step >= STEPS.length - 1;
      progress.textContent = `${step < 0 ? 0 : step + 1} / ${STEPS.length}`;
      nextBtn.disabled = atEnd;
      nextBtn.textContent = atEnd ? '완료 ✓' : '다음 단계 ▶';
      if (atEnd) caption.innerHTML += '<br><b class="ec2-done-note">✅ 7단계 · 약 22분. jar 하나 올리는 데 이만큼. 배포할 때마다 매번? → 다음: git push 한 번이면 끝(Railway).</b>';
    }

    nextBtn.addEventListener('click', () => { if (step < STEPS.length - 1) { step++; paint(); } });
    resetBtn.addEventListener('click', () => { step = -1; paint(); });
    paint();
  }
  window.renderEc2Build = renderEc2Build;
})();
