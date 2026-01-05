import BookIcon from "@assets/icons/book-icon-black.svg";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const INDICATOR_W = 36; // 캐릭터 가로 사이즈
const TRACK_BORDER = 8; // 테두리보다 살짝 여유있게

/**
 * Props
 * - goalCount: 이번 달 목표 권수 (0이면 목표 없음)
 * - readCount: 이번 달 읽은 권수
 * - onPress: 카드 클릭 시 동작 (ex. 목표 모달 열기)
 * - characterSource: 진행바 위에 올라가는 캐릭터 이미지 source
 */
function ReadingProgressBar({
  goalCount = 0,
  readCount = 0,
  onPress,
  characterSource,
  animateKey = 0, // 애니메이션 다시 실행 시점 제어
  animate = true, // 애니메이션 실행 할지 말지
  duration = 700,
}) {
  // 진행 바의 가로 길이 저장
  const [progressWidth, setProgressWidth] = useState(0);

  // 진행률 계산
  //  goalCount, readCount, progressWidth가 바뀔 때만 다시 계산
  const { percent, fillWidth, markerLeftPx, minLeftPx } = useMemo(() => {
    // 목표가 없으면 0으로 처리 (0으로 나누기 방지)
    const rawRatio = goalCount > 0 ? readCount / goalCount : 0;

    // 퍼센트 텍스트는 0 ~ 100 범위로 clamp
    const p = goalCount > 0 ? Math.min(100, Math.round(rawRatio * 100)) : 0;

    // fillRatio도 0 ~ 1 범위로 clamp
    const fillRatio = Math.min(1, Math.max(0, rawRatio));

    // progressWidth 없을 땐 fw를 쓰지 말고 0으로 리턴
    if (!progressWidth) {
      return { percent: p, fillWidth: 0, markerLeftPx: 0, minLeftPx: 0 };
    }

    const innerWidth = Math.max(0, progressWidth - TRACK_BORDER * 2);
    const fw = fillRatio * innerWidth;

    // indicator의 left 계산
    const rawLeft = TRACK_BORDER + fw - INDICATOR_W / 2;

    // left 범위를 트랙 안쪽으로 clamp
    const minLeft = -INDICATOR_W / 2 + TRACK_BORDER; // 0%일 때 딱 시작점
    const maxLeft = TRACK_BORDER + innerWidth - INDICATOR_W / 2; // 끝점에 걸치기

    const left = Math.min(maxLeft, Math.max(minLeft, rawLeft));

    return {
      percent: p,
      fillWidth: fw,
      markerLeftPx: left,
      minLeftPx: minLeft,
    };
  }, [goalCount, readCount, progressWidth]);

  // 실제 렌더링 용 animated 값
  const fillAnim = useRef(new Animated.Value(0)).current;
  const leftAnim = useRef(new Animated.Value(0)).current;

  // animateKey가 바뀌면 0에서 목표까지 애니메이션
  useEffect(() => {
    if (!progressWidth) return;

    // 목표가 없으면 그냥 0% 지점
    if (!goalCount) {
      fillAnim.setValue(0);
      leftAnim.setValue(minLeftPx);
      return;
    }

    // 애니메이션 끄면 바로 목표값 세팅
    if (!animate) {
      fillAnim.setValue(fillWidth);
      leftAnim.setValue(markerLeftPx);
      return;
    }

    // 시작점(0%)에서 출발
    fillAnim.setValue(0);
    leftAnim.setValue(minLeftPx);

    Animated.parallel([
      Animated.timing(fillAnim, {
        toValue: fillWidth,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(leftAnim, {
        toValue: markerLeftPx,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    animateKey,
    animate,
    duration,
    progressWidth,
    goalCount,
    fillWidth,
    markerLeftPx,
    minLeftPx,
    fillAnim,
    leftAnim,
  ]);

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
          <Animated.View style={[styles.progressFill, { width: fillAnim }]} />

          {/* 캐릭터 표시 영역 */}
          <Animated.View style={[styles.progressIndicator, { left: leftAnim }]}>
            <Image
              source={characterSource}
              style={{ width: 36, height: 34 }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>

      {/* 하단 텍스트 영역 */}
      <View style={styles.goalRow}>
        <View style={styles.goalLeft}>
          <BookIcon
            width={15}
            height={17}
          />

          <Text style={styles.goalLabel}>{`${readCount}권을 읽었어요`}</Text>
        </View>

        <Text style={styles.goalTarget}>
          {goalCount > 0 ? `목표 ${goalCount}권` : "목표 없음"}
        </Text>
      </View>
    </Pressable>
  );
}

export default memo(
  ReadingProgressBar,
  (prev, next) =>
    prev.goalCount === next.goalCount &&
    prev.readCount === next.readCount &&
    prev.onPress === next.onPress &&
    prev.characterSource === next.characterSource &&
    prev.animateKey === next.animateKey &&
    prev.animate === next.animate &&
    prev.duration === next.duration,
);

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
