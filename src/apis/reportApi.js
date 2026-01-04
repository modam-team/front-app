import { client } from "@apis/clientApi";
import { PLACE_MOOD_MAP } from "@constants/placeMoodMap";
import { READING_TENDENCY_MAP } from "@constants/readingTendencyMap";
import { getToken } from "@utils/secureStore";

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

// RR404면 빈 리포트 보여주기
function makeEmptyReport({ year, month }) {
  return {
    summary: {
      year,
      month,
      title: "아직 측정되지 않았어요",
      description: "어떤 캐릭터가 나오실 지 궁금해요!",
      percent: 0,
      isEmpty: true,
      characterKey: "empty",
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

function findLatestRecords(data) {
  if (!data) return null;

  const years = Object.keys(data)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a);

  for (const y of years) {
    const yearMap = data[String(y)] ?? {};
    const months = Object.keys(yearMap)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => b - a);

    for (const m of months) {
      const list = yearMap[String(m)];
      if (Array.isArray(list) && list.length > 0) {
        return { year: y, month: m, records: list };
      }
    }
  }
  return null;
}

function buildGenreDistribution(records) {
  const total = Array.isArray(records) ? records.length : 0;
  const categoryCount = new Map();

  for (const r of records ?? []) {
    const c = r?.category ?? "기타";
    categoryCount.set(c, (categoryCount.get(c) ?? 0) + 1);
  }

  return Array.from(categoryCount.entries())
    .map(([name, count]) => ({
      name,
      count,
      ratio: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchMonthlyReport({ year, month }) {
  try {
    const body = USE_REPORT_MOCK
      ? reportMonthlyApiMock
      : (await client.get("/api/report/monthly")).data;

    // 404 & RR404일 땐 빈 리포트, 그 외 에러는 진짜 에러
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

    const latest = findLatestRecords(data);
    if (!latest) return makeEmptyReport({ year, month });

    const latestYear = latest.year;
    const latestMonth = latest.month;
    const latestRecords = latest.records;

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

    const latestGenreDistribution = buildGenreDistribution(latestRecords);
    const latestTopGenre = latestGenreDistribution[0]?.name;

    // 최종 타이틀
    const latestTotal = Array.isArray(latestRecords) ? latestRecords.length : 0;

    const isEmpty = latestTotal === 0;

    const title =
      latestTotal === 0 ? "아직 측정되지 않았어요" : `${mood} ${characterName}`;

    const description =
      latestTotal === 0
        ? "어떤 캐릭터가 나오실 지 궁금해요!"
        : `${title}형은 주로 ${placeLabel}${locParticle(placeLabel)} ${latestTopGenre}${objParticle(
            latestTopGenre,
          )} 읽는 사람이에요.`;
    const characterKey =
      latestTotal === 0
        ? "empty"
        : (characterName || "default").replace(/\s+/g, "_").toLowerCase();

    return {
      summary: {
        year: latestYear,
        month: latestMonth,
        title,
        description,
        percent: isEmpty ? null : 0,
        isEmpty,
        characterKey,
        placeKey: manyPlace,
      },
      monthlyStatus,
      reviewKeywords,
      genreDistribution,
      readingCountsByWeekday,
      readingPlaces,
    };
  } catch (e) {
    const status = e?.response?.status;
    const code = e?.response?.data?.error?.code;

    // 리포트 없음은 정상 플로우
    if (status === 404 && code === "RR404") {
      return makeEmptyReport({ year, month });
    }

    // 진짜 에러만 로그
    console.error("리포트 조회 실패:", status, e?.response?.data, e);
  }
}

export async function saveReadingLog({ bookId, readingPlace }) {
  const res = await client.post("/api/report", {
    bookId,
    readingPlace,
  });
  return res?.data?.responseDto ?? null;
}

export async function fetchReadingLogs({ year, month }) {
  const res = await client.get("/api/report", {
    params: { year, month },
  });
  const list = res?.data?.responseDto ?? [];
  return Array.isArray(list) ? list : [];
}
