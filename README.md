# Parkhyeonwoo – Graphic Archive (demo)

정적 사이트라 빌드 없이 그대로 배포돼요.

## 구조
- index.html : 페이지 전체 (CSS/JS 포함)
- data.js : 폴더별 작업물 목록 (이미지 경로, 가로, 세로)
- assets/<폴더>/ : 작업물 이미지
- assets/sea/ : 섬, 시계, 물고기 gif
- fonts/ : Comic Sans / Times 대체 폰트 (해당 폰트가 없는 기기용)

## 물고기 바꾸기
index.html의 FOLDERS(폴더 물고기), AMBIENT(배경 물고기)에서 파일·크기·위치를 바꿔요.

## 배포 (GitHub + Vercel, 무료)
1. GitHub에서 새 repository를 만들고 이 폴더 내용을 전부 올려요.
2. vercel.com에 GitHub 계정으로 로그인해요.
3. Add New > Project에서 방금 만든 repository를 Import해요.
4. Framework는 Other, 나머지는 기본값 그대로 Deploy를 눌러요.
5. 이후에는 GitHub에 push할 때마다 자동으로 다시 배포돼요.

(GitHub만 쓰고 싶으면 repository Settings > Pages에서 main 브랜치를 선택해도 돼요.)

## 작업물 바꾸기
assets/ 안의 이미지를 교체하고, data.js의 경로와 크기를 맞춰주세요.
