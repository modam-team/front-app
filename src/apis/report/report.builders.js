import { PLACE_LABEL, WEEKDAY_LABEL } from "./report.constants";
import {
  buildGenreDistribution,
  getMonthList,
  makeEmptyReport,
} from "./report.utils";
import {
  findEarliestRecords,
  findLatestRecords,
  locParticle,
  normalizeGenreKey,
  objParticle,
  personaFromGenre,
  slotFromHour,
} from "./report.utils";
import { PLACE_MOOD_MAP } from "@constants/placeMoodMap";

// 연간 월별 카운트 (해당 연도에 있는 달만 length로)
export function buildMonthlyStatus(finishYearMap) {
  return Array.from({ length: 12 }, (_, i) => {
    const mKey = String(i + 1);
    const list = finishYearMap?.[mKey] ?? [];
    return { month: i + 1, count: Array.isArray(list) ? list.length : 0 };
  });
}

// 해시태그 Top 8
export function buildReviewKeywords(finishRecords, limit = 8) {
  const hashtagCount = new Map();
  for (const r of finishRecords ?? []) {
    const tags = r?.hashtags;
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      if (!t) continue;
      hashtagCount.set(t, (hashtagCount.get(t) ?? 0) + 1);
    }
  }
  return Array.from(hashtagCount.entries())
    .map(([word, weight]) => ({ word, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

// 요일 + 시간대
export function buildReadingCountsByWeekday(logRecords) {
  const result = Array.from({ length: 7 }, (_, w) => ({
    weekday: w,
    label: WEEKDAY_LABEL[w],
    slots: { morning: 0, afternoon: 0, evening: 0 },
  }));

  for (const r of logRecords ?? []) {
    const dt = r?.readAt ? new Date(r.readAt) : null;
    if (!dt || isNaN(dt.getTime())) continue;
    const w = dt.getDay();
    const slot = slotFromHour(dt.getHours());
    result[w].slots[slot] += 1;
  }
  return result;
}

// 장소 비율
export function buildReadingPlaces(logRecords) {
  const total = Array.isArray(logRecords) ? logRecords.length : 0;
  const placeCount = new Map();

  for (const r of logRecords ?? []) {
    const p = r?.place ?? "UNKNOWN";
    placeCount.set(p, (placeCount.get(p) ?? 0) + 1);
  }

  return Array.from(placeCount.entries())
    .map(([place, count]) => ({
      label: PLACE_LABEL[place] ?? place,
      ratio: total ? count / total : 0,
    }))
    .sort((a, b) => b.ratio - a.ratio);
}

// earliest 계산
export function computeEarliestRecordYM(finishMap, logMap) {
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

  return earliest ? { year: earliest.year, month: earliest.month } : null;
}

export function buildSummary({
  year,
  month,
  finishMap,
  character,
  userTotalNum,
  characterNum,
}) {
  const manyPlace = character?.manyPlace ?? null;
  const tendencyGenre = normalizeGenreKey(character?.readingTendency);
  const persona = personaFromGenre(tendencyGenre);

  // percent
  const percent =
    !userTotalNum || userTotalNum <= 0
      ? null
      : Math.max(
          0,
          Math.min(100, Math.round((characterNum / userTotalNum) * 100)),
        );

  // 이번달 제외하고 최신 완독 달 찾기
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const finishMapForSummary = { ...(finishMap ?? {}) };
  if (finishMapForSummary?.[currentYear]) {
    const yearCopy = { ...(finishMapForSummary[currentYear] ?? {}) };
    delete yearCopy[currentMonth];
    if (Object.keys(yearCopy).length === 0)
      delete finishMapForSummary[currentYear];
    else finishMapForSummary[currentYear] = yearCopy;
  }

  const latest = findLatestRecords(finishMapForSummary);
  const hasSummarySource = !!latest;
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
      persona: null,
      tendencyGenre: null,
      manyPlace: null,
      percent: null,
      latestYear: year,
      latestMonth: month,
    };
  }

  const placeLabel = PLACE_LABEL[manyPlace] ?? manyPlace;
  const moods = PLACE_MOOD_MAP[manyPlace] ?? [];
  const mood = moods[0] ?? "";
  const title = `${mood} ${persona}`;
  const description = `${title}형은 주로 ${placeLabel}${locParticle(placeLabel)} ${tendencyGenre}${objParticle(tendencyGenre)} 읽는 사람이에요.`;

  const characterKey = (persona || "default")
    .replace(/\s+/g, "_")
    .toLowerCase();

  return {
    summary: {
      year: latest?.year ?? year,
      month: latest?.month ?? month,
      title,
      description,
      percent,
      characterKey,
      placeKey: manyPlace,
    },
    persona,
    tendencyGenre,
    manyPlace,
    percent,
    latestYear: latest?.year ?? year,
    latestMonth: latest?.month ?? month,
  };
}
