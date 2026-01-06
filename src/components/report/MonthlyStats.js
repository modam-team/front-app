import ReportSectionHeader from "@components/report/ReportSectionHeader";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BAR_MAX_HEIGHT = 227;
const MONTH_COUNT = 12;

const currentMonthStyle = {
  barColor: colors.primary[0],
  dateColor: colors.primary[0],
  textColor: colors.mono[0],
  captionColor: colors.primary[50],
  axisColor: colors.mono[0],
  iconColor: colors.mono[0],
};

const pastMonthStyle = {
  barColor: colors.primary[200],
  dateColor: colors.primary[500],
  textColor: colors.mono[950],
  captionColor: colors.mono[950],
  axisColor: colors.mono[950],
  iconColor: colors.mono[950],
};

export default function MonthlyStats({
  year,
  month,
  monthlyStatus,
  animateKey,
  resetKey,
  onOpenPicker,
  isCurrentMonth,
}) {
  const styleSet = isCurrentMonth ? currentMonthStyle : pastMonthStyle;

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

  // resetKey가 바뀔 때마다 그래프를 0으로 리셋 하기
  useEffect(() => {
    if (resetKey == null) return; // 처음 마운트 시에는 그냥 통과
    barAnim.forEach((v) => v.setValue(0));
  }, [resetKey, barAnim]);

  // animateKey가 바뀔 때마다 아래에서 위로 올라오도록
  useEffect(() => {
    if (!animateKey) return; // 0, undefined일 때는 무시

    const animations = barAnim.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    );

    const anim = Animated.parallel(animations);
    anim.start();

    return () => anim.stop();
  }, [animateKey, barAnim, monthData]);

  return (
    <View style={styles.wrap}>
      {/* 섹션 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          {/* 날짜 및 드롭다운 */}
          <TouchableOpacity
            onPress={onOpenPicker}
            activeOpacity={0.7}
            style={styles.dateRow}
          >
            {/* 선택된 연도 및 월 */}
            <Text style={[styles.dateText, { color: styleSet.dateColor }]}>
              {year}년 {month}월
            </Text>

            <MaterialIcons
              name="arrow-forward-ios"
              size={24}
              color={styleSet.dateColor}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>

          <ReportSectionHeader
            monthVisible={false}
            title="독서 통계"
            caption={
              isCurrentMonth
                ? "완독으로 표시된 책 기준이에요"
                : `${year}년에 완독으로 표시된 책 기준이에요`
            }
            variant={isCurrentMonth ? "current" : "past"}
          />
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

            const labelBottom = Animated.add(animatedHeight, spacing.s);

            return (
              <View
                key={item.month}
                style={styles.barWrapper}
              >
                {/* 막대 영역 */}
                <View style={styles.barOuter}>
                  <Animated.View
                    style={[
                      styles.barInner,
                      {
                        height: animatedHeight,
                        backgroundColor: styleSet.barColor,
                      },
                    ]}
                  />
                </View>

                {/* 막대 위 숫자 */}
                {item.count > 0 && (
                  <Animated.Text
                    style={[
                      styles.barValue,
                      {
                        color: styleSet.textColor,
                        position: "absolute",
                        bottom: labelBottom,
                      },
                    ]}
                  >
                    {item.count}
                  </Animated.Text>
                )}
              </View>
            );
          })}
        </View>

        {/* x축 라인 */}
        <View
          style={[styles.axisLine, { backgroundColor: styleSet.axisColor }]}
        />

        {/* 월 라벨 줄 */}
        <View style={styles.monthLabelRow}>
          {monthData.map((item) => (
            <View
              key={item.month}
              style={styles.monthLabelWrapper}
            >
              <Text style={[styles.monthLabel, { color: styleSet.textColor }]}>
                {item.month}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 42,
  },

  header: {
    marginBottom: 12,
  },
  titleBlock: {
    flexShrink: 1,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.s,
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: 28,
    fontWeight: "600",
  },

  chartContainer: {
    height: 265,
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
  },
  barWrapper: {
    width: 23,
    height: BAR_MAX_HEIGHT,
    alignItems: "center",
    position: "relative",
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
  },

  barOuter: {
    height: BAR_MAX_HEIGHT,
    justifyContent: "flex-end",
  },
  barInner: {
    width: 23,
    overflow: "hidden",
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
    fontSize: 10,
    fontWeight: "400",
  },
  axisLine: {
    height: 1.5,
    marginTop: spacing.s,
  },
});
