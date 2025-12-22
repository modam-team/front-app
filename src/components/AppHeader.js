import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppHeader({
  title,
  backgroundColor = colors.background.DEFAULT,
  showBack = false,
  onPressBack,
  align = "center",
}) {
  const isLeftAlign = align === "left";

  return (
    <View
      style={[
        styles.header,
        { backgroundColor },
        isLeftAlign && styles.leftAlignHeader,
      ]}
    >
      {/* 왼쪽 Back 버튼 */}
      {showBack ? (
        <Pressable
          onPress={onPressBack}
          hitSlop={10}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-forward-ios"
            size={24}
            color={colors.mono[1000]}
            style={{ transform: [{ scaleX: -1 }] }} // 방향 좌우 뒤집기
          />
        </Pressable>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}

      {/* 타이틀 */}
      <Text
        style={[
          styles.title,
          isLeftAlign ? styles.leftTitle : styles.centerTitle,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 45,
    paddingHorizontal: spacing.layoutMargin,
    flexDirection: "row",
    justifyContent: "center",
  },

  // 공통으로 사용하는 거
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    ...typography["heading-4-medium"],
    color: colors.mono[1000],
  },

  // 기본(center)일 때
  centerTitle: {
    flex: 1,
    textAlign: "center",
  },

  // 온보딩일 때
  leftAlignHeader: {
    justifyContent: "flex-start",
  },
  leftTitle: {
    marginLeft: 0,
  },
});
