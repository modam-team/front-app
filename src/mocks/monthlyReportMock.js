export const monthlyReportMock = {
  summary: {
    year: 2025,
    month: 12,
    title: "피곤한 탐험가",
    description: "피곤한 탐험가형은 주로 이동중에 소설/문학을 읽는 사람이에요.",
    percent: 3,
    isEmpty: false,
  },
  monthlyStatus: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: [2, 4, 5, 3, 6, 8, 5, 4, 7, 9, 6, 1][i] ?? 0,
  })),
  reviewKeywords: [
    { word: "재밌음", weight: 4 },
    { word: "흥미진진", weight: 3 },
    { word: "빠른전개", weight: 2 },
    { word: "여운", weight: 2 },
  ],
  genreDistribution: [
    { name: "소설/문학", count: 6, ratio: 0.6 },
    { name: "인문/사회/정치/법", count: 4, ratio: 0.4 },
  ],
  readingCountsByWeekday: [
    {
      weekday: 0,
      label: "일",
      slots: { morning: 1, afternoon: 0, evening: 1 },
    },
    {
      weekday: 1,
      label: "월",
      slots: { morning: 0, afternoon: 1, evening: 2 },
    },
    {
      weekday: 2,
      label: "화",
      slots: { morning: 1, afternoon: 1, evening: 0 },
    },
    {
      weekday: 3,
      label: "수",
      slots: { morning: 0, afternoon: 0, evening: 2 },
    },
    {
      weekday: 4,
      label: "목",
      slots: { morning: 0, afternoon: 1, evening: 1 },
    },
    {
      weekday: 5,
      label: "금",
      slots: { morning: 0, afternoon: 0, evening: 1 },
    },
    {
      weekday: 6,
      label: "토",
      slots: { morning: 1, afternoon: 2, evening: 1 },
    },
  ],
  readingPlaces: [
    { label: "이동중", ratio: 0.5 },
    { label: "집", ratio: 0.3 },
    { label: "카페", ratio: 0.2 },
  ],
};
