# 망도노트 소스 (Claude 유지보수용)

배포 파일(루트 index.html, sw.js, version.json)은 이 소스를 빌드한 결과입니다.

## 빌드
1. 작업 폴더에 이 src 내용을 복사 (head.html, script.js, parser.js, pwa_snippet.js, sw_template.js, VERSION, build.py)
2. `build.py`의 `sp` 경로를 작업 폴더로 바꾸고 그 아래에
   - `kr-sub.ttf` (이 폴더에 있음)
   - `libs/node_modules/` : `npm i pdfjs-dist@3.11.174 pdf-lib@1.17.1 @pdf-lib/fontkit@1.1.1`
3. `VERSION` 올리고 `python3 build.py` → `pwa/` 의 index.html, sw.js, version.json 을 저장소 루트에 복사해 push
4. 회귀 테스트: `tests/t13.js` 등 (Playwright, 잠금 비밀번호 입력 후 진행, `LANG=C.UTF-8`)

비밀번호는 솔트 SHA-256 해시로만 들어 있음. 평문은 절대 커밋하지 않음.
