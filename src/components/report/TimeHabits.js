import { spacing } from "../../theme/spacing";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const MIN_SEGMENT_PERCENT = 5;
const MAX_DAY_WIDTH = 90;
const BAR_HEIGHT = 24;
const WEEKDAY_COUNT = 7;

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
      <Text style={styles.title}>책을 읽는 시간을{"\n"}분석해볼게요</Text>
      <Text style={styles.caption}>이번 달 평균치예요</Text>

      <View style={styles.list}>
        {/* 세로선 */}
        <View style={styles.verticalDivider} />

        {weekdayWithTotal.map((item) => {
          const { morning, afternoon, evening } = item.slots;
          const total = item.total;
          const max = maxTotal || 1;

          let morningWidth;
          let afternoonWidth;
          let eveningWidth;

          // ---- total = 0일 경우 ----
          if (total === 0) {
            const baseDayWidth = 40;
            const seg = MIN_SEGMENT_PERCENT;

            const sum = seg * 3;
            const scale = baseDayWidth / sum;

            morningWidth = seg * scale;
            afternoonWidth = morningWidth + seg * scale;
            eveningWidth = morningWidth + seg * scale + seg * scale;
          } else {
            // ---- 전체 요일 길이 ----
            const baseDayWidth = (total / max) * MAX_DAY_WIDTH;

            // 실제 기여분
            const morningPart = (morning / total) * baseDayWidth;
            const afternoonPart = (afternoon / total) * baseDayWidth;
            const eveningPart = (evening / total) * baseDayWidth;

            // 최소 5% 보장
            const mLen =
              morning === 0
                ? MIN_SEGMENT_PERCENT
                : Math.max(morningPart, MIN_SEGMENT_PERCENT);
            const aLen =
              afternoon === 0
                ? MIN_SEGMENT_PERCENT
                : Math.max(afternoonPart, MIN_SEGMENT_PERCENT);
            const eLen =
              evening === 0
                ? MIN_SEGMENT_PERCENT
                : Math.max(eveningPart, MIN_SEGMENT_PERCENT);

            const sum = mLen + aLen + eLen;

            const scale = sum > 0 ? baseDayWidth / sum : 1;

            const mAdj = mLen * scale;
            const aAdj = aLen * scale;
            const eAdj = eLen * scale;

            // 누적
            morningWidth = mAdj;
            afternoonWidth = mAdj + aAdj;
            eveningWidth = mAdj + aAdj + eAdj;
          }

          // 안전하게 100% 이내로
          const clamp = (v) => Math.min(v, 100);

          const morningWidthStr = `${clamp(morningWidth)}%`;
          const afternoonWidthStr = `${clamp(afternoonWidth)}%`;
          const eveningWidthStr = `${clamp(eveningWidth)}%`;

          return (
            <View
              key={item.weekday}
              style={styles.row}
            >
              {/* 요일 */}
              <Text style={styles.weekday}>{item.label}</Text>
              {/* 막대 영역 */}
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  {/* Evening */}
                  <LinearGradient
                    colors={[
                      colors.primary[500],
                      colors.primary[500],
                      colors.primary[900],
                    ]}
                    locations={[0, 0.69, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.segment, { width: eveningWidthStr }]}
                  />

                  {/* Afternoon */}
                  <LinearGradient
                    colors={[
                      colors.primary[200],
                      colors.primary[200],
                      colors.primary[400],
                    ]}
                    locations={[0, 0.44, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.segment, { width: afternoonWidthStr }]}
                  />
                  {/* Morning */}
                  <LinearGradient
                    colors={[colors.primary[0], colors.primary[150]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.segment, { width: morningWidthStr }]}
                  />

                  <View
                    pointerEvents="none"
                    style={[styles.countLabel, { left: eveningWidthStr }]}
                  >
                    <Text style={styles.countText}>{item.total}</Text>
                  </View>
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
    backgroundColor: colors.mono[100],
    paddingVertical: 22,
    paddingHorizontal: 29,
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
    marginBottom: spacing.m,
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
    marginLeft: 16,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  countLabel: {
    position: "absolute",
    top: "50%",
    marginLeft: 16 + 8, // 막대 marginLeft(16) + 막대 끝에서 띄울 간격
    transform: [{ translateY: -6 }],
  },
  countText: {
    fontSize: 10,
    fontWeight: "400",
    color: colors.mono[950],
  },
  verticalDivider: {
    position: "absolute",
    left: 16 + 8, // weekday 폭 + 살짝 여백
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.mono[950],
  },
});
