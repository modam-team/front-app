import YearMonthPicker from "./YearMonthPicker";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BAR_MAX_HEIGHT = 160;
const MONTH_COUNT = 12;

export default function MonthlyStats({
  year,
  month,
  onChangeYear,
  onChangeMonth,
  monthlyStatus,
}) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const openPicker = () => setPickerVisible(true);
  const closePicker = () => setPickerVisible(false);

  const monthData = useMemo(() => {
    const map = new Map();
    (monthlyStatus || []).forEach((m) => map.set(m.month, m.count));

    return Array.from({ length: MONTH_COUNT }, (_, idx) => {
      const m = idx + 1;
      return {
        month: m,
        count: map.get(m) ?? 0,
      };
    });
  }, [monthlyStatus]);

  const maxCount = useMemo(
    () =>
      monthData.reduce((max, item) => (item.count > max ? item.count : max), 1),
    [monthData],
  );

  // 막대 애니메이션 값 (월별 12개)
  const barAnim = useRef(
    Array.from({ length: MONTH_COUNT }, () => new Animated.Value(0)),
  ).current;

  // 연 / 월 / 데이터가 바뀔 때마다 아래에서 위로 올라오도록
  useEffect(() => {
    const animations = barAnim.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // height 애니메이션이라 false
        delay: index * 50, // 살짝씩 시차를 줘서 순서대로 올라오는 느낌
      }),
    );

    Animated.stagger(40, animations).start();
  }, [year, month, monthData, barAnim]);

  return (
    <View style={styles.wrap}>
      {/* 섹션 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          {/* 제목 + 연도 드롭다운 */}
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>독서 통계</Text>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={openPicker}
              activeOpacity={0.7}
            >
              <Text style={styles.yearText}>{year}년</Text>
              <MaterialIcons
                name="arrow-forward-ios"
                size={17}
                color={colors.primary[500]}
                style={{ marginLeft: 4, transform: [{ rotate: "90deg" }] }} // 아래 방향처럼 보이게 회전
              />
            </TouchableOpacity>
          </View>

          {/* 캡션 */}
          <Text style={styles.caption}>완독으로 표시된 책 기준이에요</Text>
        </View>
      </View>

      {/* 막대 그래프 */}
      <View style={styles.chartContainer}>
        <View style={styles.barRow}>
          {monthData.map((item, index) => {
            const targetHeight = (item.count / maxCount) * BAR_MAX_HEIGHT || 0;

            const animatedHeight = barAnim[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetHeight],
            });

            return (
              <View
                key={item.month}
                style={styles.barWrapper}
              >
                {/* 막대 위 숫자 */}
                <Text style={styles.barValue}>
                  {item.count > 0 ? item.count : ""}
                </Text>

                {/* 막대 영역 */}
                <View style={styles.barOuter}>
                  <Animated.View
                    style={[styles.barInner, { height: animatedHeight }]}
                  >
                    <LinearGradient
                      colors={[colors.primary[400], colors.primary[100]]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.barGradient}
                    />
                  </Animated.View>
                </View>
              </View>
            );
          })}
        </View>

        {/* x축 라인 */}
        <View style={styles.axisLine} />

        {/* 월 라벨 줄 */}
        <View style={styles.monthLabelRow}>
          {monthData.map((item) => (
            <View
              key={item.month}
              style={styles.monthLabelWrapper}
            >
              <Text style={styles.monthLabel}>{item.month}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 연 / 월 선택 모달 */}
      <YearMonthPicker
        visible={pickerVisible}
        onClose={closePicker}
        selectedYear={year}
        selectedMonth={month}
        onSelectYear={onChangeYear}
        onSelectMonth={onChangeMonth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sectionGap,
  },

  header: {
    marginBottom: spacing.m,
  },
  titleBlock: {
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  sectionTitle: {
    ...typography["heading-1-medium"],
    color: colors.mono[950],
    fontWeight: "600",
  },
  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  yearText: {
    ...typography["heading-1-medium"],
    color: colors.primary[500],
    fontWeight: "600",
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.primary[500],
  },
  caption: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
  },

  chartContainer: {
    height: 265,
    paddingHorizontal: spacing.s,
    paddingTop: spacing.sectionGap,
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
  },
  barWrapper: {
    width: 23,
    alignItems: "center",
  },
  barValue: {
    ...typography["detail-regular"],
    color: colors.mono[950],
    marginBottom: spacing.s,
  },
  barOuter: {
    height: BAR_MAX_HEIGHT,
    justifyContent: "flex-end",
  },
  barInner: {
    width: 23,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    overflow: "hidden",
  },
  barGradient: {
    flex: 1,
  },
  monthLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  monthLabelWrapper: {
    width: 23,
    alignItems: "center",
  },
  monthLabel: {
    ...typography["detail-regular"],
    color: colors.mono[950],
  },
  axisLine: {
    height: 1.5,
    backgroundColor: colors.mono[950],
    marginTop: spacing.s,
  },
});
