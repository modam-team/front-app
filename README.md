<img width="1190" height="1684" alt="image" src="https://github.com/user-attachments/assets/2c7677b7-40bb-4cc7-b90d-18d6b25afd54" />

<br/><br/>

## 📖 프로젝트 소개 - 기록을 통해 나를 발견하는 공간, Modam
- Modam은 **기록이 쌓일수록 나를 더 잘 알게 되는 독서 기록 서비스**입니다.<br/>
사용자는 읽은 책과 감상을 자유롭게 기록하며,<br/>
그 과정에서 자연스럽게 자신의 독서 취향과 패턴을 마주하게 됩니다.<br/><br/>
- Modam은 사용자의 독서 데이터를 기반으로<br/>
**월별 리포트**와 다양한 시각적 요소를 제공하여,<br/>
스스로의 독서 흐름을 한눈에 돌아볼 수 있도록 돕습니다.<br/><br/>
- 단순히 읽은 책의 수를 기록하는 것을 넘어,<br/>
**독서가 언제, 어떤 방식으로 나에게 의미 있었는지**를 되짚게 하며,<br/>
지속적인 기록을 이어갈 수 있는 동기를 제공합니다.<br/><br/>
- 일상의 독서가 부담이 아닌,<br/>
**나를 이해하는 하나의 과정**이 되도록 설계된 서비스입니다.
<br><br>

## 👥 Members
| [김소연](https://github.com/soyeon1806) | [손상준](https://github.com/sangjoonson) |
| --- | --- |
| <a href="https://github.com/soyeon1806"><img src="https://avatars.githubusercontent.com/u/102381857?v=4" width="100px;" alt=""/></a> | <a href="https://github.com/sangjoonson"><img src="https://avatars.githubusercontent.com/sangjoonson" width="100px;" alt=""/></a> |
| 홈<br>설정<br>리포트<br>온보딩<br>회원가입/로그인 | 홈<br>책장<br>리뷰<br>친구 추가<br> |


<br/><br/>

## 🛠 Tech Stack
### Frontend
![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
<br/>
![Zustand](https://img.shields.io/badge/zustand-FFB703?style=for-the-badge&logo=react&logoColor=000000)
![Axios](https://img.shields.io/badge/axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![AsyncStorage](https://img.shields.io/badge/AsyncStorage-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Expo SecureStore](https://img.shields.io/badge/Expo%20SecureStore-000000?style=for-the-badge&logo=expo&logoColor=white)
![React Navigation](https://img.shields.io/badge/react%20navigation-6B4EFF?style=for-the-badge&logo=react&logoColor=white)

### etc
![ESLint](https://img.shields.io/badge/eslint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Notion](https://img.shields.io/badge/Notion-%23000000.svg?style=for-the-badge&logo=notion&logoColor=white)
![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white)

<br/><br/>

## 🚀 실행 방법

1️⃣ 설치
프로젝트 클론 후 필요한 패키지를 설치합니다.

```bash
git clone https://github.com/modam-team/front-app.git
cd front-app
npm install
```
<br/>

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
<br/>

🧩 폴더 구조
```
front-app/
├── src/
│   ├── screens        # 화면 단위 페이지
│   ├── components     # 재사용 UI 컴포넌트
│   ├── navigation     # Stack / Tab 네비게이션
│   ├── apis           # 백엔드 API 통신 로직
│   ├── constants      # 상수 및 매핑 정의
│   ├── store          # 전역 상태 관리
│   ├── theme          # 디자인 토큰 (color, typography 등)
│   └── utils          # 공통 유틸 함수
│
├── assets             # 이미지, 아이콘, 캐릭터 SVG 등 정적 리소스
├── .github            # GitHub 설정 (Actions, 이슈 등)
└── App.js             # 앱 진입점
```
