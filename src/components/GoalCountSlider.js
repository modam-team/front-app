import BookIcon from "@assets/icons/book-icon.svg";
import Button from "@components/Button";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const HANDLE_SIZE = 28;

export default function GoalCountSlider({ value, onChange, onSave, max = 30 }) {
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

  const handleHalf = HANDLE_SIZE / 2;

  // 현재 value를 0 ~ 1 사이 비율로 변환
  const ratio = Math.min(1, Math.max(0, value / max));

  // 핸들의 left 위치 계산
  const left =
    barWidth > 0
      ? Math.min(
          barWidth - HANDLE_SIZE,
          Math.max(0, ratio * barWidth - handleHalf),
        )
      : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>이번 달엔 몇 권을 읽어 볼까요?</Text>

      <View style={styles.sliderRow}>
        {/* 왼쪽 아이콘*/}
        <BookIcon
          width={28}
          height={28}
        />

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

          <LinearGradient
            pointerEvents="none"
            colors={[colors.primary[400], colors.primary[200]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fill, { width: barWidth ? `${ratio * 100}%` : 0 }]}
          />

          {/* 핸들 (동그라미 + 숫자) */}
          <View
            pointerEvents="none"
            style={[
              styles.handle,
              {
                left,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: handleHalf,
              },
            ]}
          >
            <Text style={styles.handleText}>{value}</Text>
          </View>
        </View>
      </View>

      <Button
        label="목표 설정 완료"
        variant="primary"
        tone="fill"
        size="large"
        fullWidth
        onPress={onSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 카드 전체
  card: {
    marginHorizontal: 14, // 좌우 여백 (카드가 화면 가장자리에 안 붙게)
    marginTop: spacing.l, // 위쪽 여백 (사용자들 뜨는 거랑 사이의 여백)
    marginBottom: 20, // 아래쪽 여백 (캘린더와 사이의 여백)

    backgroundColor: colors.mono[0],
    borderRadius: radius[400],

    borderWidth: 1,
    borderColor: colors.mono[500],

    paddingHorizontal: 26, // 카드 내부 좌우 패딩
    paddingVertical: spacing.m, // 카드 내부 상단 패딩
  },

  // "이번 달엔 몇 권을 읽어 볼까요?" 텍스트
  title: {
    ...typography["heading-4-bold"],
    color: colors.primary[500],
  },

  // 슬라이더랑 책 아이콘
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 9,
    paddingBottom: 10,
  },

  // 슬라이더 영역
  bar: {
    flex: 1,
    height: 64,
    justifyContent: "center",
    position: "relative",
  },

  // 회색 트랙
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.mono[400],
  },

  // 연두 fill (스크린샷 왼쪽 부분)
  fill: {
    position: "absolute",
    left: 0,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#9FB37B",
  },

  // 초록 원 핸들
  handle: {
    position: "absolute",
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },

  handleText: {
    ...typography["body-1-bold"],
    color: colors.mono[0],
  },
});
