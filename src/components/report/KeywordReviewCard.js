import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { InteractionManager } from "react-native";

const ANIMATION_DURATION = 1000;
const MIN_GAP = 6; // 텍스트들끼리 최소 간격
const MAX_SPIRAL_STEPS = 500;

const MIN_FONT = 16; // 최소 폰트
const MAX_FONT = 32; // 최대 폰트

const CLOUD_PADDING_X = 4;
const CLOUD_PADDING_Y = 12;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

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
      // 실패하면 그냥 중앙 근처에 박아버리기
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
  isActive,
}) {
  const offsetsRef = useRef([]);
  const sizeRef = useRef([]); // 각 단어의 width/height 측정용
  const [containerSize, setContainerSize] = useState(null);
  const [positions, setPositions] = useState(null);
  const [measuredReady, setMeasuredReady] = useState(false);

  const [offsets, setOffsets] = useState([]);
  const lastAnimateKeyRef = useRef(-1);

  const [measureKey, setMeasureKey] = useState(0);

  const len = keywords?.length ?? 0;

  // 키워드 개수가 바뀌면 상태 리셋
  useEffect(() => {
    offsets.forEach((v) => v.stopAnimation());

    setOffsets(
      Array.from({ length: len }, () => new Animated.ValueXY({ x: 0, y: 0 })),
    );

    sizeRef.current = [];
    setPositions(null);
    setMeasuredReady(false);
    lastAnimateKeyRef.current = -1;

    setMeasureKey((k) => k + 1);
  }, [year, month, len]);

  const handleContainerLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const handleMeasure = (index, e) => {
    const { width, height } = e.nativeEvent.layout;

    sizeRef.current[index] = { width, height };

    const measuredCount = sizeRef.current.filter(Boolean).length;

    if (keywords && measuredCount === keywords.length) {
      setMeasuredReady(true);
    }
  };

  // 단어 크기 측정 완료되면 스파이럴 위치 계산
  useEffect(() => {
    if (len === 0) return;
    if (!containerSize) return;
    if (!measuredReady) return;

    const sizes = sizeRef.current.slice(0, len);

    const innerWidth = Math.max(0, containerSize.width - CLOUD_PADDING_X * 2);
    const innerHeight = Math.max(0, containerSize.height - CLOUD_PADDING_Y * 2);

    const rectsInner = computeSpiralPositions(sizes, innerWidth, innerHeight);

    const rects = rectsInner.map((r, i) => {
      const w = sizes[i]?.width ?? r.width;
      const h = sizes[i]?.height ?? r.height;

      const x = r.x + CLOUD_PADDING_X;
      const y = r.y + CLOUD_PADDING_Y;

      // container 기준으로 절대 안 넘게 한 번 더 clamp
      const safeX = Math.max(
        CLOUD_PADDING_X,
        Math.min(containerSize.width - CLOUD_PADDING_X - w, x),
      );
      const safeY = Math.max(
        CLOUD_PADDING_Y,
        Math.min(containerSize.height - CLOUD_PADDING_Y - h, y),
      );

      return { ...r, x: safeX, y: safeY, width: w, height: h };
    });

    setPositions(rects);
  }, [len, measuredReady, containerSize]);

  // animateKey가 바뀔 때마다 중앙에서 스파이럴 위치로 다시 애니메이션
  useEffect(() => {
    if (!isActive) return;
    if (len === 0) return;
    if (!containerSize) return;
    if (!positions) return;
    if (!offsets || offsets.length !== len) return;

    if (lastAnimateKeyRef.current === animateKey) return;
    lastAnimateKeyRef.current = animateKey;

    // 이전 애니메이션들 확실히 정지
    offsets.forEach((v) => v.stopAnimation());

    // 시작 위치 먼저 세팅
    offsets.forEach((value) => {
      const startX = Math.random() * containerSize.width;
      const startY = Math.random() * containerSize.height;
      value.setValue({ x: startX, y: startY });
    });

    // 스크롤/전환/레이아웃 등 인터랙션 끝난 다음 + 2프레임 뒤에 시작
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const anims = offsets
            .map((value, i) => {
              const target = positions[i];
              if (!target) return null;

              return Animated.timing(value, {
                toValue: { x: target.x, y: target.y },
                duration: ANIMATION_DURATION,
                delay: i * 40,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              });
            })
            .filter(Boolean);

          Animated.stagger(40, anims).start();
        });
      });
    });

    return () => {
      task?.cancel?.();
    };
  }, [isActive, animateKey, len, containerSize, positions, offsets]);

  const readyToAnimate =
    isActive && containerSize && positions && offsets.length === len;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>키워드 리뷰</Text>
      <Text style={styles.subtitle}>
        나의 리뷰 해시태그 기준으로 분석된 표예요
      </Text>

      <View
        style={styles.cloudContainer}
        onLayout={handleContainerLayout}
      >
        {/* 측정용 숨겨진 텍스트 (width / height만 얻기) */}
        {(keywords || []).map((k, index) => {
          const fontSize = clamp(16 + k.weight * 4, MIN_FONT, MAX_FONT);
          const fontWeight = k.weight > 1 ? "700" : "400";

          return (
            <Text
              collapsable={false}
              key={`measure-${measureKey}-${k.word}-${index}`}
              style={[
                styles.keywordText,
                {
                  fontSize,
                  fontWeight,
                  position: "absolute",
                  left: 0,
                  top: index * 2,
                  opacity: 0,
                  pointerEvents: "none",
                },
              ]}
              onLayout={(e) => handleMeasure(index, e)}
            >
              {k.word}
            </Text>
          );
        })}

        {/* 실제 보여지는 애니메이션 텍스트 (absolute + spiral 배치) */}
        {readyToAnimate &&
          (keywords || []).map((k, index) => {
            const offset = offsets[index];

            const fontSize = clamp(16 + k.weight * 4, MIN_FONT, MAX_FONT);
            const fontWeight = k.weight > 1 ? "700" : "400";

            return (
              <Animated.View
                key={`${k.word}-${index}`}
                style={[
                  styles.keywordAbsolute,
                  offset ? { transform: offset.getTranslateTransform() } : null,
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
    width: 300,
    height: 373,
    padding: spacing.l,
    borderRadius: radius[500],
    backgroundColor: colors.mono[0],
    alignSelf: "center",
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
    width: 250,
    alignSelf: "center",
    overflow: "hidden",
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
