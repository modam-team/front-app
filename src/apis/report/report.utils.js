import { WEEKDAY_LABEL } from "./report.constants";
import { GENRE_TO_PERSONA } from "@constants/genreToPersonaMap";

// 장르 키 정규화
export function normalizeGenreKey(g) {
  return (g ?? "").trim();
}

export function personaFromGenre(genre) {
  const key = normalizeGenreKey(genre);
  return GENRE_TO_PERSONA[key] ?? null;
}

// 시간대 구분 (12시 전까진 아침, 18시 전까진 오후, 나머진 저녁)
export function slotFromHour(h) {
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// 받침 있는지 확인
export function hasFinalConsonant(word = "") {
  if (!word) return false;
  const last = word[word.length - 1];
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 범위만 체크할 수 있도록 !
  return (code - 0xac00) % 28 !== 0;
}

// 받침이 있으면 을 / 없으면 를 선택하기
export function objParticle(word = "") {
  return hasFinalConsonant(word) ? "을" : "를";
}

// 에 or 에서 선택하기
export function locParticle(placeLabel = "") {
  if (placeLabel === "이동중") return "에";
  return "에서";
}

// 안전하게 yearMap/monthList 꺼내기
export function getMonthList(map, year, month) {
  const y = map?.[String(year)] ?? map?.[year] ?? {};
  return y?.[String(month)] ?? y?.[month] ?? [];
}

// (완독) responseDto.data.data 평탄화
export function normalizeFinishMap(finishDataRoot) {
  // finishDataRoot = body.responseDto.data?.data
  return finishDataRoot ?? {};
}

// (로그) responseDto.logData.data 평탄화
export function normalizeLogMap(logDataRoot) {
  // logDataRoot = body.responseDto.logData?.data
  return logDataRoot ?? {};
}

// 가장 최신 월의 기록 찾기
export function findLatestRecords(data, { excludeYear, excludeMonth } = {}) {
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

// 가장 이른 월의 기록 찾기 (연/월 오름차순)
export function findEarliestRecords(data) {
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

// 장르 분포 계산
export function buildGenreDistribution(records) {
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

// RR404면 빈 리포트 보여주기
export function makeEmptyReport({ year, month }) {
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
