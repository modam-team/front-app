// 2010년 부터 현재 까지의 연도 목록 만들기
export function buildYearsFrom2010(baseDate = new Date(), minDate) {
  const currentYear = baseDate.getFullYear();
  const START_YEAR = minDate ? minDate.getFullYear() : 2000;

  const years = [];
  for (let y = currentYear; y >= START_YEAR; y -= 1) {
    years.push(y);
  }
  return years;
}

// 아직 오지 않은 미래 월은 제거하구 지난 연도에 대해서는 항상 12월로 고정
export function buildMonthsByYear(
  selectedYear,
  baseDate = new Date(),
  desc = true,
  minDate,
) {
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth() + 1;

  const maxMonth = selectedYear === currentYear ? currentMonth : 12;

  const months = Array.from({ length: maxMonth }, (_, i) => i + 1);
  return desc ? months.reverse() : months;
}
