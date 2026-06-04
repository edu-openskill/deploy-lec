(function () {
  // 서버 상태판 항목 (왼→오 명령으로 하나씩 ✅ 가 됨)
  const ITEMS = ['OS', 'Java', 'JAR', '실행', '외부포트', '자동재시작'];

  // 7단계: 빈 우분투 → 외부에서 접속 가능한 상시 실행 서버
  // each: cmd(터미널에 찍히는 줄), done(이 단계 후 ✅ 된 항목 목록 — 누적), caption, analogy
  const STEPS = [
    {
      cmd: '# AWS 콘솔: Ubuntu AMI · t2.micro · 키페어(my-key.pem) 다운로드\n# → 공인 IP 13.124.53.12 부여',
      title: '1. EC2 인스턴스 생성',
      done: ['OS'],
      caption: 'AWS 데이터센터에서 빈 컴퓨터 한 대를 빌립니다. 우분투만 깔린 백지 상태.',
      analogy: '🏠 빈 원룸 임대 — 전기·수도(전원·공인 IP)는 들어오지만 가구는 0개.'
    },
    {
      cmd: '$ ssh -i my-key.pem ubuntu@13.124.53.12\nWelcome to Ubuntu 22.04 LTS',
      title: '2. SSH 접속',
      done: ['OS'],
      caption: '키페어(.pem)로 그 빈 서버에 원격 로그인합니다. 이제 명령을 칠 수 있어요.',
      analogy: '🔑 빌린 방에 처음 들어가 불을 켜는 순간.'
    },
    {
      cmd: '$ sudo apt update && sudo apt install -y openjdk-17-jdk\n$ java -version  → openjdk 17',
      title: '3. 런타임(JDK) 설치',
      done: ['OS', 'Java'],
      caption: '빈 우분투엔 java가 없습니다. JAR을 돌릴 JVM을 직접 깝니다.',
      analogy: '🛠️ 빈 방엔 가전이 없다 — 냉장고(java)를 직접 들여놓기.'
    },
    {
      cmd: '$ scp -i my-key.pem app.jar ubuntu@13.124.53.12:~/\napp.jar   100%   48MB',
      title: '4. JAR 전송 (내 PC → 서버)',
      done: ['OS', 'Java', 'JAR'],
      caption: '로컬에서 빌드한 app.jar 파일을 서버로 복사합니다.',
      analogy: '📦 내 PC의 이삿짐(jar)을 새 집으로 옮기기.'
    },
    {
      cmd: '$ java -jar app.jar\nStarted Application on port 8080 ✓\n(…아직 외부에선 못 들어옴, SSH 끊으면 죽음)',
      title: '5. 실행',
      done: ['OS', 'Java', 'JAR', '실행'],
      caption: '서버가 8080 포트에 떴습니다. 하지만 방화벽이 막혀 외부에선 아직 못 들어와요.',
      analogy: '💡 불은 켰지만 정문이 잠겨 손님이 못 들어오는 가게.'
    },
    {
      cmd: '# AWS 보안그룹 인바운드 규칙 추가: TCP 8080 (0.0.0.0/0) 허용',
      title: '6. 보안그룹 포트 열기',
      done: ['OS', 'Java', 'JAR', '실행', '외부포트'],
      caption: '방화벽(보안그룹)에서 8080 포트를 열어야 비로소 외부 접속이 됩니다.',
      analogy: '🛡️ 건물 정문 경비에게 "8080 문은 열어둬" 라고 지시.'
    },
    {
      cmd: '$ sudo nano /etc/systemd/system/myapp.service   # ExecStart=java -jar ...\n$ sudo systemctl enable --now myapp',
      title: '7. systemd 등록',
      done: ['OS', 'Java', 'JAR', '실행', '외부포트', '자동재시작'],
      caption: 'SSH를 끊거나 서버가 재부팅돼도 앱이 자동으로 다시 뜨도록 서비스 등록.',
      analogy: '🔄 정전·재부팅에도 다시 켜지는 자동 셔터.'
    }
  ];

  // 순수 로직: step(0~6)에서 ✅ 된 항목 + 메타 반환. step<0 이면 시작 전(전부 ❌).
  function ec2State(step) {
    const s = STEPS[step];
    const done = s ? s.done.slice() : [];
    const checklist = ITEMS.map(name => ({ name, done: done.includes(name) }));
    return {
      step,
      total: STEPS.length,
      cmd: s ? s.cmd : '',
      title: s ? s.title : '',
      caption: s ? s.caption : '',
      analogy: s ? s.analogy : '',
      checklist
    };
  }
  window.ec2State = ec2State;
  window.EC2_STEPS = STEPS;

  // DOM
  function renderEc2Build(container) {
    container.classList.add('ec2-sim');
    container.innerHTML = `
      <div class="ec2-grid">
        <div class="ec2-term"><div class="ec2-term-bar">ubuntu@ec2 — terminal</div><pre class="ec2-term-body"></pre></div>
        <div class="ec2-state ladder-col">
          <div class="ladder-head">🖥️ 서버 상태</div>
          <div class="ec2-rows"></div>
        </div>
      </div>
      <div class="ec2-caption sim-caption"></div>
      <div class="ec2-ctrl">
        <button class="sim-go ec2-next">다음 단계 ▶</button>
        <button class="ladder-tab ec2-reset">처음으로</button>
        <span class="ec2-progress"></span>
      </div>`;

    const termBody = container.querySelector('.ec2-term-body');
    const rowsBox = container.querySelector('.ec2-rows');
    const caption = container.querySelector('.ec2-caption');
    const nextBtn = container.querySelector('.ec2-next');
    const resetBtn = container.querySelector('.ec2-reset');
    const progress = container.querySelector('.ec2-progress');

    let step = -1; // -1 = 시작 전

    function paintState(st) {
      rowsBox.innerHTML = st.checklist.map(c =>
        `<div class="ec2-row${c.done ? ' done' : ''}"><span>${c.name}</span><span class="ec2-mark">${c.done ? '✅' : '❌'}</span></div>`
      ).join('');
    }

    function paint() {
      const st = ec2State(step);
      paintState(step < 0 ? ec2State(-1) : st);
      // 터미널: 0..step 까지 명령 누적
      if (step < 0) {
        termBody.textContent = '$ _  (빈 우분투. "다음 단계"를 눌러 시작)';
        caption.innerHTML = '<b>빈 서버 한 대.</b> 똑같은 app.jar 하나를 손으로 올려봅니다 — 몇 단계나 걸릴까요?';
      } else {
        termBody.textContent = STEPS.slice(0, step + 1).map(s => s.cmd).join('\n\n');
        caption.innerHTML = `<b>${st.title}</b><br>${st.caption}<br><span class="ec2-analogy">${st.analogy}</span>`;
      }
      // 터미널 스크롤 맨 아래로
      termBody.scrollTop = termBody.scrollHeight;
      const atEnd = step >= STEPS.length - 1;
      progress.textContent = step < 0 ? `0 / ${STEPS.length}` : `${step + 1} / ${STEPS.length}`;
      nextBtn.disabled = atEnd;
      if (atEnd) {
        caption.innerHTML += '<br><b class="ec2-done-note">✅ 7단계 · 약 22분. jar 하나 올리는 데 이만큼. → 다음: git push 한 번이면 끝(Railway).</b>';
        nextBtn.textContent = '완료';
      } else {
        nextBtn.textContent = '다음 단계 ▶';
      }
    }

    nextBtn.addEventListener('click', () => { if (step < STEPS.length - 1) { step++; paint(); } });
    resetBtn.addEventListener('click', () => { step = -1; paint(); });
    paint();
  }
  window.renderEc2Build = renderEc2Build;
})();
