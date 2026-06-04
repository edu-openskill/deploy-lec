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
