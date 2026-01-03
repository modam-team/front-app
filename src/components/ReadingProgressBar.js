import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INDICATOR_W = 36; // 캐릭터 가로 사이즈
const INDICATOR_HALF = INDICATOR_W / 2;
const EDGE_PAD = 12; // 100%인 경우 박스 끝에 붙는 게 아니라 살짝 왼쪽으로 밀어주는 여백

/**
 * Props
 * - goalCount: 이번 달 목표 권수 (0이면 목표 없음)
 * - readCount: 이번 달 읽은 권수
 * - onPress: 카드 클릭 시 동작 (ex. 목표 모달 열기)
 * - characterSource: 진행바 위에 올라가는 캐릭터 이미지 source
 */
export default function ReadingProgressCard({
  goalCount = 0,
  readCount = 0,
  onPress,
  characterSource,
}) {
  // 진행 바의 가로 길이 저장
  const [progressWidth, setProgressWidth] = useState(0);

  // 진행률 계산
  //  goalCount, readCount, progressWidth가 바뀔 때만 다시 계산
  const { percent, fillWidth, markerLeftPx } = useMemo(() => {
    // 목표가 없으면 0으로 처리 (0으로 나누기 방지)
    const rawRatio = goalCount > 0 ? readCount / goalCount : 0;

    // 퍼센트 텍스트는 0 ~ 100 범위로 clamp
    const p = goalCount > 0 ? Math.min(100, Math.round(rawRatio * 100)) : 0;

    // fillRatio도 0 ~ 1 범위로 clamp
    const fillRatio = Math.min(1, Math.max(0, rawRatio));

    // 진행바 채우는 너비는 %로 처리 (ex. 0.35 -> 35%)
    const fw = fillRatio * 100;

    // 캐릭터 left 위치는 "진행바 가로 길이(px) * 비율"
    const left = Math.min(
      progressWidth - INDICATOR_HALF - EDGE_PAD,
      Math.max(INDICATOR_HALF + EDGE_PAD, fillRatio * progressWidth),
    );
    return { percent: p, fillWidth: fw, markerLeftPx: left };
  }, [goalCount, readCount, progressWidth]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.progressCard}
      disabled={!goalCount}
    >
      {/* 상단 영역: 퍼센트 + 진행바 */}
      <View style={styles.progressHeader}>
        {/* 오른쪽 상단 퍼센트 표시 */}
        <Text style={styles.progressPercent}>{`${percent}%`}</Text>

        {/* 진행바 트랙 */}
        <View
          style={styles.progressTrack}
          onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
        >
          {/* 진행바 배경 그라데이션 */}
          <LinearGradient
            colors={[colors.mono[150], colors.mono[150], "#999999", "#999999"]}
            locations={[0, 0.54, 0.88, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
          />

          {/* 초록색으로 채워진 진행바 부분 */}
          <View style={[styles.progressFill, { width: `${fillWidth}%` }]} />

          {/* 캐릭터 표시 영역 */}
          <View style={[styles.progressIndicator, { left: markerLeftPx }]}>
            <Image
              source={characterSource}
              style={{ width: 36, height: 34 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* 하단 텍스트 영역 */}
      <View style={styles.goalRow}>
        <View style={styles.goalLeft}>
          <Svg
            width={15}
            height={17}
            viewBox="0 0 15 17"
            fill="none"
          >
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15 12.6096C14.9989 12.6514 14.9949 12.6931 14.988 12.7343C15.0061 12.829 15.0033 12.9265 14.98 13.0199C14.9567 13.1134 14.9133 13.2004 14.853 13.2748C14.7927 13.3492 14.717 13.4091 14.6313 13.4503C14.5456 13.4914 14.4519 13.5128 14.3571 13.5128H2.35714C2.21644 13.5128 2.07712 13.541 1.94712 13.5958C1.81713 13.6505 1.69902 13.7308 1.59953 13.832C1.50004 13.9332 1.42112 14.0533 1.36727 14.1855C1.31343 14.3178 1.28571 14.4595 1.28571 14.6026C1.28571 14.7457 1.31343 14.8874 1.36727 15.0196C1.42112 15.1518 1.50004 15.2719 1.59953 15.3731C1.69902 15.4743 1.81713 15.5546 1.94712 15.6094C2.07712 15.6641 2.21644 15.6923 2.35714 15.6923H14.3571C14.5276 15.6923 14.6912 15.7612 14.8117 15.8838C14.9323 16.0064 15 16.1727 15 16.3462C15 16.5196 14.9323 16.6859 14.8117 16.8085C14.6912 16.9311 14.5276 17 14.3571 17H2.35714C1.73199 17 1.13244 16.7474 0.690391 16.2978C0.248341 15.8482 0 15.2384 0 14.6026V2.39744C0 1.7616 0.248341 1.1518 0.690391 0.702193C1.13244 0.252586 1.73199 0 2.35714 0H13.8429C14.4823 0 15 0.526564 15 1.17692V12.6096ZM4.92857 3.48718C4.75808 3.48718 4.59456 3.55607 4.474 3.67869C4.35344 3.80131 4.28571 3.96761 4.28571 4.14103C4.28571 4.31444 4.35344 4.48074 4.474 4.60336C4.59456 4.72598 4.75808 4.79487 4.92857 4.79487H10.0714C10.2419 4.79487 10.4054 4.72598 10.526 4.60336C10.6466 4.48074 10.7143 4.31444 10.7143 4.14103C10.7143 3.96761 10.6466 3.80131 10.526 3.67869C10.4054 3.55607 10.2419 3.48718 10.0714 3.48718H4.92857Z"
              fill="black"
            />
          </Svg>

          <Text style={styles.goalLabel}>{`${readCount}권을 읽었어요`}</Text>
        </View>

        <Text style={styles.goalTarget}>
          {goalCount > 0 ? `목표 ${goalCount}권` : "목표 없음"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 카드 컨테이너
  progressCard: {
    marginTop: 24,
    marginBottom: 20,
    marginHorizontal: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.mono[0],
    borderRadius: radius[400],
  },

  // 퍼센트 + 진행바 영역
  progressHeader: { flexDirection: "column", paddingBottom: 10 },

  // 오른쪽 상단 퍼센트 텍스트
  progressPercent: {
    alignSelf: "flex-end",
    ...typography["detail-regular"],
    color: colors.mono[950],
    paddingBottom: spacing.xs,
  },

  // 진행바 트랙(회색 바) 영역
  progressTrack: {
    marginTop: 10,
    height: 12.04,
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 15,
    overflow: "visible",
    position: "relative",
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderColor: colors.mono[200],
  },

  // 진행바에 채워지는 초록
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[400],
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 3, height: 0 },
    elevation: 4,
  },

  // 캐릭터 위치 박스
  progressIndicator: {
    position: "absolute",
    top: -14,
    width: 36,
    height: 34,
    zIndex: 3,
  },

  // 아래 줄(문구 + 목표 텍스트)
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // 왼쪽 아이콘 + 문구
  goalLeft: { flexDirection: "row", alignItems: "center", gap: 9 },

  // "n권 읽었어요" 텍스트
  goalLabel: { ...typography["body-2-regular"], color: colors.mono[950] },

  // "목표 n권" 텍스트
  goalTarget: { ...typography["detail-regular"], color: colors.mono[950] },
});
