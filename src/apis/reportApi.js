import {
  buildMonthlyStatus,
  buildReadingCountsByWeekday,
  buildReadingPlaces,
  buildReviewKeywords,
  buildSummary,
  computeEarliestRecordYM,
} from "./report.builders";
import { reportMonthlyApiMockParkHaru } from "./report.mocks";
import {
  buildGenreDistribution,
  getMonthList,
  makeEmptyReport,
  normalizeFinishMap,
  normalizeLogMap,
} from "./report.utils";
import { client } from "@apis/clientApi";

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

    const finishMap = normalizeFinishMap(data?.data); // 완독 map
    const logMap = normalizeLogMap(logData?.data); // 로그 map

    const finishRecords = getMonthList(finishMap, year, month); // 완독 월 리스트
    const logRecords = getMonthList(logMap, year, month); // 로그 월 리스트

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

    const finishYearMap = finishMap?.[String(year)] ?? {};

    // 1) 월별 완독 수
    const monthlyStatus = buildMonthlyStatus(finishYearMap);

    // 2) 해시태그 Top 8
    const reviewKeywords = buildReviewKeywords(finishRecords);

    // 3) 장르 분포
    const genreDistribution = buildGenreDistribution(finishRecords);

    // 4) 요일 + 시간대 분포
    const readingCountsByWeekday = buildReadingCountsByWeekday(logRecords);

    // 5) 장소 비율
    const readingPlaces = buildReadingPlaces(logRecords);

    // 6) 가장 이른 기록 연/월
    const earliestRecordYM = computeEarliestRecordYM(finishMap, logMap);

    // 7) Summary + persona
    const { summary, persona } = buildSummary({
      year,
      month,
      finishMap,
      character,
      userTotalNum,
      characterNum,
    });

    return {
      summary,
      monthlyStatus,
      reviewKeywords,
      genreDistribution,
      readingCountsByWeekday,
      readingPlaces,
      persona,
      meta: { earliestRecordYM },
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
