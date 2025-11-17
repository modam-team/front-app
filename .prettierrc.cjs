module.exports = {
  // 한 줄 최대 길이
  printWidth: 80,

  // 큰따옴표 사용
  singleQuote: false,

  // 항상 세미콜론 사용
  semi: true,

  // 마지막 콤마 허용
  trailingComma: "all",

  // 들여쓰기 2 스페이스
  tabWidth: 2,

  // 탭 대신 스페이스
  useTabs: false,

  // 화살표 함수 파라미터 괄호 항상 사용
  arrowParens: "always",

  // { a: 1 } 형태에서 띄어쓰기 유지
  bracketSpacing: true,

  // OS별 줄바꿈 자동 처리
  endOfLine: "auto",

  // JSX props 한 줄에 하나씩
  singleAttributePerLine: true,

  // import 그룹 간 빈 줄 추가
  importOrderSeparation: true,

  // import 내부 멤버 정렬
  importOrderSortSpecifiers: true,

  // import 정렬 플러그인
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};
