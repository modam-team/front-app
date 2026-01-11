import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

const SIZE = 193;
const DONUT_SIZE = 167; // 실제 도넛 지름
const STROKE_WIDTH = 55;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
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
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

// start -> end 원호 path
function describeArc(cx, cy, r, start, end) {
  const sweep = end - start;

  if (sweep >= 359.999) {
    const startPt = polarToCartesian(cx, cy, r, start);
    const midPt = polarToCartesian(cx, cy, r, start + 180);

    return `M ${startPt.x} ${startPt.y}
            A ${r} ${r} 0 1 1 ${midPt.x} ${midPt.y}
            A ${r} ${r} 0 1 1 ${startPt.x} ${startPt.y}`;
  }

  const startPt = polarToCartesian(cx, cy, r, start);
  const endPt = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start <= 180 ? "0" : "1";

  return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
}

function buildTopNWithEtc(genres, topN) {
  if (!Array.isArray(genres) || genres.length === 0) return [];

  const sorted = [...genres].sort((a, b) => {
    const diff = (b.ratio || 0) - (a.ratio || 0);
    if (diff !== 0) return diff;
    // 동률: 가나다순
    return String(a.name || "").localeCompare(String(b.name || ""), "ko");
  });

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

  const popAnimRef = useRef(new Animated.Value(0));
  const [pop, setPop] = useState(0);

  const [selectedName, setSelectedName] = useState(null);
  const [isReady, setIsReady] = useState(false); // 초기 애니메이션 끝나면 true

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

    let startAngle = 0;

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
    const popAnim = popAnimRef.current;

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
    popAnim.stopAnimation();

    progressAnim.setValue(0);
    popAnim.setValue(0);
    setProgress(0);
    setPop(0);
    setIsReady(false);
    setSelectedName(null);

    const id = progressAnim.addListener(({ value }) => setProgress(value));
    const id2 = popAnim.addListener(({ value }) => setPop(value));

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      progressAnim.removeListener(id);

      if (!finished) return;

      // 채우기 끝나면 기본 선택을 1등으로 잡고, 이제부터 도넛 조각을 선택 가능하게
      const first = segments[0];
      setSelectedName(first?.name ?? null);
      setIsReady(true);

      // 선택 팝 애니메이션(=초기엔 1등이 팝)
      popAnim.setValue(0);
      setPop(0);

      // 채우기 끝나면 1등만 팝업
      Animated.timing(popAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        popAnim.removeListener(id2);
      });
    });

    return () => {
      progressAnim.removeListener(id);
      popAnim.removeListener(id2);
    };
  }, [segments, animateKey]);

  useEffect(() => {
    if (!isReady) return;
    if (!selectedName) return;
    if (progress < 0.999) return; // 혹시 몰라서

    const popAnim = popAnimRef.current;

    popAnim.stopAnimation();
    popAnim.setValue(0);
    setPop(0);

    const id = popAnim.addListener(({ value }) => setPop(value));

    Animated.timing(popAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      popAnim.removeListener(id);
    });

    return () => popAnim.removeListener(id);
  }, [selectedName, isReady, progress]);

  const globalAngle = 360 * progress;

  const winner = segments[0];
  const activeName = selectedName ?? winner?.name; // 초기엔 1등, 이후엔 선택
  const activeSeg = segments.find((s) => s.name === activeName);

  const POP_DELTA = 5;

  const activeR = RADIUS + POP_DELTA * pop;
  const activeSW = STROKE_WIDTH + POP_DELTA * 2 * pop;

  const leftCol = segments.slice(0, 3);
  const rightCol = segments.slice(3, 6);

  const isPopping = pop > 0;

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
                const isActive = activeName && seg.name === activeName;
                if (isActive && isPopping) return null;

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
                    onPress={() => {
                      if (!isReady) return;
                      setSelectedName(seg.name);
                    }}
                  />
                );
              })}

              {activeSeg && progress >= 0.999 && pop > 0 && (
                <Path
                  d={describeArc(
                    CENTER,
                    CENTER,
                    activeR,
                    activeSeg.startAngle,
                    activeSeg.endAngle,
                  )}
                  stroke={activeSeg.color}
                  strokeWidth={activeSW}
                  fill="none"
                  strokeLinecap="butt"
                />
              )}
            </G>
          </Svg>
        </View>

        {/* 도넛 하단에 보여줄 top6 장르 */}
        {segments.length > 0 && (
          <View style={styles.legendWrap}>
            <View style={styles.legendCol}>
              {leftCol.map((seg, idx) => {
                const isActive = activeName && seg.name === activeName;
                const dotScale = isActive ? 1 + 0.25 * pop : 1; // dot도 같이 pop

                return (
                  <Animated.View
                    key={`legend-l-${seg.name}-${idx}`}
                    style={styles.legendItem}
                  >
                    <Animated.View
                      style={[
                        styles.colorDot,
                        { backgroundColor: seg.color },
                        isActive && { transform: [{ scale: dotScale }] },
                      ]}
                    />
                    <Animated.Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.legendLabel,
                        { color: styleSet.legendTextColor },
                        isActive && styles.legendWinnerLabel,
                      ]}
                    >
                      {seg.name}
                    </Animated.Text>
                  </Animated.View>
                );
              })}
            </View>

            <View style={styles.legendCol}>
              {rightCol.map((seg, idx) => {
                const isActive = activeName && seg.name === activeName;

                const dotScale = isActive ? 1 + 0.25 * pop : 1;

                return (
                  <Animated.View
                    key={`legend-r-${seg.name}-${idx}`}
                    style={styles.legendItem}
                  >
                    <Animated.View
                      style={[
                        styles.colorDot,
                        { backgroundColor: seg.color },
                        isActive && { transform: [{ scale: dotScale }] },
                      ]}
                    />
                    <Animated.Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.legendLabel,
                        { color: styleSet.legendTextColor },
                        isActive && styles.legendWinnerLabel,
                      ]}
                    >
                      {seg.name}
                    </Animated.Text>
                  </Animated.View>
                );
              })}
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

  legendWinnerLabel: {
    fontWeight: "700",
  },
});
