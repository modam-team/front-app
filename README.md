# Member
| [김소연](https://github.com/soyeon1806) | [손상준](https://github.com/sangjoonson) |
| --- | --- |
| <a href="https://github.com/soyeon1806"><img src="https://avatars.githubusercontent.com/u/102381857?v=4" width="100px;" alt=""/></a> | <a href="https://github.com/sangjoonson"><img src="https://avatars.githubusercontent.com/sangjoonson" width="100px;" alt=""/></a> |
| 회원가입/로그인<br>온보딩<br>리포트<br>설정 | 책장<br>리뷰<br>친구 추가<br> |

<br><br>

# 🚀 실행 방법

1️⃣ 설치
프로젝트 클론 후 필요한 패키지를 설치합니다.

```bash
git clone https://github.com/modam-team/front-app.git
cd front-app
npm install
```
<br>

2️⃣ 실행 (개발 모드)
```
npx expo start
iOS 시뮬레이터 → i

Android 에뮬레이터 → a

웹 브라우저 → w

실제 기기 테스트 → QR 코드 스캔 (Expo Go 앱 이용)

⚙️ 네트워크 이슈 있을 땐
npx expo start --tunnel 명령으로 실행하면 외부에서도 접속 가능합니다.
```
<br>

🧩 폴더 구조
```
front-app/
├── App.js                 # 앱 진입점
├── src/
│   ├── screens/           # 주요 화면(Home, Bookshelf, Report 등)
│   ├── components/        # 재사용 UI 컴포넌트
│   ├── navigation/        # BottomTabs / Stack 설정
│   ├── theme/             # 색상, 폰트 등 공통 스타일
│   └── assets/            # 이미지, 폰트 등 정적 리소스
└── package.json
```
