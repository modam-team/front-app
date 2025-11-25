import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

const SIZE = 167;
const STROKE_WIDTH = 55;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;
const ANIMATION_DURATION = 1000;

const MIN_DEG = 8; // 각 장르가 최소로 가지는 각도 (조금씩이라도 보이게)
const EMPHASIS = 1.4; // 1보다 크면, 큰 비율은 더 크게 & 작은 비율은 더 작게

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

const SEGMENT_COLORS = [
  colors.primary[100],
  colors.primary[150],
  colors.primary[200],
  colors.primary[300],
  colors.primary[400],
  colors.primary[500],
  colors.primary[600],
  colors.primary[700],
  colors.primary[800],
  colors.primary[850],
  colors.primary[900],
];

function generateColorNearPrimary(index) {
  const BASE_HUE = 100; // primary 평균 Hue
  const HUE_VARIATION = 15; // 85° ~ 115° 사이

  const hue = BASE_HUE + ((index * 10) % (HUE_VARIATION * 2)) - HUE_VARIATION;

  // primary 팔레트 톤과 유사하게
  const saturation = 40 + (index % 3) * 8; // 40 ~ 56%
  const lightness = 35 + (index % 4) * 7; // 35~ 56%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getSegmentColor(index) {
  if (index < SEGMENT_COLORS.length) return SEGMENT_COLORS[index];
  return generateColorNearPrimary(index);
}

export default function GenrePreferenceCard({ genres, animateKey }) {
  const progressAnimRef = useRef(new Animated.Value(0));
  const hasAnimatedOnceRef = useRef(false);
  const lastAnimateKeyRef = useRef(null);

  const [progress, setProgress] = useState(0);

  // 비율 -> 각도 분배
  const segments = useMemo(() => {
    if (!genres || genres.length === 0) return [];

    // ratio 큰 순으로 정렬
    const sortedGenres = [...genres].sort(
      (a, b) => (b.ratio || 0) - (a.ratio || 0),
    );

    // 원래 비율 계산
    const total = sortedGenres.reduce((t, g) => t + (g.ratio || 0), 0) || 1;
    const rawRatios = sortedGenres.map((g) => (g.ratio || 0) / total);

    // 비율에 지수 줘서 차이가 잘 보이게
    const emphasized = rawRatios.map((r) => Math.pow(r, EMPHASIS));
    const emphasizedSum = emphasized.reduce((a, b) => a + b, 0) || 1;

    // 모든 장르에 대해 최소 각도 확보해두기
    const reservedAngle = MIN_DEG * sortedGenres.length; // 전체에서 빼놓을 각도
    const variableAngleTotal = Math.max(360 - reservedAngle, 0);

    let startAngle = -90;

    return sortedGenres.map((g, i) => {
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
        color: getSegmentColor(i),
      };

      startAngle += angle;
      return seg;
    });
  }, [genres]);

  // 상위 3개
  const top3Segments = useMemo(() => {
    if (!segments || segments.length === 0) return [];
    return [...segments].sort((a, b) => b.rawRatio - a.rawRatio).slice(0, 3);
  }, [segments]);

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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>최근 선호 장르</Text>
      <Text style={styles.subtitle}>나의 별점을 기준으로 작성된 표예요</Text>

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
                stroke={colors.mono[0]}
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
        {top3Segments.length > 0 && (
          <View style={styles.top3}>
            {top3Segments.map((seg) => {
              const percent = Math.round(seg.rawRatio * 100);

              return (
                <View
                  key={`legend-${seg.name}`}
                  style={styles.top3Item}
                >
                  <View style={styles.top3Left}>
                    <View
                      style={[styles.colorDot, { backgroundColor: seg.color }]}
                    />
                    <Text style={styles.top3Label}>{seg.name}</Text>
                  </View>

                  <Text style={styles.top3Value}>
                    {seg.count} ({percent}%)
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 350,
    width: 300,
    padding: spacing.l,
    borderRadius: radius[500],
    backgroundColor: colors.primary[0],
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
    marginTop: spacing.m,
  },
  chartWrap: {
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  top3: {
    marginTop: spacing.m,
    width: "100%",
    gap: 8,
  },
  top3Item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  top3Left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  top3Label: {
    ...typography["body-regular"],
    color: colors.mono[950],
  },
  top3Value: {
    ...typography["body-regular"],
    color: colors.mono[950],
  },
});
