import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

const SIZE = 193;
const STROKE_WIDTH = 55;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;
const ANIMATION_DURATION = 1000;

const MIN_DEG = 8; // 각 장르가 최소로 가지는 각도 (조금씩이라도 보이게)
const EMPHASIS = 1.4; // 1보다 크면, 큰 비율은 더 크게 & 작은 비율은 더 작게

const TOP_N = 6; // 상위 5개 장르 + 기타

const currentStyle = {
  titleColor: colors.mono[950],
  subtitleColor: colors.mono[950],
  legendTextColor: colors.mono[950],
  trackColor: colors.mono[0],
};

const pastStyle = {
  titleColor: colors.mono[950],
  subtitleColor: colors.mono[950],
  legendTextColor: colors.mono[950],
  trackColor: colors.mono[50],
};

const SEGMENT_COLORS = [
  colors.primary[500],
  colors.primary[400],
  colors.primary[300],
  colors.primary[200],
  colors.primary[100],
  colors.primary[50],
];

// 각도를 좌표로 변환
function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// start -> end 원호 path
function describeArc(cx, cy, r, start, end) {
  const startPt = polarToCartesian(cx, cy, r, end);
  const endPt = polarToCartesian(cx, cy, r, start);
  const largeArc = end - start <= 180 ? "0" : "1";

  return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 0 ${endPt.x} ${endPt.y}`;
}

function buildTopNWithEtc(genres, topN) {
  if (!Array.isArray(genres) || genres.length === 0) return [];

  const sorted = [...genres].sort((a, b) => (b.ratio || 0) - (a.ratio || 0));

  const top = sorted.slice(0, topN - 1);
  const rest = sorted.slice(topN - 1);

  const restCount = rest.reduce((acc, cur) => acc + (cur.count || 0), 0);
  const restRatio = rest.reduce((acc, cur) => acc + (cur.ratio || 0), 0);

  if (rest.length > 0 && (restCount > 0 || restRatio > 0)) {
    top.push({
      name: "기타",
      count: restCount,
      ratio: restRatio,
      __isEtc: true,
    });
  }

  return top;
}

export default function GenrePreferenceCard({
  genres,
  animateKey,
  isCurrentMonth,
}) {
  const styleSet = isCurrentMonth ? currentStyle : pastStyle;

  const progressAnimRef = useRef(new Animated.Value(0));
  const hasAnimatedOnceRef = useRef(false);
  const lastAnimateKeyRef = useRef(null);

  const [progress, setProgress] = useState(0);

  // 상위 5개 + 기타로 만들기
  const normalizedGenres = useMemo(
    () => buildTopNWithEtc(genres, TOP_N),
    [genres],
  );

  // 비율 -> 각도 분배
  const segments = useMemo(() => {
    if (!normalizedGenres || normalizedGenres.length === 0) return [];

    // 원래 비율 계산
    const total = normalizedGenres.reduce((t, g) => t + (g.ratio || 0), 0) || 1;
    const rawRatios = normalizedGenres.map((g) => (g.ratio || 0) / total);

    // 비율에 지수 줘서 차이가 잘 보이게
    const emphasized = rawRatios.map((r) => Math.pow(r, EMPHASIS));
    const emphasizedSum = emphasized.reduce((a, b) => a + b, 0) || 1;

    // 모든 장르에 대해 최소 각도 확보해두기
    const reservedAngle = MIN_DEG * normalizedGenres.length; // 전체에서 빼놓을 각도
    const variableAngleTotal = Math.max(360 - reservedAngle, 0);

    let startAngle = -90;

    return normalizedGenres.map((g, i) => {
      const ratio = emphasized[i] / emphasizedSum;

      // 실제로 이 장르가 차지할 각도
      const angle = MIN_DEG + ratio * variableAngleTotal;

      const seg = {
        name: g.name,
        ratio,
        rawRatio: rawRatios[i],
        count: g.count,
        startAngle,
        endAngle: startAngle + angle,
        color: SEGMENT_COLORS[i],
      };

      startAngle += angle;
      return seg;
    });
  }, [normalizedGenres]);

  // 애니메이션 실행
  useEffect(() => {
    if (!segments || segments.length === 0) return;

    const progressAnim = progressAnimRef.current;

    // 최초 1번 실행
    if (animateKey == null) {
      if (hasAnimatedOnceRef.current) return;
      hasAnimatedOnceRef.current = true;
    }

    // animateKey 변화 감지
    if (animateKey != null) {
      if (lastAnimateKeyRef.current === animateKey) return;
      lastAnimateKeyRef.current = animateKey;
    }

    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    const id = progressAnim.addListener(({ value }) => setProgress(value));

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      progressAnim.removeListener(id);
    });

    return () => progressAnim.removeListener(id);
  }, [segments, animateKey]);

  const globalAngle = -90 + 360 * progress;

  const leftCol = segments.slice(0, 3);
  const rightCol = segments.slice(3, 6);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>최근 선호 장르</Text>
      <Text style={styles.subtitle}>내가 완독한 책 기준으로 분석된 표예요</Text>

      <View style={styles.chartContainer}>
        <View style={styles.chartWrap}>
          <Svg
            width={SIZE}
            height={SIZE}
          >
            <G>
              {/* 배경 원 */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={styleSet.trackColor}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />

              {/* 채워지는 막대 */}
              {segments.map((seg, index) => {
                if (globalAngle <= seg.startAngle) return null;
                const end = Math.min(globalAngle, seg.endAngle);
                if (end <= seg.startAngle) return null;

                const d = describeArc(
                  CENTER,
                  CENTER,
                  RADIUS,
                  seg.startAngle,
                  end,
                );

                return (
                  <Path
                    key={`${seg.name}-${index}`}
                    d={d}
                    stroke={seg.color}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeLinecap="butt"
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        {/* 도넛 하단에 보여줄 top3 장르 */}
        {segments.length > 0 && (
          <View style={styles.legendWrap}>
            <View style={styles.legendCol}>
              {leftCol.map((seg, idx) => (
                <View
                  key={`legend-l-${seg.name}-${idx}`}
                  style={styles.legendItem}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: seg.color }]}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.legendLabel,
                      { color: styleSet.legendTextColor },
                    ]}
                  >
                    {seg.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.legendCol}>
              {rightCol.map((seg, idx) => (
                <View
                  key={`legend-r-${seg.name}-${idx}`}
                  style={styles.legendItem}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: seg.color }]}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.legendLabel,
                      { color: styleSet.legendTextColor },
                    ]}
                  >
                    {seg.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 373,
    width: 300,
    paddingHorizontal: spacing.l,
    paddingVertical: 20,
    borderRadius: radius[500],
    backgroundColor: colors.mono[0],
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.mono[950],
  },
  subtitle: {
    ...typography["detail-regular"],
    color: colors.mono[950],
  },

  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  chartWrap: {
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },

  legendWrap: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 37,
  },

  legendCol: {
    width: "40%",
    flexDirection: "column",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  colorDot: {
    width: 13,
    height: 13,
    marginRight: 7,
  },

  legendLabel: {
    ...typography["detail-regular"],
    color: colors.mono[950],
    flexShrink: 1, // 긴 장르명 말줄임 되게
  },
});
