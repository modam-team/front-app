import { colors } from "@theme/colors";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const WIDTH = 40;
const HEIGHT = 21;
const RADIUS = 10.5;
const THUMB_RADIUS = 8.5;

export default function PublicSwitch({ value, onChange, disabled = false }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // value 바뀔 때 애니메이션
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  // 썸 x 좌표 보간
  const cx = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [11, 29], // off, on일 때 위치
  });

  // 트랙 색상 보간
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.mono[200], colors.primary[100]], // OFF / ON
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={6}
    >
      <Svg
        width={WIDTH}
        height={HEIGHT}
        viewBox="0 0 40 21"
        preserveAspectRatio="none"
      >
        {/* 트랙 */}
        <AnimatedRect
          width={WIDTH}
          height={HEIGHT}
          rx={RADIUS}
          fill={trackColor}
        />

        {/* 썸 */}
        <AnimatedCircle
          cx={cx}
          cy={HEIGHT / 2}
          r={THUMB_RADIUS}
          fill={colors.mono[0]}
        />
      </Svg>
    </Pressable>
  );
}
