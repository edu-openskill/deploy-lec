# 배포 교육 자료 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spring Boot + Flutter 팀을 위한 반나절 개념 중심 배포 교육 자료(강의 원고 md + 바닐라 슬라이드 덱 + 시뮬레이터 2종)를 제작한다.

**Architecture:** `deploy-lecture.md`가 콘텐츠의 단일 진실의 원천. `slides/`에 순수 바닐라 HTML/CSS/JS 슬라이드 덱을 손으로 디자인한다. 마스터 지도와 두 시뮬레이터는 독립 JS 모듈이며, 각 시뮬레이터는 **순수 로직 함수**(테스트 대상)와 **DOM 렌더링**을 분리한다. 지도 노드 정의는 `map-data.js` 한 곳에서만 관리하고 마스터 지도·여정 시뮬레이터가 공유한다.

**Tech Stack:** 순수 HTML/CSS/JS (의존성 0), Pretendard 폰트 로컬 벤더링, `slides/test.html`을 통한 무프레임워크 브라우저 어서션.

---

## File Structure

```
deploy-study/
├─ deploy-lecture.md          # 강의 원고 (콘텐츠 SSOT, 스피커노트 겸용)
├─ .gitignore                 # .superpowers/ 제외
└─ slides/
   ├─ index.html              # 덱 진입점 — 6부 모든 슬라이드 <section>
   ├─ test.html               # 시뮬레이터 순수 로직 어서션 (의존성 0)
   ├─ css/
   │  └─ deck.css             # 키노트 라이트 테마 + 슬라이드 레이아웃
   ├─ js/
   │  ├─ map-data.js          # 공유 노드 정의 (window.MAP_NODES)
   │  ├─ deck.js              # 슬라이드 엔진 (nav·progress·hash·notes)
   │  ├─ master-map.js        # renderMap() — "지금 여기" 하이라이트
   │  ├─ sim-journey.js       # 시뮬레이터 1 (JourneyModel + playJourney)
   │  └─ sim-ladder.js        # 시뮬레이터 2 (ladderState + renderLadder)
   └─ assets/
      └─ fonts/               # Pretendard woff2 (로컬 벤더링)
```

**유닛 책임 경계:**
- `deck.js` — 슬라이드 전환/네비게이션만. 콘텐츠 모름.
- `map-data.js` — 데이터만. 로직/DOM 없음.
- `master-map.js` — `MAP_NODES`를 받아 지도 DOM 렌더링.
- `sim-journey.js` — `JourneyModel`(순수) + `playJourney`(DOM). 순수 부분만 테스트.
- `sim-ladder.js` — `ladderState`(순수) + `renderLadder`(DOM). 순수 부분만 테스트.

---

## Task 0: 프로젝트 스캐폴딩 + git 초기화

**Files:**
- Create: `.gitignore`
- Create: `slides/css/`, `slides/js/`, `slides/assets/fonts/` (디렉터리)

- [ ] **Step 1: 디렉터리 생성**

Run:
```bash
mkdir -p slides/css slides/js slides/assets/fonts
```

- [ ] **Step 2: `.gitignore` 작성**

Create `.gitignore`:
```
.superpowers/
.DS_Store
Thumbs.db
```

- [ ] **Step 3: git 저장소 초기화**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold project structure and gitignore"
```
Expected: 첫 커밋 생성. `.superpowers/` 는 추적되지 않음.

> 참고: 사용자 전역 규칙에 따라 모든 커밋은 `git add -A`를 사용한다(.gitignore 자동 존중).

---

## Task 1: 강의 원고 `deploy-lecture.md` — 0~2부

**Files:**
- Create: `deploy-lecture.md`

이 파일은 콘텐츠 SSOT다. 각 부는 `## N부` 헤딩, 슬라이드 단위는 `### [슬라이드] 제목`, 강사 내레이션은 `> 🎤` 인용으로 적어 나중에 스피커노트로 재활용한다.

- [ ] **Step 1: 문서 헤더와 0부 작성**

`deploy-lecture.md` 상단:
```markdown
# 배포, 처음부터 끝까지 — 강의 원고

- 대상: 로컬 개발은 익숙하나 배포가 막막한 Spring Boot + Flutter 팀
- 분량: 반나절(약 3h), 개념 중심
- 관통 장치: 마스터 지도(요청의 여정)를 매 부 회수하며 "지금 여기" 표시

---

## 0부. 왜 배포가 막막한가 (12')

### [슬라이드] 타이틀
배포, 처음부터 끝까지 — 로컬 → 서버 → 외부 접속, 그 사이의 모든 화살표

### [슬라이드] "내 컴에선 되는데"의 정체
> 🎤 배포가 막막한 건 지식이 부족해서가 아니라, 로컬이라는 특수 환경에 우리가 모르게 의존하고 있어서입니다.

로컬 개발의 암묵적 전제 4가지 (서버엔 없는 것):
1. 항상 켜진 내 PC
2. localhost 로 바로 접속
3. IDE가 알아서 빌드·실행
4. 내 PC에만 깔린 JDK·DB

> 🎤 배포란 이 4가지를 '남의 컴퓨터(서버)'에 다시 만들어주는 일입니다.

### [슬라이드] 오늘의 여정 예고
0부 멘탈모델 → 1부 전체그림 → 2부 백엔드 → 3부 도메인·HTTPS → 4부 Flutter → 5부 잇기
```

- [ ] **Step 2: 1부 작성 (핵심 개념 8개 + 마스터 지도)**

이어서 추가:
```markdown
---

## 1부. 배포의 전체 그림 (22')

### [슬라이드] 마스터 지도 — 요청 한 번의 여정
Flutter앱 → DNS → 공인IP → 보안그룹 → Nginx → JAR(8080) → DB
> 🎤 오늘 우리는 이 화살표를 왼쪽부터 하나씩 정복합니다. 매 부 이 지도로 돌아옵니다.

### [슬라이드] 핵심 개념 8개
1. 빌드 산출물(artifact/JAR) — 내 코드가 압축된 실행 파일 하나
2. 실행 환경(JVM) — JAR을 돌리는 java
3. 프로세스 & 포트(8080) — 떠 있는 서버와 그 문 번호
4. 공인 IP vs 사설 IP — 인터넷에서 찾을 수 있는 주소 vs 내부 주소
5. 방화벽/보안그룹 — 어떤 포트를 열지
6. DNS — 도메인을 IP로 번역
7. 리버스 프록시 — 443으로 받아 내부 8080으로 전달
8. TLS 인증서 — 자물쇠(https)

### [슬라이드] 🧪 시뮬레이터: 요청의 여정
(sim-journey 임베드 — 도메인 입력→패킷 흐름, 보안그룹 토글로 차단 시연)
```

- [ ] **Step 3: 2부 작성 (자동화 사다리)**

이어서 추가:
```markdown
---

## 2부. 백엔드 올리기 — 자동화 사다리 (60')

### [슬라이드] 같은 JAR, 4가지 방식
> 🎤 핵심: 똑같은 app.jar 하나를 4가지로 올려봅니다. 위로 갈수록 내 손은 적게, 플랫폼이 많이.

### [슬라이드] 2-0. JAR이란
./gradlew build → build/libs/app.jar → java -jar app.jar
> 🎤 이 파일 하나가 너의 서버 전부입니다. Tomcat이 안에 들어있어요.

### [슬라이드] 2-1. AWS EC2에 손으로 (메인)
EC2(빈 우분투 한 대) → SSH → JDK 설치 → scp로 JAR 전송 → 실행 → 보안그룹 포트 열기 → systemd
> 🎤 여기서 일부러 고통을 느껴봅니다. 이걸 기억해두세요.

### [슬라이드] 2-2. Railway (대조)
GitHub 연결 → 끝. git push 하면 알아서 빌드·배포.
> 🎤 방금 22분 걸린 걸 git push 한 번이 대신합니다. 무엇을 대신해줬을까요?

### [슬라이드] 2-3. EKS — 왜/언제
컨테이너가 50개면? → 오케스트레이션의 탄생. Pod/Service/Deployment 개념. 언제 과잉인가도 솔직히.

### [슬라이드] 2-4. GitOps & ArgoCD — 종착
Git에 원하는 상태를 적으면 ArgoCD가 클러스터를 거기 맞춰 끝없이 동기화.
> 🎤 Railway 기억나죠? 그게 아기 GitOps였어요.

### [슬라이드] 🧪 시뮬레이터: 자동화 사다리
(sim-ladder 임베드 — 단계 클릭 시 작업칩이 나→플랫폼으로 이동)
```

- [ ] **Step 4: 0~2부 분량/일관성 확인**

확인: 0부·1부·2부가 각각 헤딩으로 구분되고, 1부에 핵심 개념 8개와 마스터 지도 슬라이드, 2부에 AWS→Railway→EKS→GitOps 4단계가 모두 있는지 눈으로 확인.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "docs: add lecture script parts 0-2 (deploy-lecture.md)"
```

---

## Task 2: 강의 원고 `deploy-lecture.md` — 3~5부

**Files:**
- Modify: `deploy-lecture.md` (append)

- [ ] **Step 1: 3부 작성 (도메인 + HTTPS)**

`deploy-lecture.md` 끝에 추가:
```markdown
---

## 3부. 도메인 + HTTPS (20')

### [슬라이드] IP를 사람 주소로 — DNS A레코드
13.124.x.x → api.myapp.com. Route53/가비아에서 A레코드 등록.

### [슬라이드] 리버스 프록시는 왜 필요한가
브라우저는 80/443으로 옴 → Nginx가 받아 내부 8080으로 전달. 한 서버에 여러 앱도 가능.

### [슬라이드] HTTPS — 자물쇠 붙이기
TLS 인증서. Let's Encrypt(무료·자동갱신) vs AWS ACM. http→https 비교, "주의 요함" 경고.
> 🎤 https는 선택이 아니라 기본입니다. 앱 스토어도 평문 http를 막습니다.
```

- [ ] **Step 2: 4부 작성 (Flutter 배포)**

이어서 추가:
```markdown
---

## 4부. Flutter 앱 배포 (40')

### [슬라이드] 앱은 "올리는" 게 아니라 "심사받아 배포"
서버 배포와 다른 멘탈모델.

### [슬라이드] 빌드 산출물 — APK / AAB / IPA
디버그 vs 릴리스. 안드로이드 AAB(스토어용)/APK(직접설치), iOS IPA.

### [슬라이드] 코드 서명 — 왜 필요한가
안드로이드 keystore, iOS 인증서·프로비저닝 프로파일. = 위변조 방지 도장.

### [슬라이드] 배포 트랙 3단
내부테스트(Firebase App Distribution / Play 내부테스트 / TestFlight) → 비공개 → 프로덕션.

### [슬라이드] 스토어 심사 흐름 + 흔한 반려
특히 Apple. 권한 설명 누락, 개인정보 처리방침 등.

### [슬라이드] 🔌 백엔드와 만나는 지점
앱의 baseURL을 dev/prod로 바꿔끼우기 → 2부에서 올린 서버 주소가 여기로 들어온다.
> 🎤 두 세계가 연결되는 순간입니다.
```

- [ ] **Step 3: 5부 작성 (전체 잇기)**

이어서 추가:
```markdown
---

## 5부. 전체 잇기 + Q&A (16')

### [슬라이드] 환경 분리 — dev / staging / prod
앱 baseURL ↔ 백엔드 환경. 비밀값 관리 한 스푼.

### [슬라이드] 비용 감각
EC2 t2.micro 프리티어 / Railway 무료한도 / "취미는 PaaS, 회사는 클라우드".

### [슬라이드] CI/CD 한 줄 + 마무리
push하면 자동 빌드·배포. 마스터 지도 전체 회수.

### [슬라이드] 다음 한 걸음 (숙제)
이번 주말 Railway에 너희 프로젝트 하나 올려보기.
```

- [ ] **Step 4: 전체 6부 일관성 확인**

확인: 0~5부 모두 존재, 시간 합계 12+22+60+20+40+16=170분, 시뮬레이터 임베드 슬라이드가 1부·2부에 표시됨.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "docs: add lecture script parts 3-5 (deploy-lecture.md)"
```

---

## Task 3: 키노트 라이트 테마 + 폰트 (`deck.css`)

**Files:**
- Create: `slides/assets/fonts/` (Pretendard woff2 배치)
- Create: `slides/css/deck.css`

- [ ] **Step 1: Pretendard 폰트 벤더링**

Run (Pretendard 동적 서브셋 woff2 다운로드, 오프라인 동작 보장):
```bash
curl -L -o slides/assets/fonts/Pretendard-Regular.woff2 https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2
curl -L -o slides/assets/fonts/Pretendard-Bold.woff2 https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Bold.woff2
curl -L -o slides/assets/fonts/Pretendard-ExtraBold.woff2 https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-ExtraBold.woff2
```
Expected: 3개 woff2 파일이 생성됨 (각 수십~수백 KB). 실패 시 system-ui 폴백으로도 동작하므로 진행 가능.

- [ ] **Step 2: `deck.css` 작성 — 디자인 토큰 + 슬라이드 레이아웃**

Create `slides/css/deck.css`:
```css
@font-face{font-family:Pretendard;font-weight:400;src:url(../assets/fonts/Pretendard-Regular.woff2) format('woff2');font-display:swap}
@font-face{font-family:Pretendard;font-weight:700;src:url(../assets/fonts/Pretendard-Bold.woff2) format('woff2');font-display:swap}
@font-face{font-family:Pretendard;font-weight:800;src:url(../assets/fonts/Pretendard-ExtraBold.woff2) format('woff2');font-display:swap}

:root{
  --bg:#fafafa; --ink:#18181b; --muted:#71717a; --line:#e4e4e7;
  --accent:#4f46e5; --accent-soft:#eef2ff; --warn:#fdba74; --danger:#ef4444;
  --slide-w:1280px; --slide-h:720px;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#27272a;
  font-family:Pretendard,system-ui,-apple-system,sans-serif;color:var(--ink)}

/* 무대: 16:9 슬라이드를 화면 중앙에 스케일 */
#stage{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden}
#deck{width:var(--slide-w);height:var(--slide-h);position:relative;
  background:var(--bg);box-shadow:0 20px 60px rgba(0,0,0,.4);
  transform:scale(var(--scale,1));transform-origin:center}

.slide{position:absolute;inset:0;padding:64px 72px;
  opacity:0;visibility:hidden;transition:opacity .25s ease;
  display:flex;flex-direction:column;justify-content:center}
.slide.active{opacity:1;visibility:visible}

.slide .label{font-size:14px;letter-spacing:.16em;text-transform:uppercase;
  font-weight:700;color:var(--accent);margin-bottom:18px}
.slide h1{font-size:64px;font-weight:800;letter-spacing:-.02em;line-height:1.12;margin:0}
.slide h2{font-size:44px;font-weight:800;letter-spacing:-.01em;line-height:1.18;margin:0 0 24px}
.slide p,.slide li{font-size:24px;line-height:1.55;color:var(--ink)}
.slide .muted{color:var(--muted)}
.slide .accent-bar{height:6px;width:96px;background:var(--accent);border-radius:3px;margin-top:28px}

/* 진행 UI */
#progress{position:fixed;left:0;bottom:0;height:4px;background:var(--accent);
  width:0;transition:width .2s ease;z-index:10}
#hud{position:fixed;right:16px;bottom:14px;font-size:13px;color:#d4d4d8;
  font-family:Pretendard,sans-serif;z-index:10}

/* 클릭존 */
.navzone{position:fixed;top:0;bottom:0;width:18%;z-index:5;cursor:pointer}
.navzone.left{left:0}.navzone.right{right:0}

/* 스피커 노트 */
#notes{position:fixed;left:0;right:0;bottom:0;max-height:38vh;overflow:auto;
  background:#111;color:#e4e4e7;padding:20px 28px;font-size:16px;line-height:1.6;
  display:none;z-index:20;border-top:2px solid var(--accent)}
#notes.show{display:block}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: add keynote-light theme and vendored Pretendard font"
```

---

## Task 4: 덱 진입점 + 슬라이드 엔진 (`index.html`, `deck.js`)

**Files:**
- Create: `slides/index.html`
- Create: `slides/js/deck.js`

- [ ] **Step 1: `index.html` 골격 작성 (샘플 슬라이드 3장 포함)**

Create `slides/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>배포, 처음부터 끝까지</title>
<link rel="stylesheet" href="css/deck.css">
</head>
<body>
<div id="stage">
  <div id="deck">

    <section class="slide" data-part="0">
      <div class="label">PART 0 · 배포 입문</div>
      <h1>배포, 처음부터<br>끝까지</h1>
      <p class="muted">로컬 → 서버 → 외부 접속, 그 사이의 모든 화살표</p>
      <div class="accent-bar"></div>
      <aside class="note" hidden>배포가 막막한 건 지식 부족이 아니라 로컬 환경에 대한 무의식적 의존 때문입니다.</aside>
    </section>

    <section class="slide" data-part="0">
      <div class="label">PART 0</div>
      <h2>"내 컴에선 되는데"의 정체</h2>
      <p>로컬의 암묵적 전제 4가지 — 서버엔 없습니다.</p>
      <ul>
        <li>항상 켜진 내 PC</li>
        <li>localhost 로 바로 접속</li>
        <li>IDE가 알아서 빌드·실행</li>
        <li>내 PC에만 깔린 JDK·DB</li>
      </ul>
      <aside class="note" hidden>배포란 이 4가지를 남의 컴퓨터(서버)에 다시 만들어주는 일.</aside>
    </section>

    <section class="slide" data-part="1">
      <div class="label">PART 1</div>
      <h2>샘플 — 엔진 동작 확인용</h2>
      <p class="muted">← → 로 넘기고, S로 노트, 진행바·HUD 확인.</p>
    </section>

  </div>
</div>

<div id="progress"></div>
<div id="hud"></div>
<div id="notes"></div>
<div class="navzone left"  id="navL"></div>
<div class="navzone right" id="navR"></div>

<script src="js/deck.js"></script>
</body>
</html>
```

- [ ] **Step 2: `deck.js` 엔진 작성**

Create `slides/js/deck.js`:
```js
(function () {
  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const progress = document.getElementById('progress');
  const hud = document.getElementById('hud');
  const notes = document.getElementById('notes');
  let i = 0;

  function clampIndex(n){ return Math.max(0, Math.min(slides.length - 1, n)); }

  function render() {
    slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    progress.style.width = ((i + 1) / slides.length * 100) + '%';
    const part = slides[i].dataset.part || '-';
    hud.textContent = `${part}부 · ${i + 1} / ${slides.length}`;
    const note = slides[i].querySelector('.note');
    notes.textContent = note ? note.textContent : '(스피커 노트 없음)';
    if (location.hash !== '#s' + i) history.replaceState(null, '', '#s' + i);
  }

  function go(n){ i = clampIndex(n); render(); }
  function next(){ go(i + 1); }
  function prev(){ go(i - 1); }

  // 화면 크기에 맞춰 16:9 스케일
  function fit(){
    const sw = window.innerWidth / 1280, sh = window.innerHeight / 720;
    deck.style.setProperty('--scale', Math.min(sw, sh).toFixed(4));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { prev(); }
    else if (e.key === 's' || e.key === 'S') { notes.classList.toggle('show'); }
    else if (e.key === 'Home') { go(0); }
    else if (e.key === 'End') { go(slides.length - 1); }
  });
  document.getElementById('navL').addEventListener('click', prev);
  document.getElementById('navR').addEventListener('click', next);
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', () => {
    const m = /^#s(\d+)$/.exec(location.hash);
    if (m && +m[1] !== i) go(+m[1]);
  });

  // 초기 위치: 해시 우선
  const m = /^#s(\d+)$/.exec(location.hash);
  if (m) i = clampIndex(+m[1]);
  fit(); render();

  window.Deck = { go, next, prev, count: () => slides.length };
})();
```

- [ ] **Step 3: 브라우저 검증**

Run (정적 서버 띄우기):
```bash
python -m http.server 8000 --directory slides
```
브라우저에서 `http://localhost:8000` 열기. 확인:
- 첫 슬라이드(타이틀)가 보인다
- `→` / 오른쪽 클릭존 → 다음, `←` → 이전
- 진행바가 차오르고 HUD가 `0부 · 1 / 3` 형태로 갱신
- `S` 누르면 하단 노트 토글, 타이틀 슬라이드 노트 텍스트 표시
- 새로고침 시 현재 슬라이드 유지(해시 `#s1` 등)
- 창 크기 바꿔도 슬라이드가 16:9로 화면에 맞게 스케일

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add slide deck engine (nav, progress, hash routing, notes)"
```

---

## Task 5: 공유 노드 데이터 + 마스터 지도 (`map-data.js`, `master-map.js`)

**Files:**
- Create: `slides/js/map-data.js`
- Create: `slides/js/master-map.js`
- Create: `slides/test.html`

- [ ] **Step 1: `map-data.js` 작성**

Create `slides/js/map-data.js`:
```js
// 마스터 지도 = 요청의 여정. master-map.js 와 sim-journey.js 가 공유한다.
window.MAP_NODES = [
  { id:'app',   icon:'📱', label:'Flutter 앱', caption:'사용자 기기. 요청이 출발하는 곳.' },
  { id:'dns',   icon:'🌐', label:'DNS',        caption:'도메인을 IP로 번역하는 전화번호부.' },
  { id:'ip',    icon:'📍', label:'공인 IP',    caption:'인터넷에서 내 서버를 찾는 실제 주소.' },
  { id:'sg',    icon:'🛡️', label:'보안그룹',   caption:'어떤 포트를 열지 정하는 방화벽.' },
  { id:'nginx', icon:'🔀', label:'Nginx',      caption:'443으로 받아 내부 8080으로 넘기는 리버스 프록시.' },
  { id:'jar',   icon:'☕', label:'JAR :8080',  caption:'java -jar 로 떠 있는 Spring Boot 본체.' },
  { id:'db',    icon:'🗄️', label:'DB',         caption:'데이터를 보관하는 곳.' }
];
```

- [ ] **Step 2: `master-map.js` 작성**

Create `slides/js/master-map.js`:
```js
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
```

- [ ] **Step 3: 지도 CSS를 `deck.css`에 추가**

Modify `slides/css/deck.css` (파일 끝에 추가):
```css
/* 마스터 지도 */
.mapchain{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
.mapnode{flex:1;min-width:96px;text-align:center;padding:14px 8px;border-radius:12px;
  background:#f4f4f5;border:2px solid var(--line);transition:all .2s}
.mapnode.cur{background:var(--accent-soft);border-color:var(--accent);
  box-shadow:0 6px 18px rgba(79,70,229,.18);transform:translateY(-2px)}
.mapicon{font-size:26px}
.maplabel{font-size:14px;font-weight:700;margin-top:4px}
.mapnode.cur .maplabel{color:var(--accent)}
.maparrow{color:#a1a1aa;font-weight:700}
```

- [ ] **Step 4: `test.html` 작성 (지도 데이터 어서션)**

Create `slides/test.html`:
```html
<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>simulator logic tests</title>
<style>body{font-family:system-ui;padding:24px}.pass{color:#16a34a}.fail{color:#dc2626;font-weight:700}</style>
</head><body>
<h1>시뮬레이터 순수 로직 테스트</h1>
<ul id="out"></ul>
<script src="js/map-data.js"></script>
<!-- sim 스크립트는 이후 Task에서 추가된다 -->
<script>
  const out = document.getElementById('out');
  let fails = 0;
  function check(name, cond){
    const li = document.createElement('li');
    li.textContent = (cond ? 'PASS — ' : 'FAIL — ') + name;
    li.className = cond ? 'pass' : 'fail';
    if(!cond) fails++;
    out.appendChild(li);
  }
  // map-data
  check('MAP_NODES has 7 nodes', window.MAP_NODES.length === 7);
  check('first node is app', window.MAP_NODES[0].id === 'app');
  check('sg node exists', window.MAP_NODES.some(n => n.id === 'sg'));

  window.__report = () => {
    const h = document.createElement('h2');
    h.textContent = fails === 0 ? '✅ ALL PASS' : `❌ ${fails} FAIL`;
    h.className = fails === 0 ? 'pass' : 'fail';
    document.body.appendChild(h);
  };
  window.__report();
</script>
</body></html>
```

- [ ] **Step 5: 브라우저 검증**

`http://localhost:8000/test.html` 열기 (서버가 꺼졌으면 Task4 Step3 명령 재실행).
Expected: 3개 PASS, 하단 `✅ ALL PASS`.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add shared map data, master-map renderer, and test harness"
```

---

## Task 6: 0~1부 슬라이드 완성 (마스터 지도 도입 포함)

**Files:**
- Modify: `slides/index.html`

Task1의 md 내용을 슬라이드로 옮긴다. Task4의 샘플 1부 슬라이드는 실제 콘텐츠로 교체한다.

- [ ] **Step 1: 0부 슬라이드 교체/추가**

`index.html`의 0부 두 슬라이드는 Task4에서 이미 작성됨(타이틀 + "내 컴에선 되는데"). 그 뒤에 "오늘의 여정 예고" 슬라이드를 추가:
```html
<section class="slide" data-part="0">
  <div class="label">PART 0</div>
  <h2>오늘의 여정</h2>
  <p>0부 멘탈모델 · 1부 전체그림 · 2부 백엔드 · 3부 도메인·HTTPS · 4부 Flutter · 5부 잇기</p>
  <div class="accent-bar"></div>
</section>
```

- [ ] **Step 2: 1부 샘플 슬라이드를 마스터 지도 슬라이드로 교체**

Task4의 `data-part="1"` 샘플 `<section>`을 다음으로 교체:
```html
<section class="slide" data-part="1">
  <div class="label">PART 1</div>
  <h2>마스터 지도 — 요청 한 번의 여정</h2>
  <div id="map-intro"></div>
  <p class="muted" style="margin-top:24px">이 화살표를 왼쪽부터 하나씩 정복합니다. 매 부 이 지도로 돌아옵니다.</p>
  <aside class="note" hidden>전체 강의의 지도. 매 부 도입에서 "지금 여기"를 표시.</aside>
</section>
```

- [ ] **Step 3: 1부 핵심 개념 8개 슬라이드 추가**

위 슬라이드 다음에 추가:
```html
<section class="slide" data-part="1">
  <div class="label">PART 1</div>
  <h2>핵심 개념 8개</h2>
  <ul style="columns:2;column-gap:48px">
    <li>빌드 산출물(JAR)</li><li>실행 환경(JVM)</li>
    <li>프로세스 &amp; 포트(8080)</li><li>공인 IP vs 사설 IP</li>
    <li>방화벽/보안그룹</li><li>DNS</li>
    <li>리버스 프록시</li><li>TLS 인증서</li>
  </ul>
</section>
```

- [ ] **Step 4: 마스터 지도 렌더 스크립트 연결**

`index.html`의 `<script src="js/deck.js"></script>` **앞에** 추가:
```html
<script src="js/map-data.js"></script>
<script src="js/master-map.js"></script>
```
그리고 `deck.js` 로드 **뒤에** 추가:
```html
<script>
  const mi = document.getElementById('map-intro');
  if (mi) renderMap(mi, 'app'); // 1부 도입: 출발점 강조
</script>
```

- [ ] **Step 5: 브라우저 검증**

`http://localhost:8000` 새로고침. 확인:
- 0부 3장(타이틀/내컴/여정), 1부 지도+개념8개 슬라이드가 순서대로 넘어감
- 마스터 지도 슬라이드에 7개 노드가 화살표로 연결되고 `Flutter 앱` 노드가 하이라이트(인디고)
- HUD 부 표시가 0부→1부로 바뀜

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: build parts 0-1 slides with master map intro"
```

---

## Task 7: 2~3부 슬라이드 완성

**Files:**
- Modify: `slides/index.html`

- [ ] **Step 1: 2부 슬라이드 추가 (자동화 사다리 서사)**

1부 마지막 슬라이드 뒤에 추가 (sim-ladder 임베드 자리 포함):
```html
<section class="slide" data-part="2">
  <div class="label">PART 2</div>
  <h2>같은 JAR, 4가지 방식</h2>
  <p>똑같은 <code>app.jar</code> 하나를 4단계로 올려봅니다. 위로 갈수록 내 손은 적게.</p>
  <div class="accent-bar"></div>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 2-0</div>
  <h2>JAR이란</h2>
  <p><code>./gradlew build</code> → <code>build/libs/app.jar</code> → <code>java -jar app.jar</code></p>
  <p class="muted">이 파일 하나가 너의 서버 전부. Tomcat이 안에 들어있습니다.</p>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 2-1 (메인)</div>
  <h2>AWS EC2에 손으로</h2>
  <p>EC2(빈 우분투) → SSH → JDK 설치 → scp 전송 → 실행 → <b>보안그룹 포트 열기</b> → systemd</p>
  <aside class="note" hidden>여기서 일부러 고통을 느낀다. 다음 단계와 대조하기 위해.</aside>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 2-2</div>
  <h2>Railway — git push면 끝</h2>
  <p>GitHub 연결 → 끝. 방금 22분 걸린 걸 <code>git push</code> 한 번이 대신합니다.</p>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 2-3</div>
  <h2>EKS — 왜/언제</h2>
  <p>컨테이너가 50개면? → 오케스트레이션. Pod·Service·Deployment. <span class="muted">입문 팀엔 보통 과잉.</span></p>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 2-4</div>
  <h2>GitOps &amp; ArgoCD — 종착</h2>
  <p>Git에 원하는 상태를 적으면 ArgoCD가 클러스터를 거기 맞춰 동기화.</p>
  <p class="muted">Railway 기억나죠? 그게 아기 GitOps였어요.</p>
</section>
<section class="slide" data-part="2">
  <div class="label">PART 2 · 🧪 시뮬레이터</div>
  <h2>자동화 사다리</h2>
  <div id="sim-ladder-mount"></div>
  <aside class="note" hidden>단계를 클릭해 작업칩이 나→플랫폼으로 옮겨가는 걸 보여준다.</aside>
</section>
```

- [ ] **Step 2: 3부 슬라이드 추가**

이어서 추가:
```html
<section class="slide" data-part="3">
  <div class="label">PART 3</div>
  <h2>IP를 사람 주소로 — DNS</h2>
  <p>13.124.x.x → <code>api.myapp.com</code>. Route53/가비아에서 A레코드 등록.</p>
  <div id="map-dns"></div>
</section>
<section class="slide" data-part="3">
  <div class="label">PART 3</div>
  <h2>리버스 프록시는 왜?</h2>
  <p>브라우저는 80/443으로 옴 → Nginx가 받아 내부 8080으로 전달.</p>
  <div id="map-nginx"></div>
</section>
<section class="slide" data-part="3">
  <div class="label">PART 3</div>
  <h2>HTTPS — 자물쇠 붙이기</h2>
  <p>TLS 인증서. Let's Encrypt(무료·자동갱신) vs AWS ACM.</p>
  <p class="muted">https는 선택이 아니라 기본. 앱 스토어도 평문 http를 막습니다.</p>
</section>
```

- [ ] **Step 3: 3부 지도 "지금 여기" 렌더 연결**

`index.html` 하단의 `renderMap(mi,'app')` 스크립트 블록에 줄 추가:
```js
  const dns = document.getElementById('map-dns');   if (dns) renderMap(dns, 'dns');
  const ngx = document.getElementById('map-nginx'); if (ngx) renderMap(ngx, 'nginx');
```

- [ ] **Step 4: 브라우저 검증**

새로고침 후 확인: 2부 7장(서사+시뮬레이터 자리), 3부 3장이 넘어가며, 3부 DNS/Nginx 슬라이드에서 지도의 해당 노드가 하이라이트된다. (시뮬레이터 마운트는 비어있음 — Task10에서 채움)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: build parts 2-3 slides with map highlights"
```

---

## Task 8: 4~5부 슬라이드 완성

**Files:**
- Modify: `slides/index.html`

- [ ] **Step 1: 4부 슬라이드 추가**

3부 마지막 뒤에 추가:
```html
<section class="slide" data-part="4">
  <div class="label">PART 4</div>
  <h2>앱은 "올리는" 게 아니라<br>"심사받아 배포"</h2>
  <p class="muted">서버 배포와는 멘탈모델이 다릅니다.</p>
</section>
<section class="slide" data-part="4">
  <div class="label">PART 4</div>
  <h2>빌드 산출물 — APK / AAB / IPA</h2>
  <p>디버그 vs 릴리스. 안드로이드 AAB(스토어)/APK(직접설치), iOS IPA.</p>
</section>
<section class="slide" data-part="4">
  <div class="label">PART 4</div>
  <h2>코드 서명 — 왜 필요한가</h2>
  <p>안드로이드 keystore, iOS 인증서·프로비저닝 프로파일. = 위변조 방지 도장.</p>
</section>
<section class="slide" data-part="4">
  <div class="label">PART 4</div>
  <h2>배포 트랙 3단</h2>
  <p>내부테스트(Firebase App Distribution / Play 내부테스트 / TestFlight) → 비공개 → 프로덕션</p>
</section>
<section class="slide" data-part="4">
  <div class="label">PART 4</div>
  <h2>스토어 심사 + 흔한 반려</h2>
  <p>특히 Apple. 권한 설명 누락, 개인정보 처리방침 미비 등.</p>
</section>
<section class="slide" data-part="4">
  <div class="label">PART 4 · 🔌 연결</div>
  <h2>백엔드와 만나는 지점</h2>
  <p>앱의 <code>baseURL</code>을 dev/prod로 바꿔끼우기 → 2부에서 올린 서버 주소가 여기로.</p>
  <p class="muted">두 세계가 연결되는 순간입니다.</p>
</section>
```

- [ ] **Step 2: 5부 슬라이드 추가**

이어서 추가:
```html
<section class="slide" data-part="5">
  <div class="label">PART 5</div>
  <h2>환경 분리 — dev / staging / prod</h2>
  <p>앱 baseURL ↔ 백엔드 환경. 비밀값 관리 한 스푼.</p>
</section>
<section class="slide" data-part="5">
  <div class="label">PART 5</div>
  <h2>비용 감각</h2>
  <p>EC2 t2.micro 프리티어 / Railway 무료한도. <b>취미는 PaaS, 회사는 클라우드.</b></p>
</section>
<section class="slide" data-part="5">
  <div class="label">PART 5</div>
  <h2>전체 잇기 + 다음 한 걸음</h2>
  <div id="map-final"></div>
  <p style="margin-top:20px">숙제: 이번 주말 Railway에 너희 프로젝트 하나 올려보기.</p>
</section>
```

- [ ] **Step 3: 5부 전체 지도 렌더 연결**

하단 스크립트 블록에 추가 (전체 경로 강조 — currentId 없이 전체 표시):
```js
  const fin = document.getElementById('map-final'); if (fin) renderMap(fin, null);
```

- [ ] **Step 4: 브라우저 검증**

새로고침. 확인: 4부 6장, 5부 3장이 넘어가고, 마지막 슬라이드에 전체 지도(하이라이트 없이 전체)가 표시. HUD 마지막이 `5부 · N / N`.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: build parts 4-5 slides"
```

---

## Task 9: 시뮬레이터 1 — 요청의 여정 (`sim-journey.js`)

**Files:**
- Create: `slides/js/sim-journey.js`
- Modify: `slides/test.html`
- Modify: `slides/index.html`
- Modify: `slides/css/deck.css`

- [ ] **Step 1: `test.html`에 여정 로직 실패 테스트 먼저 추가**

`test.html`의 map-data check 블록 뒤(`window.__report` 정의 전)에 추가:
```js
  // sim-journey 순수 로직
  if (window.JourneyModel) {
    const open = JourneyModel.path(true);
    check('open path reaches all 7 nodes', open.reached.length === 7 && open.blocked === false);
    const blocked = JourneyModel.path(false);
    check('closed SG blocks at sg', blocked.blocked === true && blocked.reached[blocked.reached.length-1] === 'sg');
    check('closed path stops before jar', !blocked.reached.includes('jar'));
  } else {
    check('JourneyModel loaded', false);
  }
```
그리고 `test.html`의 `<script src="js/map-data.js"></script>` 뒤에 추가:
```html
<script src="js/sim-journey.js"></script>
```

- [ ] **Step 2: 테스트 실패 확인**

`http://localhost:8000/test.html` 열기.
Expected: `JourneyModel loaded` 또는 여정 관련 체크가 FAIL (아직 파일 없음 → 404, JourneyModel undefined).

- [ ] **Step 3: `sim-journey.js` 작성 (순수 모델 + 렌더)**

Create `slides/js/sim-journey.js`:
```js
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
      chain.querySelectorAll('.mapnode').forEach(el => el.classList.remove('cur', 'blocked'));
      const sgOpen = container.querySelector('.sim-sg').checked;
      const { reached, blocked } = JourneyModel.path(sgOpen);
      let k = 0;
      timer = setInterval(() => {
        if (k > 0) chain.querySelector(`.mapnode[data-id="${reached[k-1]}"]`)?.classList.remove('cur');
        if (k >= reached.length) {
          clearInterval(timer); timer = null;
          const last = reached[reached.length - 1];
          if (blocked) {
            chain.querySelector(`.mapnode[data-id="${last}"]`)?.classList.add('blocked');
            caption.innerHTML = '🛑 <b>보안그룹</b>에서 차단! 443 포트가 닫혀 패킷이 서버에 닿지 못합니다.';
          } else {
            caption.innerHTML = '✅ 응답이 같은 길을 거꾸로 돌아 앱에 도착합니다.';
          }
          return;
        }
        const node = nodes.find(n => n.id === reached[k]);
        chain.querySelector(`.mapnode[data-id="${reached[k]}"]`)?.classList.add('cur');
        caption.innerHTML = `💬 <b>${node.label}</b>: ${node.caption}`;
        k++;
      }, 900);
    }
    container.querySelector('.sim-go').addEventListener('click', play);
  }
  window.mountJourney = mountJourney;
})();
```

- [ ] **Step 4: 테스트 통과 확인**

`test.html`의 `<script src="js/sim-journey.js"></script>`가 이미 Step1에서 추가됨. `http://localhost:8000/test.html` 새로고침.
Expected: 여정 3개 체크 PASS, 하단 `✅ ALL PASS`.

- [ ] **Step 5: 시뮬레이터 CSS 추가**

Modify `slides/css/deck.css` (끝에 추가):
```css
/* 시뮬레이터 공통/여정 */
.sim-controls{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.sim-input{font-family:ui-monospace,monospace;font-size:18px;padding:8px 12px;
  border:1px solid var(--line);border-radius:8px;max-width:240px}
.sim-go{font-size:18px;font-weight:700;color:#fff;background:var(--accent);
  border:0;border-radius:8px;padding:9px 16px;cursor:pointer}
.sim-toggle{margin-left:auto;font-size:16px;color:var(--muted);display:flex;align-items:center;gap:6px}
.sim-chain{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.mapnode.blocked{background:#fee2e2;border-color:var(--danger);
  box-shadow:0 0 0 3px rgba(239,68,68,.25)}
.sim-caption{margin-top:18px;background:#18181b;color:#e4e4e7;border-radius:8px;
  padding:14px 18px;font-size:18px;min-height:28px}
```

- [ ] **Step 6: 1부 시뮬레이터 슬라이드에 마운트**

`index.html` 1부 마스터 지도 슬라이드 **뒤**(핵심 개념 8개 다음)에 추가:
```html
<section class="slide" data-part="1">
  <div class="label">PART 1 · 🧪 시뮬레이터</div>
  <h2>요청의 여정</h2>
  <div id="sim-journey-mount"></div>
  <aside class="note" hidden>도메인 입력→흐름 재생. 보안그룹 토글 해제 후 다시 보내 차단을 시연.</aside>
</section>
```
그리고 `index.html`의 `<script src="js/master-map.js"></script>` 뒤에 추가:
```html
<script src="js/sim-journey.js"></script>
```
하단 렌더 스크립트 블록에 추가:
```js
  const sj = document.getElementById('sim-journey-mount'); if (sj) mountJourney(sj);
```

- [ ] **Step 7: 브라우저 검증**

`http://localhost:8000` 1부 "요청의 여정" 슬라이드로 이동. 확인:
- ▶ 누르면 노드가 순차 점등, 캡션이 단계마다 바뀜, 마지막에 ✅ 왕복 메시지
- "보안그룹 443 열림" 체크 해제 후 ▶ → 보안그룹 노드가 빨갛게 차단, 🛑 메시지

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: add request-journey simulator with SG-block demo"
```

---

## Task 10: 시뮬레이터 2 — 자동화 사다리 (`sim-ladder.js`)

**Files:**
- Create: `slides/js/sim-ladder.js`
- Modify: `slides/test.html`
- Modify: `slides/index.html`
- Modify: `slides/css/deck.css`

- [ ] **Step 1: `test.html`에 사다리 로직 실패 테스트 추가**

`test.html`의 여정 체크 블록 뒤에 추가:
```js
  // sim-ladder 순수 로직
  if (window.ladderState) {
    check('aws: all 8 tasks are mine', ladderState('aws').me.length === 8 && ladderState('aws').platform.length === 0);
    check('gitops: all 8 to platform', ladderState('gitops').platform.length === 8 && ladderState('gitops').me.length === 0);
    check('railway: SSH moved to platform', ladderState('railway').platform.includes('SSH 접속'));
    check('eks: scaling moved to platform', ladderState('eks').platform.includes('스케일링'));
  } else {
    check('ladderState loaded', false);
  }
```
그리고 `test.html`의 `<script src="js/sim-journey.js"></script>` 뒤에 추가:
```html
<script src="js/sim-ladder.js"></script>
```

- [ ] **Step 2: 테스트 실패 확인**

`http://localhost:8000/test.html` 새로고침.
Expected: 사다리 관련 체크 FAIL (`ladderState` 아직 없음).

- [ ] **Step 3: `sim-ladder.js` 작성 (순수 모델 + 렌더)**

Create `slides/js/sim-ladder.js`:
```js
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
      <div class="ladder-col"><div class="ladder-head">🤖 플랫폼이 하는 일</div><div class="ladder-pf chips"></div></div>`;
    const meBox = container.querySelector('.ladder-me');
    const pfBox = container.querySelector('.ladder-pf');
    function paint(stage) {
      const { me, platform } = ladderState(stage);
      meBox.innerHTML = me.map(t => `<span class="chip me">${t}</span>`).join('') || '<span class="empty">(없음)</span>';
      pfBox.innerHTML = platform.map(t => `<span class="chip pf">${t}</span>`).join('') || '<span class="empty">AWS에선 거의 없음</span>';
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
```

- [ ] **Step 4: 테스트 통과 확인**

`http://localhost:8000/test.html` 새로고침.
Expected: 사다리 4개 체크 PASS, 하단 `✅ ALL PASS` (총 map3 + journey3 + ladder4 = 10 PASS).

- [ ] **Step 5: 사다리 CSS 추가**

Modify `slides/css/deck.css` (끝에 추가):
```css
/* 자동화 사다리 */
.sim-ladder{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ladder-tabs{grid-column:1/3;display:flex;gap:8px;margin-bottom:8px}
.ladder-tab{flex:1;font-size:18px;font-weight:700;padding:10px;border:0;border-radius:8px;
  background:#f4f4f5;color:var(--ink);cursor:pointer}
.ladder-tab.on{background:var(--accent);color:#fff}
.ladder-col{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;min-height:180px}
.ladder-head{font-size:16px;font-weight:700;color:var(--muted);margin-bottom:10px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{padding:7px 12px;border-radius:8px;font-size:16px}
.chip.me{background:#fee2e2}
.chip.pf{background:#dcfce7}
.empty{color:#a1a1aa;font-size:15px}
```

- [ ] **Step 6: 2부 시뮬레이터 슬라이드에 마운트**

`index.html`의 `<script src="js/sim-journey.js"></script>` 뒤에 추가:
```html
<script src="js/sim-ladder.js"></script>
```
하단 렌더 스크립트 블록에 추가:
```js
  const sl = document.getElementById('sim-ladder-mount'); if (sl) renderLadder(sl);
```
(`sim-ladder-mount` 슬라이드는 Task7 Step1에서 이미 추가됨)

- [ ] **Step 7: 브라우저 검증**

`http://localhost:8000` 2부 "자동화 사다리" 슬라이드로 이동. 확인:
- 기본(AWS)에서 8개 칩이 모두 "내가 하는 일"(빨강)
- Railway 클릭 → 6개가 "플랫폼"(초록)으로 이동
- EKS → 스케일링까지 7개 플랫폼, GitOps → 8개 전부 플랫폼/내일은 비어 "(없음)"

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: add automation-ladder simulator"
```

---

## Task 11: 반응형·프로젝터 폴리시 + 전체 QA

**Files:**
- Modify: `slides/css/deck.css`
- Modify: `slides/index.html` (필요 시)

- [ ] **Step 1: 작은 화면/저해상도 프로젝터 대비 폴리시**

Modify `slides/css/deck.css` (끝에 추가):
```css
/* 키보드 도움말 (첫 진입 힌트) */
#help{position:fixed;left:16px;bottom:12px;font-size:12px;color:#a1a1aa;z-index:10}
/* 코드 인라인 */
.slide code{font-family:ui-monospace,monospace;background:#eef2ff;
  color:#3730a3;padding:1px 7px;border-radius:5px;font-size:.92em}
```
그리고 `index.html`의 `#hud` 뒤에 추가:
```html
<div id="help">← → 이동 · S 노트 · Home/End 처음/끝</div>
```

- [ ] **Step 2: 전체 슬라이드 워크스루 QA**

`http://localhost:8000`에서 처음부터 끝까지 `→`로 전부 넘기며 확인:
- 0~5부 모든 슬라이드가 끊김 없이 전환
- 1부·3부·5부 마스터 지도의 "지금 여기"가 각각 app / dns·nginx / 전체
- 1부 여정 시뮬레이터: 정상 흐름 + 보안그룹 차단 둘 다 동작
- 2부 사다리 시뮬레이터: 4단계 칩 이동 동작
- `S` 노트 토글, 진행바·HUD 정상
- 새로고침해도 위치 유지(해시)

- [ ] **Step 3: 오프라인 동작 확인**

서버를 끄고(`Ctrl+C`) `slides/index.html`을 브라우저로 직접 열어(파일 프로토콜) 확인:
- 폰트·슬라이드·시뮬레이터가 인터넷 없이 동작 (모듈이 모두 상대경로 로컬 파일이므로)
> 참고: 일부 브라우저는 `file://`에서 폰트 CORS를 막을 수 있음. 그 경우 system-ui로 폴백되며 레이아웃은 유지됨 — 정상.

- [ ] **Step 4: test.html 최종 통과 확인**

서버 재기동 후 `http://localhost:8000/test.html`에서 `✅ ALL PASS`(10개) 재확인.

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: add projector polish, keyboard help, and final QA pass"
```

---

## Self-Review (작성자 체크 완료)

**1. 스펙 커버리지:**
- D1 슬라이드 덱 → Task4 엔진 ✓ / D2 바닐라 → 전 Task 의존성 0 ✓ / D3 키노트 라이트 → Task3 ✓
- D4 시뮬레이터 2종 → Task9(여정)·Task10(사다리) ✓ / D5 수동 디자인 md→슬라이드 → Task1·2(md), Task6~8(슬라이드) ✓
- D6 오프라인 → Task11 Step3 ✓
- 6부 콘텐츠 → Task1·2(원고) + Task6·7·8(슬라이드) ✓
- 마스터 지도 공유 노드 정의 → Task5 `map-data.js`, 여정 시뮬레이터 재사용 → Task9 ✓
- 시각자료 5종: 마스터지도(Task5), 사다리(Task10), GitOps reconcile(2-4 슬라이드 Task7), Flutter 파이프라인(4부 Task8), 환경분리(5부 Task8) ✓

**2. Placeholder 스캔:** 코드 단계는 전부 완전한 코드. md/슬라이드 콘텐츠 단계는 구체 비트·수용기준 명시(자유 산문 분량은 의도적으로 SSOT인 md에 위임). TBD/TODO 없음.

**3. 타입 일관성:** `MAP_NODES`(id/icon/label/caption), `renderMap(container,currentId)`, `JourneyModel.path(sgOpen)→{reached,blocked}`, `mountJourney(container)`, `ladderState(stage)→{me,platform}`, `renderLadder(container)` — Task 간 시그니처 일치 확인 완료.
