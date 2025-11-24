export async function fetchMonthlyReport({ year, month }) {
  // 나중에 실제로 받은 응답으로 raw 부분은 교체할 예정 !!
  const raw = {
    year,
    month,

    // 선택한 년, 월에 읽은 전체 책 권수
    genre_total_count: 100,

    // 상단 캐릭터 요약 섹션
    persona: {
      title: "피곤한 탐험가",
      description:
        "피곤한 탐험가형은 주로 이동시간에 판타지를 읽는 사람이에요.",
      percent: 3,
    },

    // 연간 독서 통계
    monthly_read_status: [
      { month: 1, count: 2 },
      { month: 2, count: 4 },
      { month: 3, count: 5 },
      { month: 4, count: 3 },
      { month: 5, count: 6 },
      { month: 6, count: 8 },
      { month: 7, count: 5 },
      { month: 8, count: 4 },
      { month: 9, count: 7 },
      { month: 10, count: 9 },
      { month: 11, count: 6 },
      { month: 12, count: 3 },
    ],

    // 리뷰 키워드 분석
    review_keywords: [
      { word: "사랑", weight: 1 },
      { word: "고전", weight: 2 },
      { word: "관계", weight: 2 },
      { word: "판타지", weight: 4 },
      { word: "에세이", weight: 2 },
      { word: "명작", weight: 3 },
    ],

    // 장르 취향 분석
    genre_distribution: [
      { genre: "판타지", count: 40 },
      { genre: "에세이", count: 25 },
      { genre: "스릴러", count: 20 },
      { genre: "명작", count: 15 },
    ],

    // 요일 및 시간대 별 독서 횟수 분석
    reading_counts_by_weekday: [
      {
        weekday: 1,
        label: "월",
        counts: { morning: 1, afternoon: 0, evening: 3 },
      },
      {
        weekday: 2,
        label: "화",
        counts: { morning: 0, afternoon: 2, evening: 2 },
      },
      {
        weekday: 3,
        label: "수",
        counts: { morning: 0, afternoon: 1, evening: 3 },
      },
      {
        weekday: 4,
        label: "목",
        counts: { morning: 2, afternoon: 1, evening: 1 },
      },
      {
        weekday: 5,
        label: "금",
        counts: { morning: 0, afternoon: 2, evening: 4 },
      },
      {
        weekday: 6,
        label: "토",
        counts: { morning: 2, afternoon: 3, evening: 4 },
      },
      {
        weekday: 0,
        label: "일",
        counts: { morning: 3, afternoon: 1, evening: 2 },
      },
    ],

    // 독서 장소 분석
    reading_places: [
      { place: "이동중", ratio: 0.4 },
      { place: "집", ratio: 0.3 },
      { place: "카페", ratio: 0.2 },
      { place: "도서관", ratio: 0.1 },
    ],
  };

  // 선택한 년, 월에 읽은 전체 책 권수
  const genreTotalCount = raw.genre_total_count;

  const adapted = {
    // 상단 캐릭터 요약 섹션
    summary: {
      year: raw.year,
      month: raw.month,
      title: raw.persona.title,
      description: raw.persona.description,
      percent: raw.persona.percent,
    },

    //  연간 독서 통계
    monthlyStatus: raw.monthly_read_status.map((item) => ({
      month: item.month,
      count: item.count,
    })),

    // 리뷰 키워드 분석
    reviewKeywords: raw.review_keywords.map((k) => ({
      word: k.word,
      weight: k.weight,
    })),

    // 장르 취향 분석
    genreDistribution: raw.genre_distribution.map((g) => ({
      name: g.genre,
      count: g.count,
      ratio: genreTotalCount ? g.count / genreTotalCount : 0,
    })),

    // 요일 및 시간대 별 독서 횟수 분석
    readingCountsByWeekday: raw.reading_counts_by_weekday.map((d) => ({
      weekday: d.weekday,
      label: d.label,
      slots: d.counts,
    })),

    // 독서 장소 분석
    readingPlaces: raw.reading_places.map((p) => ({
      label: p.place,
      ratio: p.ratio,
    })),
  };

  return adapted;
}
