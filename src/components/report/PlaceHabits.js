import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const N = 4;

// 항상 접해있게 만들 이웃 관계(다이아몬드)
const NEIGHBORS = [
  [0, 1], // A-B
  [0, 2], // A-C
  [1, 3], // B-D
  [2, 3], // C-D
];

// 랭킹 별 폰트
const TEXT_STYLE_BY_RANK = [
  typography["heading-1-medium"],
  typography["heading-2-medium"],
  typography["heading-3-medium"],
  typography["detail-bold"],
];

// 튜닝 파라미터(느낌 조절)
const ITERATIONS = 40; // 한 프레임에서 솔버 반복 횟수
const COLLISION_PUSH = 0.6; // 겹침 밀어내는 강도
const LINK_SPRING = 0.03; // 접하게 당기는 강도
const ANCHOR_PULL = 0.0; // 기본 위치로 당기는 강도
const DAMPING = 0.8; // 속도 감쇠(튀는 느낌 줄이기)

// 반지름 범위 (디자인에 맞게 조절)
const MIN_R = 25;
const MAX_R = 120;

// 카드 패딩(원 클램프용)
const PAD = 16;

// 색(이미지 느낌대로)
const CIRCLE_COLORS = [
  "#3E5E17", // 이동중 (진한 초록)
  "#5F8139", // 카페
  "#A7C08A", // 집
  "#D6F0C8", // 도서관 (연한)
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy) || 0.0001;
}

function easeOutCubic(t) {
  // 살짝 튀어나오는 pop 느낌
  return 1 - Math.pow(1 - t, 3);
}

function popCurve(t) {
  const HOLD = 0.3;
  if (t <= HOLD) return 0;

  const u = (t - HOLD) / (1 - HOLD);
  return easeOutCubic(u);
}

export default function PlaceHabits({ places = [], animateKey, resetKey }) {
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  // progress: 0 -> 1
  const progress = useRef(new Animated.Value(0)).current;

  const textProgress = useRef(new Animated.Value(0)).current;

  // positions (state로 렌더)
  const [pos, setPos] = useState(() =>
    Array.from({ length: N }, () => ({ x: 0, y: 0, r: MIN_R })),
  );

  // 내부 물리 상태(ref로 유지)
  const physics = useRef({
    x: Array(N).fill(0),
    y: Array(N).fill(0),
    vx: Array(N).fill(0),
    vy: Array(N).fill(0),
  }).current;

  // 데이터 정규화 + targetR 계산
  const targets = useMemo(() => {
    const safe = places.slice(0, 4);
    while (safe.length < 4) safe.push({ label: "", ratio: 0 });

    const sum = safe.reduce((a, c) => a + (Number(c.ratio) || 0), 0);
    const norm =
      sum > 0
        ? safe.map((p) => (Number(p.ratio) || 0) / sum)
        : [0.4, 0.3, 0.2, 0.1];

    const gamma = 1;
    const eased = norm.map((t) => Math.pow(t, gamma));
    const easedSum = eased.reduce((a, c) => a + c, 0);
    const final = eased.map((t) => (easedSum ? t / easedSum : 0.25));

    // radius 매핑
    const targetR = final.map((t) => lerp(MIN_R, MAX_R, t));

    return safe.map((p, i) => ({
      label: p.label,
      ratio: norm[i],
      targetR: targetR[i],
      color: CIRCLE_COLORS[i],
    }));
  }, [places]);

  // anchor(기본 위치) - layout 기반
  const anchors = useMemo(() => {
    const { w, h } = layout;
    if (!w || !h) return null;

    const cx = w * 0.5;
    const cy = h * 0.55;

    // "몰림 정도" (작을수록 더 겹침)
    const spread = Math.min(w, h) * 0.06; // 0.04~0.09 사이로 튜닝 추천

    return [
      { x: cx - spread * 0.9, y: cy - spread * 0.9 }, // A
      { x: cx + spread * 0.9, y: cy - spread * 0.6 }, // B
      { x: cx - spread * 0.7, y: cy + spread * 0.9 }, // C
      { x: cx + spread * 0.8, y: cy + spread * 0.8 }, // D
    ];
  }, [layout]);

  // reset: progress=0, 위치 anchor로 초기화
  useEffect(() => {
    if (!anchors) return;
    if (resetKey == null) return;

    progress.stopAnimation();
    progress.setValue(0);

    for (let i = 0; i < N; i++) {
      physics.x[i] = anchors[i].x;
      physics.y[i] = anchors[i].y;
      physics.vx[i] = 0;
      physics.vy[i] = 0;
    }

    setPos(
      Array.from({ length: N }, (_, i) => ({
        x: anchors[i].x,
        y: anchors[i].y,
        r: MIN_R,
      })),
    );
  }, [resetKey, anchors, progress, physics]);

  // animate
  useEffect(() => {
    if (!anchors) return;
    if (animateKey == null) return;

    progress.stopAnimation();
    progress.setValue(0);
    textProgress.stopAnimation?.(); // (없어도 되는데 안전하게)
    textProgress.setValue(0);

    const CIRCLE_DURATION = 900;
    const SHOW_AT = 0; // 글자 시작
    const TEXT_DELAY = Math.round(CIRCLE_DURATION * SHOW_AT);

    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: CIRCLE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      Animated.timing(textProgress, {
        toValue: 1,
        duration: 220, // 글자 뜨는 속도
        delay: TEXT_DELAY,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true, // opacity만이면 true 가능
      }),
    ]).start();
  }, [animateKey, anchors, progress, textProgress]);

  // 핵심: progress 변화에 맞춰 반지름 커짐 + 솔버로 밀어내기
  useEffect(() => {
    if (!anchors) return;
    if (!layout.w || !layout.h) return;

    let rafId = null;
    let lastT = 0;

    const listenerId = progress.addListener(({ value }) => {
      // requestAnimationFrame으로 한번만 렌더(리스너 과도 호출 방지)
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const t = popCurve(value);

        // 현재 반지름
        const r = targets.map((p) => lerp(MIN_R, p.targetR, t));

        // 솔버 반복
        for (let it = 0; it < ITERATIONS; it++) {
          // 1) 충돌 해결(겹치면 밀기)
          for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
              const d = dist(
                physics.x[i],
                physics.y[i],
                physics.x[j],
                physics.y[j],
              );
              const minD = r[i] + r[j];
              const overlap = minD - d;

              if (overlap > 0) {
                const nx = (physics.x[i] - physics.x[j]) / d;
                const ny = (physics.y[i] - physics.y[j]) / d;

                const push = overlap * COLLISION_PUSH * 0.5;

                physics.x[i] += nx * push;
                physics.y[i] += ny * push;
                physics.x[j] -= nx * push;
                physics.y[j] -= ny * push;
              }
            }
          }

          // 2) 이웃 관계는 "딱 붙게" 스프링(거리 = r_i + r_j)
          for (const [i, j] of NEIGHBORS) {
            const d = dist(
              physics.x[i],
              physics.y[i],
              physics.x[j],
              physics.y[j],
            );
            const want = r[i] + r[j];
            const err = d - want; // +면 너무 멀다(당겨야), -면 너무 가깝다(밀어야)

            const nx = (physics.x[i] - physics.x[j]) / d;
            const ny = (physics.y[i] - physics.y[j]) / d;

            const f = err * LINK_SPRING * 0.5;

            physics.x[i] -= nx * f;
            physics.y[i] -= ny * f;
            physics.x[j] += nx * f;
            physics.y[j] += ny * f;
          }

          // 3) anchor로 약하게 당겨서 형태 유지
          for (let i = 0; i < N; i++) {
            const ax = anchors[i].x;
            const ay = anchors[i].y;

            physics.x[i] += (ax - physics.x[i]) * ANCHOR_PULL;
            physics.y[i] += (ay - physics.y[i]) * ANCHOR_PULL;
          }

          // 4) 카드 안으로 클램프(원이 잘리지 않게)
          for (let i = 0; i < N; i++) {
            physics.x[i] = clamp(
              physics.x[i],
              PAD + r[i],
              layout.w - PAD - r[i],
            );
            physics.y[i] = clamp(
              physics.y[i],
              PAD + r[i],
              layout.h - PAD - r[i],
            );
          }
        }

        // 속도 감쇠(다음 프레임 튐 방지) — 지금은 위치 솔버만이라 단순 댐핑 느낌만
        for (let i = 0; i < N; i++) {
          physics.vx[i] *= DAMPING;
          physics.vy[i] *= DAMPING;
        }

        setPos(
          Array.from({ length: N }, (_, i) => ({
            x: physics.x[i],
            y: physics.y[i],
            r: r[i],
          })),
        );
      });
    });

    return () => {
      progress.removeListener(listenerId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [anchors, layout, progress, targets, physics]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>책을 읽는 장소를{"\n"}분석해 볼게요</Text>
      <Text style={styles.caption}>이번 달 평균치예요</Text>

      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ w: width, h: height });
        }}
      >
        {pos.map((p, i) => {
          const label = targets[i]?.label ?? "";
          const showText = p.r >= 34; // 너무 작으면 글자 숨김(원하면 제거)
          return (
            <View
              key={i}
              style={[
                styles.circle,
                {
                  backgroundColor: targets[i]?.color ?? "#ddd",
                  width: p.r * 2,
                  height: p.r * 2,
                  borderRadius: p.r,
                  left: p.x - p.r,
                  top: p.y - p.r,
                },
              ]}
            >
              {showText ? (
                <Animated.Text
                  style={[
                    TEXT_STYLE_BY_RANK[i], // 랭크별 폰트 적용
                    { color: colors.mono[950] },
                    { opacity: textProgress }, // 마지막에 글자가 써지게
                  ]}
                >
                  {label}
                </Animated.Text>
              ) : null}
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
  stage: {
    flex: 1,
    position: "relative",
  },
  circle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.mono[950],
  },
  circleTextSmall: {
    fontSize: 14,
    fontWeight: "600",
  },
});
