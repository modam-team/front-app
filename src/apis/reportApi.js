import { PLACE_LABEL, WEEKDAY_LABEL } from "./report.constants";
import {
  reportMonthlyApiMock,
  reportMonthlyApiMockEmptyData,
  reportMonthlyApiMockParkHaru,
  reportMonthlyApiMockRR404Error,
  reportMonthlyApiMockThisMonthHasDataNoCharacter,
} from "./report.mocks";
import {
  buildGenreDistribution,
  findEarliestRecords,
  findLatestRecords,
  getMonthList,
  locParticle,
  makeEmptyReport,
  normalizeFinishMap,
  normalizeGenreKey,
  normalizeLogMap,
  objParticle,
  personaFromGenre,
  slotFromHour,
} from "./report.utils";
import { client } from "@apis/clientApi";
import { GENRE_TO_PERSONA } from "@constants/genreToPersonaMap";
import { PLACE_MOOD_MAP } from "@constants/placeMoodMap";

// mock 리포트 사용할지 여부 (env에서 바꾸면 돼요)
const USE_REPORT_MOCK = process.env.EXPO_PUBLIC_USE_REPORT_MOCK === "true";

// 월간 리포트 조회 메인 함수
export async function fetchMonthlyReport({ year, month }) {
  try {
    // mock 또는 실제 API 선택
    // 아무것도 없는 신규 유저 테스트 할거면 'reportMonthlyApiMockRR404Error'로 바꿔서 ㄱㄱ
    // 아무런 독서 데이터도 없는 신규 유저 테스트는 reportMonthlyApiMockEmptyData
    // 캐릭터는 안 나왔지만 이번달에 가입해서 독서한 기록은 있는 유저 테스트는 reportMonthlyApiMockThisMonthHasDataNoCharacter
    // 캐릭터도 나온 기존 유저면 reportMonthlyApiMock
    const body = USE_REPORT_MOCK
      ? reportMonthlyApiMockParkHaru
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
