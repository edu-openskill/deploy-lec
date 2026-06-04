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

---

## 3부. 도메인 + HTTPS (20')

### [슬라이드] IP를 사람 주소로 — DNS A레코드
13.124.x.x → api.myapp.com. Route53/가비아에서 A레코드 등록.

### [슬라이드] 리버스 프록시는 왜 필요한가
브라우저는 80/443으로 옴 → Nginx가 받아 내부 8080으로 전달. 한 서버에 여러 앱도 가능.

### [슬라이드] HTTPS — 자물쇠 붙이기
TLS 인증서. Let's Encrypt(무료·자동갱신) vs AWS ACM. http→https 비교, "주의 요함" 경고.
> 🎤 https는 선택이 아니라 기본입니다. 앱 스토어도 평문 http를 막습니다.

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

---
---

# 심화 부록 · AWS 기준 Spring Boot 배포 완전 정리

## Docker · ECR · Kubernetes · EKS · GitOps · Argo CD 까지 한 번에

> 🎤 2부에서 **자동화 사다리(AWS EC2 → Railway → EKS → GitOps)**를 큰 그림으로 잡았습니다.
> 이 부록은 그 사다리의 **위쪽 세 칸(컨테이너 → EKS → GitOps)**을 실무 수준으로 깊게 풉니다.
> 강의 본편이 "왜/언제"였다면, 부록은 "**실제로 어떤 파일과 명령이 오가는가**"입니다.
> 입문 팀이라면 S0~S3까지만 읽어도 충분하고, S4 이후는 "회사 규모가 되면 이렇게 간다"는 지도입니다.

---

## S0. 사다리 다시 보기 — 이번엔 Docker/ECR까지 쪼개서

본편 2부의 4칸을, 컨테이너·이미지 저장소까지 넣어 5레벨로 더 잘게 나눠봅니다.

```text
레벨 1: JAR 파일을 서버에 올려 직접 실행        (2부 EC2 시뮬레이터의 그 7단계)
레벨 2: Docker 이미지로 만들어 실행            (실행 환경째로 포장)
레벨 3: ECS/Fargate 또는 Kubernetes로 컨테이너 운영
레벨 4: EKS로 AWS에서 Kubernetes 운영          (관리형 k8s)
레벨 5: GitOps로 Git commit만 하면 자동 배포    (Argo CD)
```

본편에서 쓴 **IaaS / PaaS / SaaS** 비유와 음식 비유를 한 줄로 잇습니다.

```text
JAR 배포      = 도시락 하나 들고 가서 먹기            (EC2 = 빈 원룸, IaaS)
Docker 배포   = 도시락 + 전자레인지 + 식기까지 세트로 포장
ECS 배포      = AWS가 도시락을 적당한 자리에서 실행
Kubernetes    = 대형 푸드코트 운영 시스템
EKS           = AWS가 관리해주는 푸드코트 운영 시스템   (관리형, 입주만)
GitOps        = 메뉴판(Git)만 바꾸면 주방이 자동으로 그대로 세팅
```

> 🎤 "올라갈수록 내 손은 비고, 대신 알아야 할 개념은 늘어난다." — 자동화 사다리 시뮬레이터에서 본 그 역설이 여기서도 똑같이 적용됩니다.

---

## S1. Spring Boot를 '서버에 올린다'의 두 형태 — JAR vs Docker

본편 2-0에서 본 `app.jar`을 두 가지로 올릴 수 있습니다.

### S1.1 JAR 배포

```bash
./gradlew clean bootJar          # 결과물: build/libs/app.jar
```
```powershell
.\gradlew clean bootJar          # Windows PowerShell
```
서버에서:
```bash
java -jar app.jar
```

이해하기 쉽지만 **서버에 Java가 미리 깔려 있어야 하고**(EC2 시뮬레이터의 3단계 "JDK 설치"), 서버마다 환경 차이에 영향을 받습니다. "내 컴에선 되는데"가 서버에서 재발하는 지점이 바로 여기예요(0부 회수).

### S1.2 Docker 배포 — 실행 환경째로 포장

```text
JAR 배포    = 도시락만 포장          → 식당(서버)에 전자레인지(java)가 있어야 함
Docker 배포 = 도시락 + 전자레인지 + 먹는 방법까지 함께 포장 → 식당에 아무것도 없어도 됨
```

`Dockerfile` 예시:
```dockerfile
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

빌드 & 로컬 실행:
```bash
./gradlew clean bootJar
docker build -t spring-api:1.0.0 .
docker run -p 8080:8080 spring-api:1.0.0
```

> 🎤 Docker의 진짜 가치는 "내 PC·테스트 서버·EKS Node에서 **완전히 똑같이** 실행된다"는 보장입니다. JDK 버전·OS 패키지 차이로 깨지는 일이 사라집니다.

---

## S2. ECR — 왜 필요한가 (내 이미지를 EKS가 가져가려면)

`docker build`로 만든 이미지는 **처음엔 내 컴퓨터 안에만** 있습니다.

```text
내 컴퓨터 Docker 이미지 목록
  - spring-api:1.0.0
```

EKS는 내 노트북 안을 들여다볼 수 없습니다. EKS가 이미지를 가져가려면 **접근 가능한 이미지 저장소**가 있어야 하고, AWS에서는 보통 **Amazon ECR**을 씁니다.

```text
ECR = Docker 이미지 창고
```

### S2.1 전체 흐름 (이 순서가 핵심)

```text
Spring Boot 코드
  ↓ ./gradlew clean bootJar
JAR 빌드
  ↓ docker build
Docker 이미지
  ↓ docker push          ← 여기서 이미지가 ECR로 올라간다
ECR에 이미지 push
  ↓
deployment.yaml 에 ECR 이미지 주소 작성
  ↓ kubectl apply         ← "이 ECR 이미지로 Pod 띄워라"라고 알려줄 뿐
EKS가 ECR 에서 이미지 pull
  ↓
Pod 실행
```

> ⚠️ **가장 흔한 오해**: `kubectl apply`가 이미지를 ECR에 올린다? **아니다.** ECR push(`docker push`)는 `kubectl apply` **전에 이미 끝나 있어야** 합니다. `kubectl apply`는 "이 ECR 주소의 이미지를 써서 Pod를 실행하라"고 **지시만** 하는 단계입니다.

### S2.2 ECR에 올리는 4단계 명령

```bash
# 1) 이미지 빌드 (아직 내 PC에만 있음)
docker build -t spring-api:1.0.0 .

# 2) ECR 로그인 (리전·계정 ID는 본인 것으로)
aws ecr get-login-password --region ap-northeast-2 \
  | docker login --username AWS --password-stdin \
    123456789012.dkr.ecr.ap-northeast-2.amazonaws.com

# 3) ECR 주소로 태그 변경
docker tag spring-api:1.0.0 \
  123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/spring-api:1.0.0

# 4) push
docker push \
  123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/spring-api:1.0.0
```

ECR Repository 주소 형태:
```text
123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/spring-api
└──계정 ID──┘            └──리전──┘                  └─리포지터리명─┘
```

### S2.3 ECR 없이도 되나?

됩니다 — `image:`에는 어떤 저장소든 올 수 있습니다(예: `image: nginx:latest` 는 Docker Hub에서 pull). 다만 **내가 만든 Spring Boot 이미지는 Docker Hub에 기본으로 없으니**, 어딘가에는 올려야 합니다.

```text
선택지: Amazon ECR · Docker Hub · GitHub Container Registry · Harbor
```
AWS EKS 기준에서 ECR을 고르는 이유 — IAM 권한 연동이 쉽고, EKS 노드가 pull하기 좋고, 네트워크·보안·비용·감사를 AWS 한곳에서 관리합니다.

---

## S3. Kubernetes 핵심 개념 6가지

처음엔 Spring Boot 서버 하나면 됩니다. 하지만 실무는 회원·주문·결제·알림·파일·관리자·AI… 서버가 늘어나고, 각각을 컨테이너로 만들면 곧바로 질문이 쏟아집니다.

```text
컨테이너가 죽으면 누가 다시 살리지?   서버를 3개로 늘리려면?
새 버전 배포 중 끊기면?              환경변수·비밀값은 어디서?
외부 접속은 어떻게 열지?             로그는 어디서?
```

이걸 **선언형으로** 풀어주는 시스템이 Kubernetes입니다. (2부 k8s 시뮬레이터에서 Pod 죽이기→self-heal로 체감한 그것)

| 개념 | 한 줄 정의 | 비유 |
|---|---|---|
| **Pod** | 컨테이너가 실제 실행되는 최소 단위 | 직원 한 명의 작업 공간 |
| **Deployment** | Pod를 몇 개 유지할지 관리(원하는 상태) | "직원 3명 상시 근무" 지시 |
| **Service** | 바뀌는 Pod들 앞의 **고정 내부 주소** | 직원은 바뀌어도 그대로인 고객센터 번호 |
| **Ingress** | 외부 HTTP/HTTPS를 내부 Service로 잇는 입구 | 백화점 정문 + 안내 데스크 |
| **ConfigMap** | 일반 설정값 저장소 | 사내 게시판의 운영 안내 |
| **Secret** | 민감 설정값 저장소 | 금고 (단, 완전한 금고는 아님) |

- **Deployment** `replicas: 3` → "Spring Boot Pod를 항상 3개 유지." Pod 하나가 죽으면 Kubernetes가 새로 하나를 띄웁니다 = **self-healing**(시뮬레이터에서 본 그 동작).
- **Service** — Pod는 죽었다 살아나며 IP가 바뀝니다. 그 앞에 `spring-api-service`라는 고정 이름을 둬서 "어느 Pod로든" 연결해 줍니다.
- **Ingress** — `https://api.example.com → Ingress → spring-api-service → Pods`. 3부의 "리버스 프록시/도메인/HTTPS"가 쿠버네티스에선 Ingress(+ALB)로 구현됩니다.
- **Secret** 주의 — Kubernetes Secret은 기본적으로 base64 인코딩일 뿐 암호화 금고가 아닙니다. 운영에선 **AWS Secrets Manager / Parameter Store / External Secrets Operator**를 함께 씁니다.

```text
ConfigMap 예: SPRING_PROFILES_ACTIVE=prod / APP_TIMEZONE=Asia/Seoul
Secret    예: DB_PASSWORD / JWT_SECRET / AWS_ACCESS_KEY
```

---

## S4. EKS — AWS 관리형 쿠버네티스

쿠버네티스를 직접 깔면 관리할 게 많습니다 — Control Plane·etcd·API Server·업그레이드·보안 패치·노드·네트워크 플러그인·인증/인가·로깅. **EKS는 이 Control Plane을 AWS가 관리**해 줍니다.

```text
직접 운영 = 건물을 직접 짓고 전기·수도·보안까지 관리
EKS      = AWS가 관리하는 건물에 입주해서 서비스만 운영
```

### S4.1 EKS 기준 최종 백엔드 배포 구조 (3부와 연결)

```text
사용자
  ↓
https://api.example.com
  ↓
Route 53            (DNS — 3부)
  ↓
ACM HTTPS 인증서     (TLS — 3부)
  ↓
AWS ALB             (Application Load Balancer)
  ↓
Kubernetes Ingress
  ↓
Kubernetes Service
  ↓
Spring Boot Pods
  ↓
RDS                 (관리형 DB)
```

> 🎤 1부 마스터 지도(앱→DNS→IP→방화벽→Nginx→JAR→DB)가 EKS 세계에선 이렇게 확장됩니다. Nginx 자리에 ALB+Ingress, 서버 자리에 Pod 여러 개, DB 자리에 RDS. **그림은 커졌지만 화살표의 의미는 똑같습니다.**

---

## S5. 일반 Kubernetes 배포 흐름 (사람이 직접 kubectl apply)

```text
[일반(직접) 배포]
Spring Boot 코드
  ↓ ./gradlew clean bootJar
  ↓ docker build
  ↓ docker push  → ECR
deployment.yaml 의 image 를 ECR 주소로 작성
  ↓
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
  ↓
EKS가 manifest 를 읽음 → Node가 ECR에서 pull → Pod 실행 → Service 연결 → Ingress/ALB가 외부 노출
```

사람이 직접 하는 일: **빌드 · 이미지 push · YAML 수정 · kubectl apply**.

### S5.1 deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-api
  namespace: prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: spring-api
  template:
    metadata:
      labels:
        app: spring-api
    spec:
      containers:
        - name: spring-api
          image: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/spring-api:1.0.0   # ← ECR 이미지 주소
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
```

### S5.2 service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-api-service
  namespace: prod
spec:
  selector:
    app: spring-api
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

### S5.3 ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spring-api-ingress
  namespace: prod
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  ingressClassName: alb
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: spring-api-service
                port:
                  number: 80
```

### S5.4 kubectl apply 한 줄이 클러스터 안에서 하는 일

```text
1. API Server가 Deployment 요청을 받음
2. Deployment Controller가 ReplicaSet 생성
3. ReplicaSet이 Pod 2개 생성 요청
4. 각 Node의 kubelet이 Pod 실행 준비
5. kubelet이 image 주소 확인
6. ECR에서 spring-api:1.0.0 이미지 pull
7. 컨테이너 실행
8. Pod Running
```

---

## S6. Deployment는 GitOps가 아니다 — '선언'과 'GitOps'의 차이

> 🎤 여기서 가장 헷갈리는 매듭을 풉니다. **Deployment ≠ GitOps.**

- **Deployment** = 쿠버네티스 **리소스 종류**(선언 파일).
- **GitOps** = Deployment 같은 선언 파일을 **Git에 두고**, Argo CD 같은 도구가 **Git 상태와 클러스터 상태를 계속 맞추는 운영 방식**.

즉 `deployment.yaml`은 GitOps의 **재료**일 뿐, 그 자체가 GitOps는 아닙니다.

### S6.1 쿠버네티스는 원래부터 '선언형'

```yaml
replicas: 3
image: spring-api:1.0.0
```
이건 "지금 당장 Pod 하나 만들어!"라는 **명령**이 아니라, "Pod가 **항상 3개 떠 있어야 해**"라는 **원하는 상태 선언**입니다. 쿠버네티스는 원하는 상태와 현재 상태를 비교해 맞춥니다.

```text
원하는 상태: Pod 3개  /  현재 상태: Pod 2개   → 하나 더 띄움 → 3개로 일치
```
하지만 **이것만으로는 GitOps가 아닙니다.** (선언형 ≠ GitOps)

### S6.2 GitOps는 어디서부터?

```text
deployment.yaml 작성             → 그냥 쿠버네티스 선언 파일
deployment.yaml 을 GitHub에 올림  → YAML을 Git으로 버전관리(아직 GitOps 아님)
─────────────────────────────────────────────────────────
Git의 YAML  ──감시──▶  Argo CD  ──비교/동기화──▶  실제 EKS 상태
   = 이 구조가 되어야 비로소 GitOps
```
핵심 한 줄: **"Git 저장소가 운영 환경의 정답이고, Argo CD가 그 정답에 맞춰 클러스터를 계속 고친다."**

---

## S7. GitOps 배포 흐름 + 저장소 분리

```text
[GitOps 배포]
개발자 코드 수정
  ↓ git push (App Repo)
GitHub Actions 실행
  ↓ ./gradlew clean bootJar → docker build → docker push (ECR, 태그=커밋해시)
Manifest Repo의 deployment.yaml image 태그 자동 수정 → git commit/push
  ↓
Argo CD가 Manifest Repo 변경 감지 → EKS에 sync
  ↓ EKS가 ECR에서 새 이미지 pull → Pod 교체
```

사람이 직접 하는 일은 단 하나 — **코드 수정 후 `git push`**. 빌드·이미지 push·YAML 태그 수정·EKS 반영은 전부 자동.

### S7.1 왜 저장소를 둘로 나누나

```text
spring-api-repo            (App Repository)      ── Spring Boot 소스코드 + Dockerfile + CI(.github/workflows)
spring-api-manifest-repo   (Manifest Repository) ── deployment.yaml / service.yaml / ingress.yaml 만
```
- **App Repo**: 개발자가 코드를 push → CI가 이미지 빌드·ECR push.
- **Manifest Repo**: 쿠버네티스 선언 파일만. **Argo CD가 바라보는 곳은 여기.**
- 분리 이유 — 배포(무엇을 어떤 버전으로 띄울지)의 이력을 코드 이력과 분리해 깔끔히 관리하고, 권한도 따로 줄 수 있습니다.

```text
spring-api-manifest-repo/
  apps/spring-api/prod/
    deployment.yaml
    service.yaml
    ingress.yaml
```

---

## S8. Argo CD — Git을 정답으로 삼는 감리자

Argo CD는 쿠버네티스용 GitOps 도구입니다. Git 저장소를 계속 바라보다가, **Git에 적힌 상태 ≠ 실제 클러스터 상태**면 Git 쪽으로 맞춥니다.

```text
Git Repository ──▶ Argo CD ──▶ Kubernetes Cluster
예) Git: replicas 3 / image 1.0.1   vs   EKS: replicas 2 / image 1.0.0
    → Argo CD가 차이를 감지 → EKS를 replicas 3 / image 1.0.1 로 맞춤
```

### S8.1 GitOps의 핵심 파일 — Argo CD `Application`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: spring-api-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/spring-api-manifest-repo.git
    targetRevision: main
    path: apps/spring-api/prod          # ← 이 폴더가 운영 배포의 '정답'
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true        # Git에서 지운 리소스는 클러스터에서도 삭제
      selfHeal: true     # 누가 클러스터를 손으로 바꾸면 Git 상태로 되돌림
    syncOptions:
      - CreateNamespace=true
```

> 🎤 `selfHeal: true`가 GitOps의 정수입니다. 누가 새벽에 `kubectl edit`로 손대도, Argo CD가 "Git이 정답"이라며 원상복구합니다. **인프라의 진실(source of truth)이 클러스터가 아니라 Git으로 이동**한 것이죠.

### S8.2 Argo CD가 **하지 않는** 일

```text
✗ Docker 이미지 빌드 안 함
✗ ECR push 안 함
✓ Git manifest 를 보고 EKS에 sync 만 함
```

### S8.3 역할 분담 (이 표 하나로 정리)

| 도구 | 역할 |
|---|---|
| GitHub Actions | 빌드·테스트·Docker 이미지 생성·**ECR push**·manifest 태그 수정 |
| ECR | Docker 이미지 저장소 |
| **Argo CD** | Git manifest 감시 → **EKS 동기화(CD)** |
| EKS | Pod 실행 |
| kubelet | ECR에서 이미지 pull |
| Deployment | 어떤 이미지를 몇 개 띄울지 **선언** |

---

## S9. CI는 GitHub Actions가 — 빌드·ECR push·manifest 갱신

App Repo의 워크플로 예시(빌드 → ECR push → Manifest Repo의 image 태그 수정):

```yaml
name: Build and Update Manifest
on:
  push:
    branches: [ main ]
env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: spring-api
  IMAGE_TAG: ${{ github.sha }}        # 이미지 태그 = 커밋 해시 (추적성)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${{ env.AWS_REGION }}
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-ecr-role
      - uses: aws-actions/amazon-ecr-login@v2
      - name: Build & tag & push
        run: |
          docker build -t $ECR_REPOSITORY:$IMAGE_TAG .
          docker tag  $ECR_REPOSITORY:$IMAGE_TAG 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
          docker push 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
      - name: Checkout manifest repo
        uses: actions/checkout@v4
        with:
          repository: your-org/spring-api-manifest-repo
          token: ${{ secrets.MANIFEST_REPO_TOKEN }}
          path: manifest-repo
      - name: Update image tag & commit
        run: |
          cd manifest-repo/apps/spring-api/prod
          sed -i "s|image: .*|image: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/spring-api:${IMAGE_TAG}|g" deployment.yaml
          git config user.name  "github-actions"
          git config user.email "github-actions@github.com"
          git commit -am "deploy: spring-api ${IMAGE_TAG}"
          git push origin main          # ← 이 push를 Argo CD가 감지해서 EKS에 반영
```

> 🎤 여기서 **GitHub Actions는 EKS에 직접 배포하지 않습니다.** Actions = "빌드+ECR push+manifest 수정"(CI), Argo CD = "manifest를 보고 EKS 반영"(CD). **CI와 CD가 깔끔히 분리**된 게 GitOps의 미덕입니다.

---

## S10. 직접 배포 vs GitOps — 한 장 비교 + 흔한 오해 4가지

```text
[직접 배포]                              [GitOps 배포]
개발자                                   개발자
 ↓ docker build → ECR push                ↓ git push
 ↓ kubectl apply (개발자 PC에서)           ↓ GitHub Actions → ECR push
 ↓                                        ↓ Manifest Repo 수정
EKS 변경                                  ↓ Argo CD → EKS sync
                                          EKS 변경
문제: 누가 했는지 추적 약함 /              장점: 모든 변경이 Git에 기록 /
개발자 PC에 클러스터 권한 필요 /            리뷰 후 배포 / 롤백 = git revert /
Git과 클러스터가 어긋날 수 있음 /          클러스터 직접 접근 권한 최소화 /
롤백이 애매함                             Argo CD가 상태 차이를 계속 감시
```

**흔한 오해 4가지**

1. **`kubectl apply`가 ECR에 이미지를 올린다?** ✗ — 올리는 건 `docker push`. apply는 "이 ECR 이미지로 Pod 띄워라"는 지시일 뿐.
2. **`kubectl apply`만 하면 내 로컬 이미지가 EKS로 간다?** ✗ — 먼저 ECR/Docker Hub/GHCR 같은 저장소에 올라가 있어야 EKS가 pull할 수 있음.
3. **Deployment가 GitOps다?** ✗ — Deployment는 쿠버네티스 리소스. GitOps는 그 선언을 Git에 두고 Argo CD가 계속 맞추는 **운영 방식**.
4. **Argo CD가 이미지를 빌드한다?** ✗ — 빌드·ECR push는 GitHub Actions(CI) 몫. Argo CD는 manifest를 보고 sync(CD)만.

---

## S11. 한 문장 정리 + 비유 총정리

> 🎤 수업에서 이 두 블록만 외워가도 됩니다.

```text
ECR은 Docker 이미지 창고이고,
deployment.yaml은 그 이미지의 주소가 적힌 배포 설계도이고,
kubectl apply는 설계도를 쿠버네티스에 제출하는 명령이고,
EKS는 설계도를 보고 ECR에서 이미지를 가져와 Pod로 실행한다.
```
```text
쿠버네티스의 핵심 = '선언'(원하는 상태를 적는다)
GitOps의 핵심     = 그 선언의 '출처'를 Git으로 고정한다
Argo CD의 핵심    = Git의 선언과 클러스터의 실제 상태를 계속 맞춘다
```

**비유 총정리**
```text
Docker Image = 포장된 음식                  ECR          = 음식 창고
Deployment   = 몇 인분 준비할지 적은 지시서   Service      = 고객센터 전화번호
Ingress      = 백화점 정문 + 안내 데스크      kubectl apply= 점장이 직접 지시서를 현장에 전달
EKS          = AWS가 관리해주는 푸드코트       Argo CD      = 본사 지시서대로 현장을 계속 맞추는 감리자
Git          = 본사 지시서 보관소             GitOps       = 본사 지시서가 운영의 '정답'이 되는 방식
```

## S12. 최종 — Spring Boot를 EKS에 올릴 때 반드시 구분할 5단계

```text
1. 애플리케이션 빌드      (./gradlew clean bootJar)
2. Docker 이미지 생성     (docker build)
3. ECR에 이미지 업로드    (docker push)        ← EKS가 실행할 이미지는 미리 여기 올라가 있어야 함
4. 쿠버네티스 YAML 작성   (deployment/service/ingress)
5. EKS에 반영
      직접 배포  = 사람이 kubectl apply 로 클러스터를 바꾼다
      GitOps    = Git을 바꾸면 Argo CD가 클러스터를 바꾼다
```

> 🎤 마무리 한 줄 — **"빈 우분투에 손으로 7단계(EC2 시뮬레이터) → git push 한 번(Railway) → 선언만 하면 알아서 유지(쿠버네티스) → Git이 곧 운영의 정답(GitOps)." 같은 app.jar 하나가 사다리를 따라 올라갈수록, 내 손은 비고 시스템이 채웁니다.**
