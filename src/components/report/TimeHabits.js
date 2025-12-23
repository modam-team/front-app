import { spacing } from "../../theme/spacing";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const BAR_HEIGHT = 24;
const WEEKDAY_COUNT = 7;

const BAR_MAX_PX = 250; // 막대의 최대 길이

export default function TimeHabits({
  readingCountsByWeekday,
  animateKey,
  resetKey,
}) {
  const weekdayWithTotal = useMemo(
    () =>
      (readingCountsByWeekday || []).map((d) => {
        const { morning, afternoon, evening } = d.slots;
        const total = morning + afternoon + evening;

        return {
          ...d,
          total,
        };
      }),
    [readingCountsByWeekday],
  );

  // 월화수목금토일 순서로 재정렬하기
  const orderedWeekdays = useMemo(() => {
    if (!weekdayWithTotal?.length) return [];

    const monToSat = weekdayWithTotal.filter((d) => d.weekday !== 0); // 1~6
    const sun = weekdayWithTotal.find((d) => d.weekday === 0); // 0

    return sun ? [...monToSat, sun] : monToSat;
  }, [weekdayWithTotal]);

  const maxTotal = useMemo(
    () =>
      weekdayWithTotal.reduce(
        (acc, cur) => (cur.total > acc ? cur.total : acc),
        0,
      ),
    [weekdayWithTotal],
  );

  const barAnim = useRef(
    Array.from({ length: WEEKDAY_COUNT }, () => new Animated.Value(0)),
  ).current;

  // resetKey가 바뀔 때마다 0으로 리셋
  useEffect(() => {
    if (resetKey == null) return;
    barAnim.forEach((v) => v.setValue(0));
  }, [resetKey, barAnim]);

  // animateKey 바뀔 때마다 왼쪽에서 오른쪽으로 채우기
  useEffect(() => {
    if (!animateKey) return;

    const animations = barAnim.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width 애니메이션이라 false
      }),
    );

    Animated.parallel(animations).start();
  }, [animateKey, barAnim]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>요일 별 독서 횟수를{"\n"}분석해봤어요</Text>
      <Text style={styles.caption}>이번 달 평균치예요</Text>

      <View style={styles.list}>
        {/* 세로선 */}
        <View style={styles.verticalDivider} />

        {orderedWeekdays.map((item, index) => {
          const { morning, afternoon, evening } = item.slots;
          const total = item.total;
          const max = maxTotal || 1;

          let morningWidth = 0;
          let afternoonWidth = 0;
          let eveningWidth = 0;

          if (total > 0) {
            const baseDayWidth = (BAR_MAX_PX * total) / max;

            const mPart = (morning / total) * baseDayWidth;
            const aPart = (afternoon / total) * baseDayWidth;
            const ePart = (evening / total) * baseDayWidth;

            morningWidth = mPart;
            afternoonWidth = mPart + aPart;
            eveningWidth = baseDayWidth; // 총 길이
          }
          const clampPx = (v) => Math.max(0, Math.min(v, BAR_MAX_PX));
          const morningPx = clampPx(morningWidth);
          const afternoonPx = clampPx(afternoonWidth);
          const eveningPx = clampPx(eveningWidth);

          const progress = barAnim[index];

          const animatedMorningWidth = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, morningPx],
          });
          const animatedAfternoonWidth = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, afternoonPx],
          });
          const animatedEveningWidth = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, eveningPx],
          });

          const animatedCountLeft = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, eveningPx],
          });
          return (
            <View
              key={item.weekday}
              style={[styles.row, index === 0 && { marginTop: 8 }]} // 월요일에만 위에 여백 추가 해주기
            >
              {/* 요일 */}
              <Text style={styles.weekday}>{item.label}</Text>
              {/* 막대 영역 */}
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  {total > 0 ? (
                    <>
                      {/* Evening */}
                      <AnimatedLinearGradient
                        colors={[
                          colors.primary[500],
                          colors.primary[500],
                          colors.primary[900],
                        ]}
                        locations={[0, 0.69, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.segment,
                          { width: animatedEveningWidth },
                        ]}
                      />

                      {/* Afternoon */}
                      <AnimatedLinearGradient
                        colors={[
                          colors.primary[200],
                          colors.primary[200],
                          colors.primary[400],
                        ]}
                        locations={[0, 0.44, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.segment,
                          { width: animatedAfternoonWidth },
                        ]}
                      />

                      {/* Morning */}
                      <AnimatedLinearGradient
                        colors={[colors.primary[0], colors.primary[150]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.segment,
                          { width: animatedMorningWidth },
                        ]}
                      />

                      {/* 총합 라벨도 끝점 따라가게 */}
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.countLabel, { left: animatedCountLeft }]}
                      >
                        <Text style={styles.countText}>{item.total}</Text>
                      </Animated.View>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 436,
    marginTop: 12,
    borderRadius: radius[500],
    backgroundColor: colors.mono[0],
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.mono[950],
    marginBottom: spacing.s,
  },
  caption: {
    ...typography["detail-regular"],
    color: colors.mono[950],
    marginBottom: spacing.m,
  },
  list: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  weekday: {
    width: 16,
    fontSize: 10,
    fontWeight: 400,
    color: colors.mono[950],
    textAlign: "left",
  },
  barWrapper: {
    flex: 1,
  },
  barBackground: {
    height: BAR_HEIGHT,
    justifyContent: "center",
    position: "relative",
  },
  segment: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    marginLeft: 8,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  countLabel: {
    position: "absolute",
    top: "50%",
    marginLeft: 8 + 5, // 막대 marginLeft(16) + 막대 끝에서 띄울 간격
    transform: [{ translateY: -6 }],
  },
  countText: {
    fontSize: 10,
    fontWeight: "400",
    color: colors.mono[950],
  },
  verticalDivider: {
    position: "absolute",
    left: 16, // weekday 폭 + 살짝 여백
    top: 0,
    height: 278,
    width: 1,
    backgroundColor: colors.mono[950],
  },
});
