import { client } from "@apis/clientApi";

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
    const res = await client.get("/api/report/monthly");
    const body = res.data;

    // 임시로 success = false 거나 responseDto가 null이어도 throw하지 않고 빈 레포트가 보이도록 해뒀습니당
    if (!body?.success || !body?.responseDto) {
      return makeEmptyReport({ year, month });
    }

    const { manyPlace, readingTendency, data } = body.responseDto;

    const yearKey = String(year);
    const monthKey = String(month);

    const yearMap = data?.[yearKey] ?? {};
    const records = yearMap?.[monthKey] ?? [];
    const total = Array.isArray(records) ? records.length : 0;

    // 선택한 달의 기록이 0이면 빈 리포트 반환하게 해뒀습니당
    if (total === 0) {
      return makeEmptyReport({ year, month });
    }

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
    const topGenre = genreDistribution[0]?.name; // 가장 많이 읽은 카테고리
    const tendencyTitle = readingTendency || "아직 측정되지 않았어요";

    const description =
      total === 0
        ? "어떤 캐릭터가 나오실 지 궁금해요!"
        : `${tendencyTitle}형은 주로 ${placeLabel}${locParticle(placeLabel)} ${topGenre}${objParticle(
            topGenre,
          )} 읽는 사람이에요.`;

    return {
      summary: {
        year,
        month,
        title: tendencyTitle,
        description,
        percent: 0,
        isEmpty: total === 0,
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
