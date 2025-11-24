import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const ANIMATION_DURATION = 1000;
const MIN_GAP = 6; // 텍스트들끼리 최소 간격
const MAX_SPIRAL_STEPS = 500;

// 두 사각형이 겹치는지 체크 (gap 만큼 여유)
function isRectOverlap(a, b, gap = MIN_GAP) {
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  );
}

// 나선형으로 돌면서 겹치지 않는 위치 찾기
function computeSpiralPositions(sizes, containerWidth, containerHeight) {
  const placed = [];
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  const maxRadius = Math.min(containerWidth, containerHeight) / 2;

  sizes.forEach(({ width, height }) => {
    let angle = Math.random() * Math.PI * 2; // 랜덤 시작각
    let radius = 0;
    let found = false;
    let x = 0;
    let y = 0;

    for (let step = 0; step < MAX_SPIRAL_STEPS; step++) {
      x = centerX + radius * Math.cos(angle) - width / 2;
      y = centerY + radius * Math.sin(angle) - height / 2;

      const rect = { x, y, width, height };

      const inside =
        x >= 0 &&
        y >= 0 &&
        x + width <= containerWidth &&
        y + height <= containerHeight;

      if (inside && !placed.some((p) => isRectOverlap(rect, p, MIN_GAP))) {
        found = true;
        break;
      }

      angle += 0.35;
      radius += 2;

      if (radius > maxRadius) {
        radius = 0;
      }
    }

    if (!found) {
      // 실패하면 그냥 중앙 근처에 박아버리기 (최악 케이스용)
      x = Math.max(0, Math.min(containerWidth - width, centerX - width / 2));
      y = Math.max(0, Math.min(containerHeight - height, centerY - height / 2));
    }

    placed.push({ x, y, width, height });
  });

  return placed;
}

export default function KeywordReviewCard({
  year,
  month,
  keywords,
  animateKey,
}) {
  const offsetsRef = useRef([]);
  const sizeRef = useRef([]); // 각 단어의 width/height 측정용
  const [containerSize, setContainerSize] = useState(null);
  const [positions, setPositions] = useState(null);
  const [measuredReady, setMeasuredReady] = useState(false);

  const lastAnimateKeyRef = useRef(0);

  // 키워드 개수가 바뀌면 상태 리셋
  useEffect(() => {
    sizeRef.current = [];
    setPositions(null);
    setMeasuredReady(false);
    offsetsRef.current = [];
    lastAnimateKeyRef.current = 0;
  }, [keywords?.length]);

  // Animated.ValueXY 초기화
  if (offsetsRef.current.length !== (keywords?.length || 0)) {
    offsetsRef.current = (keywords || []).map(
      (_, i) => offsetsRef.current[i] || new Animated.ValueXY({ x: 0, y: 0 }),
    );
  }

  const handleContainerLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const handleMeasure = (index, e) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current[index] = { width, height };

    if (
      keywords &&
      sizeRef.current.filter(Boolean).length === keywords.length
    ) {
      setMeasuredReady(true);
    }
  };

  // 단어 크기 측정 완료되면 스파이럴 위치 계산
  useEffect(() => {
    if (!keywords || keywords.length === 0) return;
    if (!containerSize) return;
    if (!measuredReady) return;

    const sizes = sizeRef.current.slice(0, keywords.length);

    const rects = computeSpiralPositions(
      sizes,
      containerSize.width,
      containerSize.height,
    );

    setPositions(rects);
  }, [measuredReady, keywords, containerSize]);

  // animateKey가 바뀔 때마다 중앙에서 스파이럴 위치로 다시 애니메이션
  useEffect(() => {
    if (!keywords || keywords.length === 0) return;
    if (!containerSize) return;
    if (!positions) return;
    if (!animateKey) return;
    if (lastAnimateKeyRef.current === animateKey) return; // 같은 키로 중복 실행 방지

    lastAnimateKeyRef.current = animateKey;

    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    // 시작점은 컨테이너 중앙 근처
    offsetsRef.current.forEach((value) => {
      value.setValue({
        x: centerX + (Math.random() - 0.5) * 10,
        y: centerY + (Math.random() - 0.5) * 10,
      });
    });

    // 각 단어를 자기 자리로 부드럽게 이동
    offsetsRef.current.forEach((value, i) => {
      const target = positions[i];

      Animated.timing(value, {
        toValue: { x: target.x, y: target.y },
        duration: ANIMATION_DURATION,
        delay: i * 40,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [animateKey, keywords, containerSize, positions]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>키워드 리뷰</Text>
      <Text style={styles.subtitle}>나의 별점을 기준으로 작성된 표에요</Text>

      <View
        style={styles.cloudContainer}
        onLayout={handleContainerLayout}
      >
        {/* 측정용 숨겨진 텍스트 (width / height만 얻기) */}
        {(keywords || []).map((k, index) => {
          const fontSize = 16 + k.weight * 4;
          const fontWeight = k.weight > 1 ? "700" : "400";

          return (
            <Text
              key={`measure-${k.word}-${index}`}
              style={[
                styles.keywordText,
                {
                  fontSize,
                  fontWeight,
                  position: "absolute",
                  opacity: 0,
                },
              ]}
              onLayout={(e) => handleMeasure(index, e)}
            >
              {k.word}
            </Text>
          );
        })}

        {/* 실제 보여지는 애니메이션 텍스트 (absolute + spiral 배치) */}
        {containerSize &&
          positions &&
          (keywords || []).map((k, index) => {
            const offset = offsetsRef.current[index];
            const fontSize = 16 + k.weight * 4;
            const fontWeight = k.weight > 1 ? "700" : "400";

            return (
              <Animated.View
                key={`${k.word}-${index}`}
                style={[
                  styles.keywordAbsolute,
                  {
                    transform: [
                      { translateX: offset?.x || 0 },
                      { translateY: offset?.y || 0 },
                    ],
                  },
                ]}
              >
                <Text style={[styles.keywordText, { fontSize, fontWeight }]}>
                  {k.word}
                </Text>
              </Animated.View>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 350,
    marginTop: spacing.l,
    padding: spacing.l,
    borderRadius: radius[500],
    backgroundColor: colors.mono[100],
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
  cloudContainer: {
    flex: 1,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  keywordAbsolute: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  keywordText: {
    color: colors.primary[600],
  },
});
