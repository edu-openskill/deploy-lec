/* sim-ec2.js — EC2 수동 배포 시뮬레이터
   빈 우분투 인스턴스가 외부에서 접속 가능한 상시 서버가 되기까지,
   사람이 직접 하는 일곱 단계 + systemd 재부팅 테스트. */
(function (global) {
  'use strict';
  var C = global.SimCore;

  var CSS = [
    '.sim-ec2 .ec2-wrap{display:flex;gap:16px;align-items:stretch;flex-wrap:wrap}',
    '.sim-ec2 .ec2-left{display:flex;flex-direction:column;gap:12px;flex:0 0 152px;justify-content:center}',
    '.sim-ec2 .ec2-node{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px;text-align:center}',
    '.sim-ec2 .ec2-node .h{font-weight:800;font-size:12.5px;color:var(--ink)}',
    '.sim-ec2 .ec2-node .s{font-size:11px;color:var(--muted);margin-top:3px;min-height:16px}',
    '.sim-ec2 .jar-chip{display:none;margin:7px auto 0;width:fit-content;background:#fff7ed;border:1.5px solid #fed7aa;color:#c2680c;font-weight:800;font-size:11px;border-radius:7px;padding:3px 9px}',
    '.sim-ec2 .jar-chip.show{display:block}',
    '.sim-ec2 .ec2-right{flex:1;min-width:250px;display:flex;flex-direction:column}',
    '.sim-ec2 .ec2-sg{flex:1;border:2px dashed #f59e0b;border-radius:16px;padding:10px 12px 12px;background:#fffbeb;opacity:.35;transition:opacity .4s}',
    '.sim-ec2 .ec2-sg.live{opacity:1}',
    '.sim-ec2 .sg-h{font-size:11px;font-weight:800;color:#c2680c;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}',
    '.sim-ec2 .gates{display:flex;gap:6px}',
    '.sim-ec2 .gate{font-size:10.5px;font-weight:800;border-radius:7px;padding:3px 8px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;transition:all .3s}',
    '.sim-ec2 .gate.open{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}',
    '.sim-ec2 .ec2-box{margin-top:9px;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:12px;min-height:148px;display:none}',
    '.sim-ec2 .ec2-box.show{display:block}',
    '.sim-ec2 .ec2-box .bh{font-weight:800;font-size:12.5px;color:var(--ink);margin-bottom:9px}',
    '.sim-ec2 .ec2-box .bh small{font-weight:700;color:var(--muted);font-size:10.5px}',
    '.sim-ec2 .ec2-empty{margin-top:9px;border:1.5px dashed var(--line);border-radius:12px;min-height:148px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12.5px;font-weight:700}',
    '.sim-ec2 .slots{display:grid;grid-template-columns:1fr 1fr;gap:7px}',
    '.sim-ec2 .slot{border:1px dashed var(--line);border-radius:9px;padding:7px 9px;font-size:11px;color:var(--muted);background:#fafafa;transition:all .3s}',
    '.sim-ec2 .slot b{display:block;font-size:10px;letter-spacing:.05em;margin-bottom:1px}',
    '.sim-ec2 .slot.full{border-style:solid;border-color:#bbf7d0;background:var(--ok-soft);color:#15803d;font-weight:800}',
    '.sim-ec2 .slot.run{animation:sim-pulse 1.6s infinite}',
    '.sim-ec2 .slot.dead{border-style:solid;border-color:#fecaca;background:var(--bad-soft);color:#b91c1c;font-weight:800}'
  ].join('\n');

  var STEPS = ['① 생성', '② SSH', '③ JDK', '④ 빌드', '⑤ 전송', '⑥ 실행', '⑦ 포트', '⑧ systemd'];

  function render(root) {
    C.injectStyle('sim-ec2-css', CSS);
    root.innerHTML = '';
    root.classList.add('sim', 'sim-ec2');

    /* ── 헤더 ── */
    var head = C.el('div', 'sim-head');
    head.appendChild(C.el('div', 'sim-title', '🔧 EC2 수동 배포 — 빈 우분투에서 상시 서버까지'));
    var ctr = C.el('div', 'sim-controls');
    var btnNext = C.el('button', 'sim-btn', '다음 단계 ▶');
    var btnBoot = C.el('button', 'sim-btn warn', '서버 재부팅 테스트 🔄');
    var btnReset = C.el('button', 'sim-btn ghost', '↺ 처음부터');
    btnBoot.style.display = 'none';
    ctr.appendChild(btnNext); ctr.appendChild(btnBoot); ctr.appendChild(btnReset);
    head.appendChild(ctr);
    root.appendChild(head);

    /* ── 진행 단계 ── */
    var stepsBar = C.el('div', 'sim-steps');
    var stepEls = STEPS.map(function (t) {
      var s = C.el('div', 'sim-step', t);
      stepsBar.appendChild(s);
      return s;
    });
    root.appendChild(stepsBar);

    /* ── 무대 ── */
    var stage = C.el('div', 'sim-stage');
    var wrap = C.el('div', 'ec2-wrap');

    var left = C.el('div', 'ec2-left');
    var laptop = C.el('div', 'ec2-node',
      '<div class="h">💻 내 노트북</div><div class="s">소스 코드 (.java)</div>');
    var jarChip = C.el('div', 'jar-chip', '📦 app.jar');
    laptop.appendChild(jarChip);
    var phone = C.el('div', 'ec2-node',
      '<div class="h">📱 사용자 브라우저</div>');
    var phoneStat = C.el('div', 's', '대기 중…');
    phone.appendChild(phoneStat);
    left.appendChild(laptop); left.appendChild(phone);

    var right = C.el('div', 'ec2-right');
    var sg = C.el('div', 'ec2-sg');
    var sgh = C.el('div', 'sg-h');
    sgh.appendChild(C.el('span', null, '🛡 보안그룹 (AWS 방화벽)'));
    var gates = C.el('div', 'gates');
    var gate22 = C.el('span', 'gate', '22 SSH 🔒');
    var gate8080 = C.el('span', 'gate', '8080 🔒');
    gates.appendChild(gate22); gates.appendChild(gate8080);
    sgh.appendChild(gates);
    sg.appendChild(sgh);

    var empty = C.el('div', 'ec2-empty', '아직 서버 없음 — ▶ 를 눌러 시작');
    var box = C.el('div', 'ec2-box');
    box.appendChild(C.el('div', 'bh', '🖥 EC2 · Ubuntu 22.04 <small>(43.202.58.11)</small>'));
    var slots = C.el('div', 'slots');
    function slot(label, init) {
      var s = C.el('div', 'slot', '<b>' + label + '</b>' + init);
      slots.appendChild(s);
      return s;
    }
    var slotJdk = slot('JDK', '없음');
    var slotJar = slot('app.jar', '없음');
    var slotProc = slot('프로세스', '없음');
    var slotSysd = slot('systemd', '미등록');
    box.appendChild(slots);
    sg.appendChild(empty);
    sg.appendChild(box);
    right.appendChild(sg);

    wrap.appendChild(left); wrap.appendChild(right);
    stage.appendChild(wrap);
    root.appendChild(stage);

    /* ── 상태/터미널 ── */
    var status = C.el('div', 'sim-status', '빈 우분투 서버 한 대를 직접 배포 가능한 상태로 만들어 봅니다. <b>다음 단계 ▶</b> 를 눌러 진행하세요. 일곱 단계 전부 사람 손으로 한다는 점에 주목!');
    root.appendChild(status);
    var term = C.el('div', 'sim-term');
    C.log(term, '# EC2 수동 배포 — 명령 로그', 'c');
    root.appendChild(term);

    /* ── 상태 머신 ── */
    var step = 0, busy = false;

    function setSlot(s, label, text, cls) {
      s.className = 'slot' + (cls ? ' ' + cls : '');
      s.innerHTML = '<b>' + label + '</b>' + text;
      s.classList.add('pop');
      setTimeout(function () { s.classList.remove('pop'); }, 400);
    }

    var actions = [
      /* ① 인스턴스 생성 */
      function () {
        return Promise.resolve().then(function () {
          C.log(term, 'AWS 콘솔 → EC2 → 인스턴스 시작 (Ubuntu 22.04 · t2.micro)', 'c');
          sg.classList.add('live');
          empty.style.display = 'none';
          box.classList.add('show');
          box.classList.add('pop');
          C.setStatus(status, '<b>① 인스턴스 생성.</b> 빈 우분투가 떴습니다. 안에는 정말 아무것도 없습니다 — java도, 코드도, 프로세스도. 보안그룹은 기본적으로 거의 모든 포트가 <b>닫힘</b> 상태입니다.');
        });
      },
      /* ② SSH 접속 */
      function () {
        C.log(term, '$ ssh -i my-key.pem ubuntu@43.202.58.11', 'p');
        gate22.className = 'gate open';
        gate22.textContent = '22 SSH ✓';
        return C.fly(stage, laptop, box, { cls: 'req', tag: 'SSH' }).then(function () {
          C.log(term, 'ubuntu@ip-172-31-12-5:~$  (접속 성공)', 'o');
          C.setStatus(status, '<b>② SSH 접속.</b> .pem 키로 서버 터미널에 들어왔습니다. 이제부터의 모든 명령은 <b>원격 서버 안에서</b> 실행됩니다. (보안그룹에서 22 포트가 열려 있어야 가능)');
        });
      },
      /* ③ JDK 설치 */
      function () {
        C.log(term, '$ sudo apt update && sudo apt install -y openjdk-21-jdk', 'p');
        setSlot(slotJdk, 'JDK', '<span class="spin"></span> 설치 중…');
        return C.sleep(1100).then(function () {
          setSlot(slotJdk, 'JDK', 'OpenJDK 21 ✓', 'full');
          C.log(term, '$ java -version  →  openjdk 21.0.2', 'o');
          C.setStatus(status, '<b>③ JDK 설치.</b> 빈 서버에는 java 명령이 없습니다(0부 전제 4). 런타임을 직접 깔아야 JAR을 실행할 수 있습니다. 빌드한 JDK 버전과 일치하는지도 확인!');
        });
      },
      /* ④ 로컬 빌드 */
      function () {
        C.log(term, '(로컬) $ ./gradlew build', 'p');
        return C.sleep(800).then(function () {
          jarChip.classList.add('show', 'pop');
          C.log(term, 'BUILD SUCCESSFUL — build/libs/app.jar 생성', 'o');
          C.setStatus(status, '<b>④ 빌드.</b> 내 노트북에서 소스 코드를 실행 가능한 산출물 <b>app.jar</b> 하나로 묶었습니다. 서버에 올라가는 것은 소스 코드가 아니라 이 파일입니다.');
        });
      },
      /* ⑤ scp 전송 */
      function () {
        C.log(term, '(로컬) $ scp -i my-key.pem build/libs/app.jar ubuntu@43.202.58.11:~/', 'p');
        return C.fly(stage, jarChip, slotJar, { cls: 'file', tag: 'app.jar', dur: 1100 }).then(function () {
          setSlot(slotJar, 'app.jar', '전송 완료 ✓', 'full');
          C.log(term, 'app.jar  100%  38MB  4.2MB/s', 'o');
          C.setStatus(status, '<b>⑤ 전송.</b> JAR 파일이 인터넷을 건너 서버 디스크에 저장되었습니다. 아직 실행된 것은 아닙니다 — 파일이 놓여 있을 뿐.');
        });
      },
      /* ⑥ 실행 + 차단 시연 */
      function () {
        C.log(term, '$ java -jar app.jar', 'p');
        setSlot(slotProc, '프로세스', '<span class="spin"></span> 기동 중…');
        return C.sleep(900).then(function () {
          setSlot(slotProc, '프로세스', ':8080 실행 중', 'full run');
          C.log(term, 'Tomcat started on port(s): 8080 (http)', 'o');
          C.setStatus(status, '<b>⑥ 실행.</b> Spring Boot가 8080 포트에서 요청을 기다립니다. 그럼 사용자가 접속해볼까요…?');
          return C.sleep(900);
        }).then(function () {
          phoneStat.textContent = '접속 시도 중…';
          return C.fly(stage, phone, gate8080, { cls: 'bad', tag: 'GET /' });
        }).then(function () {
          gate8080.classList.add('shake');
          setTimeout(function () { gate8080.classList.remove('shake'); }, 700);
          phoneStat.textContent = '❌ 응답 없음 (timeout)';
          C.log(term, 'curl: (28) Connection timed out — 보안그룹이 8080을 차단', 'e');
          C.setStatus(status, '<b>차단!</b> 앱은 분명 실행 중인데 접속이 안 됩니다. 요청이 <b>보안그룹의 닫힌 8080 포트</b>에서 막혔기 때문입니다. "배포는 했는데 접속이 안 돼요"의 절반이 바로 이 상황입니다.', 'bad');
        });
      },
      /* ⑦ 보안그룹 열기 */
      function () {
        C.log(term, 'AWS 콘솔 → 보안그룹 → 인바운드 규칙: 8080 TCP 허용', 'c');
        gate8080.className = 'gate open';
        gate8080.textContent = '8080 ✓';
        phoneStat.textContent = '재시도 중…';
        return C.sleep(500).then(function () {
          return C.fly(stage, phone, slotProc, { cls: 'req', tag: 'GET /' });
        }).then(function () {
          return C.fly(stage, slotProc, phone, { cls: 'ok', tag: '200 OK' });
        }).then(function () {
          phoneStat.textContent = '✅ 200 OK!';
          C.log(term, 'HTTP/1.1 200 OK — {"feed": [...]}', 'o');
          C.setStatus(status, '<b>⑦ 포트 개방.</b> 보안그룹에 8080 인바운드 규칙을 추가하자 요청이 통과해 응답이 돌아왔습니다. 드디어 외부에서 접속되는 서버!', 'ok');
        });
      },
      /* ⑧ systemd */
      function () {
        C.log(term, '$ sudo vi /etc/systemd/system/myapp.service', 'p');
        C.log(term, '$ sudo systemctl enable --now myapp', 'p');
        return C.sleep(800).then(function () {
          setSlot(slotSysd, 'systemd', '등록 ✓ (자동 재시작)', 'full');
          btnBoot.style.display = '';
          btnNext.disabled = true;
          C.setStatus(status, '<b>⑧ systemd 등록 — 완료!</b> 지금까지 <b>전부 사람 손으로</b> 했습니다: 인스턴스 생성 · SSH · JDK 설치 · 빌드 · 전송 · 실행 · 포트 개방 · systemd. 그런데 systemd가 정말 필요할까요? <b>서버 재부팅 테스트 🔄</b> 를 눌러 확인해보세요.', 'ok');
        });
      }
    ];

    function next() {
      if (busy || step >= actions.length) return;
      busy = true;
      btnNext.disabled = true;
      C.markSteps(stepEls, step);
      actions[step]().then(function () {
        stepEls[step].className = 'sim-step done';
        step++;
        if (step < actions.length) C.markSteps(stepEls, step - 0.5 >= 0 ? step : 0);
        busy = false;
        btnNext.disabled = step >= actions.length;
      });
    }

    function rebootTest() {
      if (busy) return;
      busy = true;
      btnBoot.disabled = true;
      C.log(term, '$ sudo reboot', 'p');
      setSlot(slotProc, '프로세스', '💀 종료됨', 'dead');
      phoneStat.textContent = '❌ 연결 끊김';
      C.setStatus(status, '<b>재부팅!</b> 프로세스가 죽었습니다. systemd가 없었다면 새벽에 SSH로 들어가 다시 실행해야 했겠죠…', 'bad');
      C.sleep(1600).then(function () {
        slotSysd.classList.add('pop');
        C.log(term, 'systemd: myapp.service 자동 시작', 'c');
        setSlot(slotProc, '프로세스', '<span class="spin"></span> 자동 재시작…');
        return C.sleep(1000);
      }).then(function () {
        setSlot(slotProc, '프로세스', ':8080 실행 중', 'full run');
        return C.fly(stage, phone, slotProc, { cls: 'req' });
      }).then(function () {
        return C.fly(stage, slotProc, phone, { cls: 'ok', tag: '200 OK' });
      }).then(function () {
        phoneStat.textContent = '✅ 200 OK!';
        C.log(term, 'Tomcat started on port(s): 8080 — 사람 개입 없이 복구', 'o');
        C.setStatus(status, '<b>systemd 덕분에 자동 복구.</b> 부팅과 동시에 앱이 다시 떴습니다. 이것이 "항상 켜진 서버"(0부 전제 1)를 진짜로 만드는 마지막 조각입니다. — 그래도 이 모든 설정을 서버마다 반복해야 한다면…? 다음 단계 <b>Railway</b>로 넘어가 보세요.', 'ok');
        btnBoot.disabled = false;
        busy = false;
      });
    }

    btnNext.addEventListener('click', next);
    btnBoot.addEventListener('click', rebootTest);
    btnReset.addEventListener('click', function () { render(root); });
  }

  global.renderEc2Sim = render;
})(window);
