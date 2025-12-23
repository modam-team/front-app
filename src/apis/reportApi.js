import { client } from "@apis/clientApi";
import { PLACE_MOOD_MAP } from "@constants/placeMoodMap";
import { READING_TENDENCY_MAP } from "@constants/readingTendencyMap";

const USE_REPORT_MOCK = process.env.EXPO_PUBLIC_USE_REPORT_MOCK === "true";

export const reportMonthlyApiMock = {
  success: true,
  error: null,
  responseDto: {
    manyPlace: "MOVING",
    readingTendency: "몰입·공감형",
    data: {
      2024: {
        11: [
          {
            readAt: "2024-11-03T09:20:00",
            readingPlace: "HOME",
            category: "소설/문학",
            hashtags: ["잔잔함", "여운"],
          },
          {
            readAt: "2024-11-18T22:10:00",
            readingPlace: "CAFE",
            category: "에세이",
            hashtags: ["공감", "힐링"],
          },
        ],
        12: [
          {
            readAt: "2024-12-01T14:30:00",
            readingPlace: "LIBRARY",
            category: "인문/사회/정치/법",
            hashtags: ["집중", "사색"],
          },
        ],
      },

      2025: {
        1: [
          {
            readAt: "2025-01-05T08:40:00",
            readingPlace: "HOME",
            category: "자기계발",
            hashtags: ["동기부여", "정리"],
          },
          {
            readAt: "2025-01-21T19:10:00",
            readingPlace: "CAFE",
            category: "소설/문학",
            hashtags: ["몰입", "재미"],
          },
        ],

        6: [
          {
            readAt: "2025-06-02T07:55:00",
            readingPlace: "MOVING",
            category: "소설/문학",
            hashtags: ["속도감"],
          },
          {
            readAt: "2025-06-15T18:30:00",
            readingPlace: "MOVING",
            category: "인문/사회/정치/법",
            hashtags: ["사고확장"],
          },
          {
            readAt: "2025-06-15T20:30:00",
            readingPlace: "MOVING",
            category: "인문/사회/정치/법",
            hashtags: ["사고확장"],
          },
          {
            readAt: "2025-06-28T23:10:00",
            readingPlace: "HOME",
            category: "에세이",
            hashtags: ["위로"],
          },
        ],

        12: [
          {
            readAt: "2025-12-11T19:14:20",
            readingPlace: "MOVING",
            category: "소설/문학",
            hashtags: ["재밌음", "흥미진진", "빠른전개"],
          },
          {
            readAt: "2025-12-10T21:40:00",
            readingPlace: "MOVING",
            category: "인문/사회/정치/법",
            hashtags: ["여운", "몰입"],
          },
          {
            readAt: "2025-12-22T10:05:00",
            readingPlace: "CAFE",
            category: "자기계발",
            hashtags: ["정리", "성장"],
          },
          {
            readAt: "2025-12-03T08:10:00",
            readingPlace: "HOME",
            category: "경제/경영",
            hashtags: ["투자", "인사이트"],
          },
          {
            readAt: "2025-12-05T23:20:00",
            readingPlace: "CAFE",
            category: "과학/기술",
            hashtags: ["신기함", "호기심", "설렘"],
          },
          {
            readAt: "2025-12-07T12:40:00",
            readingPlace: "LIBRARY",
            category: "예술/대중문화",
            hashtags: ["감성", "영감"],
          },
          {
            readAt: "2025-12-15T17:35:00",
            readingPlace: "MOVING",
            category: "건강/취미",
            hashtags: ["루틴", "힐링"],
          },
          {
            readAt: "2025-12-15T18:35:00",
            readingPlace: "MOVING",
            category: "건강/취미",
            hashtags: ["루틴", "힐링"],
          },
          {
            readAt: "2025-12-18T09:50:00",
            readingPlace: "HOME",
            category: "여행",
            hashtags: ["설렘", "계획"],
          },
        ],
      },
    },
  },
};

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

const PLACE_LABEL = {
  HOME: "집",
  CAFE: "카페",
  LIBRARY: "도서관",
  MOVING: "이동중",
};

function slotFromHour(h) {
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// 을 or 를 선택하기
function hasFinalConsonant(word = "") {
  if (!word) return false;
  const last = word[word.length - 1];
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 범위만 체크할 수 있도록 !
  return (code - 0xac00) % 28 !== 0;
}

function objParticle(word = "") {
  return hasFinalConsonant(word) ? "을" : "를";
}

// 에 or 에서 선택하기
function locParticle(placeLabel = "") {
  if (placeLabel === "이동중") return "에";
  return "에서";
}

// 백엔드 수정 전까지 임시로 500일 때도 화면 테스트 가능하도록 처리해뒀습니당
function makeEmptyReport({ year, month }) {
  return {
    summary: {
      year,
      month,
      title: "아직 측정되지 않았어요",
      description: "어떤 캐릭터가 나오실 지 궁금해요!",
      percent: 0,
      isEmpty: true,
    },
    monthlyStatus: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
    })),
    reviewKeywords: [],
    genreDistribution: [],
    readingCountsByWeekday: Array.from({ length: 7 }, (_, w) => ({
      weekday: w,
      label: WEEKDAY_LABEL[w],
      slots: { morning: 0, afternoon: 0, evening: 0 },
    })),
    readingPlaces: [],
  };
}

export async function fetchMonthlyReport({ year, month }) {
  try {
    const body = USE_REPORT_MOCK
      ? reportMonthlyApiMock
      : (await client.get("/api/report/monthly")).data;

    // 임시로 success = false 거나 responseDto가 null이어도 throw하지 않고 빈 레포트가 보이도록 해뒀습니당
    if (!body?.success || !body?.responseDto) {
      return makeEmptyReport({ year, month });
    }

    const { manyPlace, readingTendency, data } = body.responseDto;

    const yearKey = String(year);
    const monthKey = String(month);

    // 전체 기록이 있는지 먼저 판단하도록
    const hasAnyRecord = Object.values(data ?? {}).some((yearMap) =>
      Object.values(yearMap ?? {}).some(
        (monthList) => Array.isArray(monthList) && monthList.length > 0,
      ),
    );

    // 신규 유저인 경우 empty 처리
    if (!hasAnyRecord) {
      return makeEmptyReport({ year, month });
    }

    const yearMap = data?.[yearKey] ?? {};
    const records = yearMap?.[monthKey] ?? [];
    const total = Array.isArray(records) ? records.length : 0;

    // 1) 연간 월별 카운트 (해당 연도에 있는 달만 length로)
    const monthlyStatus = Array.from({ length: 12 }, (_, i) => {
      const mKey = String(i + 1);
      const list = yearMap?.[mKey] ?? [];
      return { month: i + 1, count: Array.isArray(list) ? list.length : 0 };
    });

    // 2) 해시태그 Top 10
    const hashtagCount = new Map();
    for (const r of records) {
      const tags = r?.hashtags;
      if (!Array.isArray(tags)) continue;
      for (const t of tags) {
        if (!t) continue;
        hashtagCount.set(t, (hashtagCount.get(t) ?? 0) + 1);
      }
    }
    const reviewKeywords = Array.from(hashtagCount.entries())
      .map(([word, weight]) => ({ word, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    // 3) 카테고리(장르) 분포
    const categoryCount = new Map();
    for (const r of records) {
      const c = r?.category ?? "기타";
      categoryCount.set(c, (categoryCount.get(c) ?? 0) + 1);
    }
    const genreDistribution = Array.from(categoryCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        ratio: total ? count / total : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 4) 요일 + 시간대
    const readingCountsByWeekday = Array.from({ length: 7 }, (_, w) => ({
      weekday: w,
      label: WEEKDAY_LABEL[w],
      slots: { morning: 0, afternoon: 0, evening: 0 },
    }));

    for (const r of records) {
      const dt = r?.readAt ? new Date(r.readAt) : null;
      if (!dt || isNaN(dt.getTime())) continue;

      const w = dt.getDay();
      const slot = slotFromHour(dt.getHours());
      readingCountsByWeekday[w].slots[slot] += 1;
    }

    // 5) 장소 비율
    const placeCount = new Map();
    for (const r of records) {
      const p = r?.readingPlace ?? "UNKNOWN";
      placeCount.set(p, (placeCount.get(p) ?? 0) + 1);
    }

    const readingPlaces = Array.from(placeCount.entries())
      .map(([place, count]) => ({
        label: PLACE_LABEL[place] ?? place,
        ratio: total ? count / total : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // 6) Summary 구성
    const placeLabel = PLACE_LABEL[manyPlace] ?? manyPlace;

    // 캐릭터 이름
    const rawTendency = readingTendency;
    const characterName = READING_TENDENCY_MAP[rawTendency];

    // 장소 분위기
    const moods = PLACE_MOOD_MAP[manyPlace] ?? [];
    const mood = moods[0] ?? ""; // 일단은 첫 번째만 사용

    // 최종 타이틀
    const title =
      total === 0 ? "아직 측정되지 않았어요" : `${mood} ${characterName}`;

    const topGenre = genreDistribution[0]?.name; // 가장 많이 읽은 카테고리

    const description =
      total === 0
        ? "어떤 캐릭터가 나오실 지 궁금해요!"
        : `${title}형은 주로 ${placeLabel}${locParticle(placeLabel)} ${topGenre}${objParticle(
            topGenre,
          )} 읽는 사람이에요.`;

    return {
      summary: {
        year,
        month,
        title: title,
        description,
        percent: 0,
        isEmpty: false,
      },
      monthlyStatus,
      reviewKeywords,
      genreDistribution,
      readingCountsByWeekday,
      readingPlaces,
    };
  } catch (e) {
    // 백엔드 500이어도 화면 테스트 가능하게 임시로 열어뒀습니당
    return makeEmptyReport({ year, month });
  }
}
