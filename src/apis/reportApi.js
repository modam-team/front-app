import { client } from "@apis/clientApi";
import { GENRE_TO_PERSONA } from "@constants/genreToPersonaMap";
import { PLACE_MOOD_MAP } from "@constants/placeMoodMap";
import { getToken } from "@utils/secureStore";

function normalizeGenreKey(g) {
  return (g ?? "").trim();
}

function personaFromGenre(genre) {
  const key = normalizeGenreKey(genre);
  return GENRE_TO_PERSONA[key] ?? null;
}

// 가장 이른 월의 기록 찾기 (연/월 오름차순)
function findEarliestRecords(data) {
  if (!data) return null;

  const years = Object.keys(data)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  for (const y of years) {
    const yearMap = data[String(y)] ?? {};
    const months = Object.keys(yearMap)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    for (const m of months) {
      const list = yearMap[String(m)];
      if (Array.isArray(list) && list.length > 0) {
        return { year: y, month: m, records: list };
      }
    }
  }
  return null;
}

// mock 리포트 사용할지 여부 (env에서 바꾸면 돼요)
const USE_REPORT_MOCK = process.env.EXPO_PUBLIC_USE_REPORT_MOCK === "true";

// 리포트가 없는 신규 유저(RR404) 테스트용 mock
export const reportMonthlyApiMockRR404Error = {
  success: false,
  responseDto: null,
  error: {
    code: "RR404",
    message: "Report: User has no report data",
  },
};

// 리포트는 200으로 내려오지만 내용이 비어있는 신규 유저 케이스
export const reportMonthlyApiMockEmptyData = {
  success: true,
  error: null,
  responseDto: {
    character: null, // 캐릭터 비었으면 empty_data
    characterNum: 0,
    userTotalNum: 0,

    data: {
      code: "EMPTY_FINISH", // 완독 비었음
      data: {}, // 연도/월 맵 비어있음
    },

    logData: {
      code: "EMPTY_LOG", // 기록 비었음
      data: {}, // 연도/월 맵 비어있음
    },
  },
};

// 이번달 가입 유저라서 지난달 데이터 없어서 캐릭터 없음
// 근데 이번달에 완독 및 독서기록 있음
export const reportMonthlyApiMockThisMonthHasDataNoCharacter = {
  success: true,
  error: null,
  responseDto: {
    character: null, // 지난 달 캐릭터 없음
    characterNum: 0,
    userTotalNum: 0,

    data: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              finishAt: "2026-01-06T21:10:00",
              category: "소설/문학",
              hashtags: ["몰입", "여운"],
            },
            {
              finishAt: "2026-01-09T18:40:00",
              category: "자기계발",
              hashtags: ["루틴", "동기부여"],
            },
          ],
        },
      },
    },

    logData: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              readAt: "2026-01-03T09:30:00",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2026-01-05T13:10:00",
              category: "소설/문학",
              place: "CAFE",
            },
            {
              readAt: "2026-01-07T20:20:00",
              category: "자기계발",
              place: "HOME",
            },
            {
              readAt: "2026-01-10T08:15:00",
              category: "자기계발",
              place: "MOVING",
            },
          ],
        },
      },
    },
  },
};

// 정상 리포트 mock 데이터
export const reportMonthlyApiMock = {
  success: true,
  error: null,
  responseDto: {
    character: {
      manyPlace: "MOVING", // 가장 많이 읽은 장소
      readingTendency: "경제/경영", // 장르
    },
    userTotalNum: 100, // 전체 유저 수
    characterNum: 15, // 해당 캐릭터 유저 수3

    data: {
      code: "OK",
      // 연도 > 월 > 독서 배열 순서
      data: {
        2024: {
          11: [
            {
              finishAt: "2024-11-03T09:20:00",
              category: "소설/문학",
              hashtags: ["잔잔함", "여운"],
            },
            {
              finishAt: "2024-11-18T22:10:00",
              category: "에세이/전기",
              hashtags: ["공감", "힐링"],
            },
          ],
          12: [
            {
              finishAt: "2024-12-01T14:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["집중", "사색"],
            },
          ],
        },

        2025: {
          1: [
            {
              finishAt: "2025-01-05T08:40:00",
              category: "심리/명상",
              hashtags: ["동기부여", "정리"],
            },
            {
              finishAt: "2025-01-21T19:10:00",
              category: "소설/문학",
              hashtags: ["몰입", "재미"],
            },
          ],

          6: [
            {
              finishAt: "2025-06-02T07:55:00",
              category: "소설/문학",
              hashtags: ["속도감"],
            },
            {
              finishAt: "2025-06-15T18:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["사고확장"],
            },
            {
              finishAt: "2025-06-15T20:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["사고확장"],
            },
            {
              finishAt: "2025-06-28T23:10:00",
              category: "에세이/전기",
              hashtags: ["위로"],
            },
          ],

          12: [
            {
              finishAt: "2025-12-11T19:14:20",
              category: "소설/문학",
              hashtags: ["재밌음", "흥미진진", "빠른전개"],
            },
            {
              finishAt: "2025-12-10T21:40:00",
              category: "인문/사회/정치/법",
              hashtags: ["여운", "몰입"],
            },
            {
              finishAt: "2025-12-22T10:05:00",
              category: "심리/명상",
              hashtags: ["정리", "성장"],
            },
            {
              finishAt: "2025-12-03T08:10:00",
              category: "경제/경영",
              hashtags: ["투자", "인사이트"],
            },
            {
              finishAt: "2025-12-05T23:20:00",
              category: "과학/기술/공학",
              hashtags: ["신기함", "호기심", "설렘"],
            },
            {
              finishAt: "2025-12-07T12:40:00",
              category: "예술/디자인/건축",
              hashtags: ["감성", "영감"],
            },
            {
              finishAt: "2025-12-15T17:35:00",
              category: "의학/건강",
              hashtags: ["루틴", "힐링"],
            },
            {
              finishAt: "2025-12-15T18:35:00",
              category: "의학/건강",
              hashtags: ["루틴", "힐링"],
            },
            {
              finishAt: "2025-12-18T09:50:00",
              category: "여행",
              hashtags: ["설렘", "계획"],
            },
          ],
        },
      },
    },

    // 로그 데이터 (readAt / category / place)
    logData: {
      code: "OK",
      data: {
        2024: {
          11: [
            {
              readAt: "2024-11-03T09:20:00",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2024-11-18T22:10:00",
              category: "에세이/전기",
              place: "CAFE",
            },
          ],
          12: [
            {
              readAt: "2024-12-01T14:30:00",
              category: "인문/사회/정치/법",
              place: "LIBRARY",
            },
          ],
        },

        2025: {
          1: [
            {
              readAt: "2025-01-05T08:40:00",
              category: "심리/명상",
              place: "HOME",
            },
            {
              readAt: "2025-01-21T19:10:00",
              category: "소설/문학",
              place: "CAFE",
            },
          ],

          6: [
            {
              readAt: "2025-06-02T07:55:00",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2025-06-15T18:30:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-06-15T20:30:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-06-28T23:10:00",
              category: "에세이/전기",
              place: "HOME",
            },
          ],

          12: [
            {
              readAt: "2025-12-11T19:14:20",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2025-12-10T21:40:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-12-22T10:05:00",
              category: "심리/명상",
              place: "CAFE",
            },
            {
              readAt: "2025-12-03T08:10:00",
              category: "경제/경영",
              place: "HOME",
            },
            {
              readAt: "2025-12-05T23:20:00",
              category: "과학/기술/공학",
              place: "CAFE",
            },
            {
              readAt: "2025-12-07T12:40:00",
              category: "예술/디자인/건축",
              place: "LIBRARY",
            },
            {
              readAt: "2025-12-15T17:35:00",
              category: "의학/건강",
              place: "MOVING",
            },
            {
              readAt: "2025-12-15T18:35:00",
              category: "의학/건강",
              place: "MOVING",
            },
            {
              readAt: "2025-12-18T09:50:00",
              category: "여행",
              place: "HOME",
            },
          ],
        },
      },
    },
  },
};

// 요일 라벨
const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

// 장소를 한글로 라벨링
const PLACE_LABEL = {
  HOME: "집",
  CAFE: "카페",
  LIBRARY: "도서관",
  MOVING: "이동중",
};

// 시간대 구분 (12시 전까진 아침, 18시 전까진 오후, 나머진 저녁)
function slotFromHour(h) {
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// 받침 있는지 확인
function hasFinalConsonant(word = "") {
  if (!word) return false;
  const last = word[word.length - 1];
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 범위만 체크할 수 있도록 !
  return (code - 0xac00) % 28 !== 0;
}

// 받침이 있으면 을 / 없으면 를 선택하기
function objParticle(word = "") {
  return hasFinalConsonant(word) ? "을" : "를";
}

// 에 or 에서 선택하기
function locParticle(placeLabel = "") {
  if (placeLabel === "이동중") return "에";
  return "에서";
}

// 안전하게 yearMap/monthList 꺼내기
function getMonthList(map, year, month) {
  const y = map?.[String(year)] ?? map?.[year] ?? {};
  return y?.[String(month)] ?? y?.[month] ?? [];
}

// (완독) responseDto.data.data 평탄화
function normalizeFinishMap(finishDataRoot) {
  // finishDataRoot = body.responseDto.data?.data
  return finishDataRoot ?? {};
}

// (로그) responseDto.logData.data 평탄화
function normalizeLogMap(logDataRoot) {
  // logDataRoot = body.responseDto.logData?.data
  return logDataRoot ?? {};
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

    // 월별 독서 수 (전부 0)
    monthlyStatus: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
    })),

    // 이하 데이터는 전부 빈 값
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

// 가장 최신 월의 기록 찾기
function findLatestRecords(data, { excludeYear, excludeMonth } = {}) {
  if (!data) return null;

  // 연도 내림차순
  const years = Object.keys(data)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a);

  for (const y of years) {
    const yearMap = data[String(y)] ?? {};

    // 월 내림차순
    const months = Object.keys(yearMap)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => b - a);

    // 기록이 하나라도 있는 가장 최신 월 반환
    for (const m of months) {
      // 진행중인 월 제외 (지금이 26년 1월이면 최신 월은 25년 12월이어야 함)
      if (excludeYear === y && excludeMonth === m) continue;

      const list = yearMap[String(m)];
      if (Array.isArray(list) && list.length > 0) {
        return { year: y, month: m, records: list };
      }
    }
  }
  return null;
}

// 장르 분포 계산
function buildGenreDistribution(records) {
  const total = Array.isArray(records) ? records.length : 0;
  const categoryCount = new Map();

  // 장르별 카운트
  for (const r of records ?? []) {
    const c = r?.category ?? "기타";
    categoryCount.set(c, (categoryCount.get(c) ?? 0) + 1);
  }

  // 비율 계산 + 정렬
  return Array.from(categoryCount.entries())
    .map(([name, count]) => ({
      name,
      count,
      ratio: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// 월간 리포트 조회 메인 함수
export async function fetchMonthlyReport({ year, month }) {
  try {
    // mock 또는 실제 API 선택
    // 아무것도 없는 신규 유저 테스트 할거면 'reportMonthlyApiMockRR404Error'로 바꿔서 ㄱㄱ
    // 아무런 독서 데이터도 없는 신규 유저 테스트는 reportMonthlyApiMockEmptyData
    // 캐릭터는 안 나왔지만 이번달에 가입해서 독서한 기록은 있는 유저 테스트는 reportMonthlyApiMockThisMonthHasDataNoCharacter
    // 캐릭터도 나온 기존 유저면 reportMonthlyApiMock
    const body = USE_REPORT_MOCK
      ? reportMonthlyApiMock
      : (await client.get("/api/report/monthly")).data;

    // 404 & RR404일 땐 빈 리포트, 그 외 에러는 진짜 에러
    if (!body?.success || !body?.responseDto) {
      return makeEmptyReport({ year, month });
    }

    // 서버 응답 구조 분해
    const { character, data, logData, userTotalNum, characterNum } =
      body.responseDto;

    const manyPlace = character?.manyPlace ?? null;

    const tendencyGenre = normalizeGenreKey(character?.readingTendency); // 서버가 준 장르
    const persona = personaFromGenre(tendencyGenre); // 여기서 persona 확정

    // 캐릭터 비율 계산
    const percent =
      !userTotalNum || userTotalNum <= 0
        ? null
        : Math.max(
            0,
            Math.min(100, Math.round((characterNum / userTotalNum) * 100)),
          );

    // 연 / 월 키
    const yearKey = String(year);
    const monthKey = String(month);

    const finishMap = normalizeFinishMap(data?.data); // 완독 map
    const logMap = normalizeLogMap(logData?.data); // 로그 map

    const finishRecords = getMonthList(finishMap, year, month); // 완독 월 리스트
    const logRecords = getMonthList(logMap, year, month); // 로그 월 리스트

    const earliestFinish = findEarliestRecords(finishMap);
    const earliestLog = findEarliestRecords(logMap);

    const earliest = !earliestFinish
      ? earliestLog
      : !earliestLog
        ? earliestFinish
        : earliestFinish.year < earliestLog.year ||
            (earliestFinish.year === earliestLog.year &&
              earliestFinish.month <= earliestLog.month)
          ? earliestFinish
          : earliestLog;

    const earliestRecordYM = earliest
      ? { year: earliest.year, month: earliest.month }
      : null;

    // 전체 기록이 하나라도 있는지 확인
    const emptyByCode =
      data?.code === "EMPTY_FINISH" || logData?.code === "EMPTY_LOG";

    const hasAnyRecord =
      Object.values(finishMap ?? {}).some((yearMap) =>
        Object.values(yearMap ?? {}).some(
          (monthList) => Array.isArray(monthList) && monthList.length > 0,
        ),
      ) ||
      Object.values(logMap ?? {}).some((yearMap) =>
        Object.values(yearMap ?? {}).some(
          (monthList) => Array.isArray(monthList) && monthList.length > 0,
        ),
      );

    if (emptyByCode || !hasAnyRecord) {
      return makeEmptyReport({ year, month });
    }

    // 해당 월 기록
    const finishYearMap = finishMap?.[yearKey] ?? {};
    const finishTotal = Array.isArray(finishRecords) ? finishRecords.length : 0;

    const logYearMap = logMap?.[yearKey] ?? {};
    const logTotal = Array.isArray(logRecords) ? logRecords.length : 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 이번달(현재 달) 완독 기록만 제거한 복사본
    const finishMapForSummary = { ...(finishMap ?? {}) };
    if (finishMapForSummary?.[currentYear]) {
      const yearCopy = { ...(finishMapForSummary[currentYear] ?? {}) };
      delete yearCopy[currentMonth]; // 이번달 제거
      // 해당 연도에 남는 달이 없으면 연도도 제거
      if (Object.keys(yearCopy).length === 0) {
        delete finishMapForSummary[currentYear];
      } else {
        finishMapForSummary[currentYear] = yearCopy;
      }
    }

    // summary용 최신 달 찾기
    const latest = findLatestRecords(finishMapForSummary);

    const hasSummarySource = !!latest; // 지난달까지 완독 데이터가 있는지 여부

    // null-safe fallback
    const latestYear = latest?.year ?? year;
    const latestMonth = latest?.month ?? month;
    const latestRecords = latest?.records ?? [];

    // 1) 연간 월별 카운트 (해당 연도에 있는 달만 length로)
    const monthlyStatus = Array.from({ length: 12 }, (_, i) => {
      const mKey = String(i + 1);
      const list = finishYearMap?.[mKey] ?? [];
      return { month: i + 1, count: Array.isArray(list) ? list.length : 0 };
    });

    // 2) 해시태그 Top 8
    const hashtagCount = new Map();
    for (const r of finishRecords ?? []) {
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
      .slice(0, 8);

    // 3) 카테고리(장르) 분포
    const genreDistribution = buildGenreDistribution(finishRecords);

    // 4) 요일 + 시간대
    const readingCountsByWeekday = Array.from({ length: 7 }, (_, w) => ({
      weekday: w,
      label: WEEKDAY_LABEL[w],
      slots: { morning: 0, afternoon: 0, evening: 0 },
    }));

    for (const r of logRecords ?? []) {
      const dt = r?.readAt ? new Date(r.readAt) : null;
      if (!dt || isNaN(dt.getTime())) continue;

      const w = dt.getDay();
      const slot = slotFromHour(dt.getHours());
      readingCountsByWeekday[w].slots[slot] += 1;
    }

    // 5) 장소 비율
    const placeCount = new Map();
    for (const r of logRecords ?? []) {
      const p = r?.place ?? "UNKNOWN";
      placeCount.set(p, (placeCount.get(p) ?? 0) + 1);
    }

    const readingPlaces = Array.from(placeCount.entries())
      .map(([place, count]) => ({
        label: PLACE_LABEL[place] ?? place,
        ratio: logTotal ? count / logTotal : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // 6) Summary 구성
    // 캐릭터가 없으면(이번달 가입 등) Summary는 빈 캐릭터 문구로 고정
    const hasCharacter =
      hasSummarySource && !!character && !!manyPlace && !!persona;

    if (!hasCharacter) {
      return {
        summary: {
          year,
          month,
          title: "아직 측정되지 않았어요",
          description: "어떤 캐릭터가 나오실 지 궁금해요!",
          percent: null,
          isEmpty: true,
          characterKey: "empty",
          placeKey: null,
        },
        monthlyStatus: Array.from({ length: 12 }, (_, i) => {
          const mKey = String(i + 1);
          const list = finishYearMap?.[mKey] ?? [];
          return { month: i + 1, count: Array.isArray(list) ? list.length : 0 };
        }),
        reviewKeywords,
        genreDistribution,
        readingCountsByWeekday,
        readingPlaces,
        readingTendency: null,
        persona: null,
      };
    }

    const placeLabel = PLACE_LABEL[manyPlace] ?? manyPlace;

    // 장소 분위기
    const moods = PLACE_MOOD_MAP[manyPlace] ?? [];
    const mood = moods[0] ?? ""; // 일단은 첫 번째만 사용

    const title = `${mood} ${persona}`;

    const description = `${title}형은 주로 ${placeLabel}${locParticle(
      placeLabel,
    )} ${tendencyGenre}${objParticle(tendencyGenre)} 읽는 사람이에요.`;

    const characterKey = (persona || "default")
      .replace(/\s+/g, "_")
      .toLowerCase();

    return {
      summary: {
        year: latestYear,
        month: latestMonth,
        title,
        description,
        percent: percent,
        characterKey,
        placeKey: manyPlace,
      },
      monthlyStatus,
      reviewKeywords,
      genreDistribution,
      readingCountsByWeekday,
      readingPlaces,
      persona,

      meta: {
        earliestRecordYM,
      },
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

export async function fetchReadingLogs({
  year,
  month,
  userId,
  targetUserId,
  allowSelfFallback = true,
  includeTheme = false,
}) {
  const target = userId || targetUserId;

  // 1) 다른 유저 기록 조회 (/api/report/others)
  if (target) {
    try {
      const res = await client.get("/api/report/others", {
        params: { otherId: target, year, month },
      });
      const dto = res?.data?.responseDto ?? null;
      const list = dto?.readingLogResponse ?? dto ?? res?.data ?? [];
      if (Array.isArray(list)) {
        if (includeTheme) {
          return { list, theme: dto?.theme ?? null };
        }
        return list;
      }
    } catch (e) {
      // fallback
    }
  }

  // 2) 친구 로그용 별도 엔드포인트 시도
  if (target) {
    try {
      const res = await client.get("/api/report/friend", {
        params: { targetUserId: target, year, month },
      });
      const list = res?.data?.responseDto ?? [];
      if (Array.isArray(list)) {
        return includeTheme ? { list, theme: null } : list;
      }
    } catch (e) {
      console.warn(
        "친구 독서 기록 전용 경로 실패, 기본 경로로 폴백",
        e?.response?.data || e.message,
      );
    }
  }

  // 3) 기본 경로 (userId가 있으면 함께 전달 시도)
  if (!target || allowSelfFallback) {
    const res = await client.get("/api/report", {
      params: { year, month, ...(target ? { userId: target } : {}) },
    });
    const list = res?.data?.responseDto ?? res?.data ?? [];
    if (!Array.isArray(list))
      return includeTheme ? { list: [], theme: null } : [];
    return includeTheme ? { list, theme: null } : list;
  }

  return includeTheme ? { list: [], theme: null } : [];
}
