import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 모담 로고 텍스트 컴포넌트
// 기본은 눌렀을 때 홈으로 이동인데, 커스텀으로 변경 가능
export default function ModamLogoText({
  label = "modam",
  to = "홈",
  onPress,
  onLongPress,
  style,
  textStyle,
  hitSlop = 8,
  variant = "primary", // primary | white
}) {
  const navigation = useNavigation();

  const resolvedColor =
    variant === "white" ? colors.mono[0] : colors.primary[400];

  const handlePress = () => {
    if (onPress) return onPress();

    // 홈으로 돌아가기
    try {
      navigation.navigate(to);
    } catch (e) {
      // fallback
      navigation.goBack();
    }
  };

  return (
    <Pressable
      hitSlop={hitSlop}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={style}
    >
      <Text style={[styles.text, { color: resolvedColor }, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
