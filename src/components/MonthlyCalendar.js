import { getFlowerComponent, monthToSeason } from "@constants/FlowerAssets";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 월 단위 달력 컴포넌트
export default function MonthlyCalendar({
  year, // 표시할 연도
  month, // 표시할 월
  onPrev,
  onNext,
  onYearChange, // 연도 선택 피커 트리거 용
  markedDates = new Set(), // 독서한 기록이 있는 날짜 집합
  onDayPress, // markedDates에 포함된 날짜를 눌렀을 때 호출
  selectedDayKey, // 선택된 날짜 key
  dateCounts = {}, // 날짜 별 읽은 횟수
  themeKey = "green", // 테마 설정에서 고른 값
}) {
  // 어떤 계절인지
  const season = useMemo(() => monthToSeason(month), [month]);

  // 달력 그리드 배열 만들기 (주 단위 배열)
  const weeks = useMemo(() => {
    // 해당 월의 1일
    const first = new Date(year, month - 1, 1);

    // 해당 월의 마지막 날짜
    const last = new Date(year, month, 0).getDate();

    // 월요일 시작으로 보이게 만들기 위해 보정
    const startIndex = (first.getDay() + 6) % 7;

    // 달력 셀(날짜 or 빈칸) 1차 배열로 구성
    const cells = [];

    // 시작 요일 전까지는 빈칸(null) 채우기
    for (let i = 0; i < startIndex; i += 1) cells.push(null);

    // 1일부터 마지막 날짜까지 채우기
    for (let d = 1; d <= last; d += 1) cells.push(d);

    // 7로 딱 떨어지도록 뒤에도 빈칸(null) 채워서 그리드 정렬
    while (cells.length % 7 !== 0) cells.push(null);

    // 7개씩 잘라서 주 단위 배열로 변환
    const result = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [year, month]);

  const renderFlower = useCallback(
    (dayKey) => {
      const count = Number(dateCounts?.[dayKey] || 0);
      const Flower = getFlowerComponent({ themeKey, season, count });
      if (!Flower) return null;

      return (
        <View
          style={styles.flowerBg}
          pointerEvents="none"
        >
          <Flower
            width={34}
            height={34}
          />
        </View>
      );
    },
    [dateCounts, themeKey, season],
  );

  return (
    <View style={styles.wrap}>
      {/* 연도 영역 -> 누르면 YearMonthPicker 같은 연도 선택 UI를 열도록 트리거 */}
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={styles.yearButton}
          onPress={() => onYearChange?.("open")}
          hitSlop={8}
        >
          <Text style={styles.yearText}>{year}</Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color="#191919"
          />
        </TouchableOpacity>
      </View>

      {/* 월 이동 영역 -> 이전/다음 버튼 + 현재 월 텍스트 */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={onPrev}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back-outline"
            size={28}
            color="#000"
          />
        </TouchableOpacity>
        <Text style={styles.calTitle}>{`${month}월`}</Text>
        <TouchableOpacity
          onPress={onNext}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={28}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* 요일 헤더(월 ~ 일) */}
      <View style={styles.weekRow}>
        {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
          <Text
            key={w}
            style={styles.weekLabel}
          >
            {w}
          </Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {weeks.map((week, idx) => (
        <View
          key={idx}
          style={styles.dayRow}
        >
          {week.map((day, dIdx) => (
            <View
              key={dIdx}
              style={styles.dayCell}
            >
              {day ? (
                (() => {
                  const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  // 기록 있는 날짜인지 여부
                  const isMarked = markedDates?.has?.(dayKey);

                  // 선택된 날짜인지 여부
                  const isSelected = selectedDayKey === dayKey;

                  return (
                    <Pressable
                      onPress={() => isMarked && onDayPress?.(dayKey)}
                      hitSlop={8}
                      style={({ pressed }) => [
                        // 기본 클릭 영역
                        styles.dayBubble,

                        // 선택된 날짜 강조
                        isSelected && styles.dayBubbleSelected,

                        // 기록 없는 날짜는  눌렀을 때만 흐려지게
                        !isMarked && pressed && styles.dayBubblePressedNoMark,
                      ]}
                    >
                      {/* 기록 있는 날이면 꽃 */}
                      {isMarked ? renderFlower(dayKey) : null}

                      {/* 날짜 텍스트 */}
                      <Text
                        style={[
                          styles.dayText,
                          isMarked
                            ? styles.dayTextOnFlower
                            : styles.dayTextNormal,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })()
              ) : (
                <Text style={styles.dayTextMuted}> </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 카드 전체 래퍼
  wrap: {
    marginHorizontal: 13,
    backgroundColor: colors.mono[0],
    borderRadius: radius[500],
    paddingVertical: 20,
    paddingHorizontal: spacing.m,
  },

  // 연도 헤더 영역
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: spacing.m,
    alignSelf: "flex-start",
  },

  // 연도 텍스트 + 화살표를 감싸는 버튼
  yearButton: { flexDirection: "row", alignItems: "center", gap: 5 },

  // 연도 텍스트 + 화살표를 감싸는 버튼
  yearText: { ...typography["body-1-regular"], color: colors.mono[950] },

  // 이전 / 다음 버튼 + 현재 월 텍스트 영역
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.m,
    width: 328,
    alignSelf: "center",
  },

  // 가운데 표시되는 월 텍스트
  calTitle: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
    textAlign: "center",
  },

  // 요일 라벨
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: 328,
    marginBottom: spacing.m,
    paddingHorizontal: 2,
  },

  // 개별 요일 텍스트
  weekLabel: {
    width: 28,
    textAlign: "center",
    ...typography["body-2-regular"],
    color: colors.mono[950],
  },

  // 날짜 그리드 레이아웃
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: 328,
    marginBottom: 20,
    paddingHorizontal: 2,
  },

  // 개별 날짜 셀 (정사각형 영역)
  dayCell: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // 날짜를 감싸는 실제 터치 영역
  dayBubble: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // 기록 없는 날은 눌러도 반응 없게 보여주기 위한 느낌
  dayBubblePressedNoMark: {
    opacity: 0.6,
  },

  // 꽃이 있는 날짜를 선택하면 선택한 효과가 보이게 살짝 크기 키움
  dayBubbleSelected: {
    // 선택한 날 강조(꽃 위에 올라가도 보이게)
    transform: [{ scale: 1.05 }],
  },

  // 꽃 SVG를 날짜 뒤에 배경처럼 깔기 위한 래퍼
  flowerBg: {
    position: "absolute",
  },

  // 날짜 텍스트
  dayText: {
    ...typography["body-1-bold"],
    color: colors.mono[950],
  },

  // 꽃 배경 위 날짜 (흰색)
  dayTextOnFlower: {
    color: colors.mono[0],
  },

  // 꽃 없는 날짜 (검정색)
  dayTextNormal: {
    color: colors.mono[950],
  },

  // 날짜 없는 칸(공백)
  dayTextMuted: {
    color: "transparent",
  },
});
