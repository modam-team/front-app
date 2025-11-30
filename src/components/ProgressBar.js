import { radius } from "../theme/radius";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const BAR_HEIGHT = 6; // 진행 바 높이
const BASE_WIDTH = 360; // 진행바 전체 가로 길이
const DOT_SIZE = 4; // 점 크기
const DOT_MARGIN_TOP = 4; // 진행바랑 점 사이의 간격

// 진행 단계 별 진행 바 채워지는 가로 길이
const STEP_WIDTHS = {
  1: 34,
  2: 197,
  3: 360,
};

export default function ProgressBar({ currentStep = 1, totalSteps = 3 }) {
  const [containerWidth, setContainerWidth] = useState(BASE_WIDTH);

  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const baseWidth = STEP_WIDTHS[safeStep] ?? 0;

  // 실제 기기 너비에 맞게 스케일링
  const scale = containerWidth / BASE_WIDTH;
  const activeWidth = baseWidth * scale;

  // 1부터 totalSteps까지의 숫자 배열 생성
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.wrap}>
      <View
        style={styles.barContainer}
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (width > 0) {
            setContainerWidth(width);
          }
        }}
      >
        {/* 전체 회색 바 */}
        <View style={styles.track} />

        {/* 진행된 초록색 라인 */}
        <View style={[styles.activeTrack, { width: activeWidth }]} />
      </View>

      {/* 점 + 라벨 */}
      <View style={styles.stepsRow}>
        {steps.map((step) => {
          const isActive = step === safeStep;
          const color = isActive ? colors.primary[400] : colors.mono[200];

          return (
            <View
              key={step}
              style={styles.stepItem}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: color,
                  },
                ]}
              />
              <Text style={[styles.label, { color }]}>{`Step ${step}`}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  barContainer: {
    width: "100%",
    height: BAR_HEIGHT,
    borderRadius: radius[100],
    position: "relative",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.mono[400],
  },
  activeTrack: {
    position: "absolute",
    left: 0,
    top: 0,
    height: BAR_HEIGHT,
    borderRadius: radius[100],
    backgroundColor: colors.primary[500],
  },
  stepsRow: {
    marginTop: DOT_MARGIN_TOP,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepItem: {
    alignItems: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 999,
  },
  label: {
    marginTop: spacing.xs,
    ...typography["detail-regular"],
  },
});
