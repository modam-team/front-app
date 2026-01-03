import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function GoalCountSlider({
  value,
  onChange,
  max = 30,
  handleSize = 44,
}) {
  // 슬라이더 바(View)의 ref
  // 화면 좌표를 얻기 위해 사용
  const barRef = useRef(null);

  // 슬라이더 바의 실제 width
  const [barWidth, setBarWidth] = useState(0);

  // 화면 기준 슬라이더 바의 왼쪽 x 좌표
  const [barLeft, setBarLeft] = useState(0);

  // 슬라이더 바의 화면 위치 측정
  const measureBar = useCallback(() => {
    requestAnimationFrame(() => {
      barRef.current?.measureInWindow((x) => {
        setBarLeft(x);
      });
    });
  }, []);

  // 터치한 pageX 위치를 기준으로 value 계산
  const setByPageX = useCallback(
    (pageX) => {
      // barWidth가 아직 없으면 계산 불가
      if (!barWidth) return;

      // 화면 기준 pageX -> 슬라이더 내부 좌표로 변환
      const x = pageX - barLeft;

      // 0 ~ 1 사이 비율로 정규화
      const ratio = Math.min(1, Math.max(0, x / barWidth));

      // 비율을 max 기준 값으로 변환
      const next = Math.max(1, Math.round(ratio * max));
      onChange?.(next);
    },
    [barWidth, barLeft, max, onChange],
  );

  const handleHalf = handleSize / 2;

  // 현재 value를 0 ~ 1 사이 비율로 변환
  const ratio = Math.min(1, Math.max(0, value / max));

  // 핸들의 left 위치 계산
  const left =
    barWidth > 0
      ? Math.min(
          barWidth - handleSize,
          Math.max(0, ratio * barWidth - handleHalf),
        )
      : 0;

  return (
    <View style={styles.wrap}>
      {/* 슬라이더 바 영역 */}
      <View
        ref={barRef}
        style={styles.bar}
        onLayout={(e) => {
          setBarWidth(e.nativeEvent.layout.width);
          measureBar();
        }}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={(e) => {
          measureBar();
          setByPageX(e.nativeEvent.pageX);
        }}
        onResponderMove={(e) => setByPageX(e.nativeEvent.pageX)}
      >
        {/* 전체 트랙 (회색 배경) */}
        <View style={styles.track} />

        {/* 채워진 트랙 (현재 값 비율만큼) */}
        <View
          pointerEvents="none"
          style={[styles.fill, { width: barWidth ? `${ratio * 100}%` : 0 }]}
        />

        {/* 핸들 (동그라미 + 숫자) */}
        <View
          pointerEvents="none"
          style={[
            styles.handle,
            {
              left,
              width: handleSize,
              height: handleSize,
              borderRadius: handleHalf,
            },
          ]}
        >
          <Text style={styles.handleText}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  bar: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    position: "relative",
  },

  track: {
    height: 8,
    borderRadius: 20,
    backgroundColor: "#c6c6c6",
    position: "absolute",
    left: 0,
    right: 0,
    top: 22,
  },

  fill: {
    height: 8,
    borderRadius: 20,
    backgroundColor: "#608540",
    position: "absolute",
    left: 0,
    top: 22,
  },

  handle: {
    position: "absolute",
    top: 8,
    backgroundColor: "#426b1f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    paddingVertical: 6,
  },

  handleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
