# Don't ALT-F4 — game website

승인한 흑백·빨강 시안을 구현한 정적 사이트입니다. 프레임워크, API 키, 서버 설치가 필요 없습니다.

## 실행과 조작

압축을 모두 해제하고 dist/index.html을 Edge 또는 Chrome으로 여세요. 한 파일로 묶은 Dont-ALT-F4.html도 별도로 제공합니다.
화면 ALT 버튼은 시계 방향 회전, F4는 전진, Undo/Restart는 되돌리기/초기화입니다.
플레이어 도형과 내부 세로 흰 선은 고정되고 빨간 화살표만 방향을 바꿉니다. 3번의 행동이 한 턴을 완성합니다.
퍼즐에 포커스를 둔 뒤 A / F / Z / R 키로도 조작할 수 있습니다.
실제 Alt+F4는 OS 단축키이므로 누르지 마세요. 사이트에서는 가로채지 않습니다.
예제는 전체 게임이 아닌 조작 미리보기입니다. 예제에서 경로 밖 이동 시도도 한 행동으로 집계하며, Undo는 입력 표시까지 복원합니다. 적·특수 타일·도전과제 규칙은 포함하지 않습니다.

## GitHub Pages

1. 별도 저장소에 이 폴더 파일과 .github/workflows/pages.yml을 업로드하세요.
2. Settings → Pages → Source를 GitHub Actions로 선택하세요.
3. main에 push하면 엔진 테스트 후 dist/가 배포됩니다. 기본 브랜치가 다르면 workflow의 main을 수정하세요.
4. 기존 포트폴리오·CNAME·Cloudflare DNS는 자동으로 바꾸지 않습니다. 별도 도메인은 GitHub Pages Custom domain과 Cloudflare DNS에서 설정하세요.

모든 자산은 상대 경로이므로 프로젝트 경로에서도 동작합니다.
이 ZIP에는 Git 이력이나 Sites 인증 정보를 포함하지 않습니다.
공식 문서: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 수정과 테스트

dist/index.html: 문구·링크. style.css: 디자인. puzzle.js: 예제 상태·경로. app.js: 조작·갤러리.
dist/assets/: 폰트·이미지. tests/puzzle.test.cjs: 엔진 테스트.
실행: node --test tests/*.test.cjs
오프라인 단일 파일 생성: node scripts/build-offline.cjs 원하는경로.html

## 자산

게임과 스크린샷: Don't ALT-F4 / Blanc Studio. 사용자가 제공한 Steam 페이지의 공개 스크린샷을 사용했습니다.
하드웨어 테두리: 승인 시안에서 ImageGen으로 생성한 배경 자산.
폰트: Silkscreen / SIL Open Font License 1.1. dist/assets/FONT-LICENSE.txt 참조.


## Steam 커뮤니티 연동 (60초)

- 공지: Steam 공식 개발자 공지 피드 최신 3개. 언론 뉴스는 제외합니다.
- 리뷰: 최신 6개, 긍정/부정 모두 표시. Steam 개발자 답변도 함께 표시합니다.
- 질문: Steam Discussions 링크입니다. 질문/댓글 자동 수집은 포함하지 않습니다.
- 화면이 보이는 동안 60초마다 확인합니다. 탭이 숨겨지면 중단합니다. 빈 데이터와 접속 실패를 구분합니다.
- Worker는 60초 캐시, 동시 요청 병합, 실패 시 5분 대기 및 마지막 성공 데이터 유지를 제공합니다. 캐시 보관은 최대 24시간이며 퇴거/재시작되면 이전 데이터가 없을 수 있습니다.
- Cloudflare Cache API는 지역별로 분리됩니다. 분당 2회/하루 2,880회는 한 캐시 위치의 연속 조회 기준 예시이며 전 세계 총량의 상한이 아닙니다. 정확한 전역 제한이 필요하면 Durable Object 같은 중앙 조정이 추가로 필요합니다. 방문이 없으면 조회하지 않습니다.
- Steam 게시 반영 지연과 캐시 때문에 60초 이내 표시를 보장하지 않습니다.

### GitHub Pages + 본인 Cloudflare 계정에 연결

1. Cloudflare에서 worker/community.mjs를 Worker로 배포합니다. Wrangler 사용 시 worker 폴더에서 npx wrangler deploy 실행. 설정은 worker/wrangler.jsonc 입니다. Cloudflare 계정 인증은 별도로 필요합니다.
2. ALLOWED_ORIGINS에 홈페이지의 정확한 출처(https + 도메인, 경로 제외)를 설정합니다.
3. dist/community-config.js의 COMMUNITY_API_URL을 배포된 Worker의 https URL + /api/community로 변경합니다.
4. GitHub Pages를 배포합니다. 기존 Actions는 정적 dist를 계속 배포합니다.
5. 필요 시 STEAM_API_KEY를 Worker secret으로 설정합니다. 브라우저 코드나 저장소에는 넣지 않습니다. 공개 리뷰 조회는 공식 문서 기준 키 없이 가능하며 게시자 키는 높은 요청 한도에 사용합니다.

### 현재 Sites 미리보기

node scripts/build-hosted.mjs는 정적 자산과 API를 단일 Worker dist/server/index.js로 묶습니다. Sites는 기존 프로젝트와 비공개 접근 범위를 유지합니다. GitHub Pages와 달리 동일 출처 /api/community로 연결하므로 별도 API URL 설정이 필요 없습니다.

공식 문서: https://partner.steamgames.com/doc/webapi/ISteamNews / https://partner.steamgames.com/doc/webapi/IUserReviewsService / https://developers.cloudflare.com/workers/runtime-apis/cache/
