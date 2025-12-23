import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppHeader({
  title,
  backgroundColor = colors.background.DEFAULT,
  showBack = true,
  onPressBack,
  align = "center",
}) {
  const isLeftAlign = align === "left";

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {/* LEFT */}
      <View style={styles.side}>
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
              style={{ transform: [{ scaleX: -1 }] }}
            />
          </Pressable>
        ) : null}
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* RIGHT (placeholder) */}
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 45,
    paddingHorizontal: spacing.layoutMargin,
    flexDirection: "row",
    alignItems: "center",
  },

  side: {
    width: 24, // Back 버튼과 동일한 폭
    alignItems: "flex-start",
  },

  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
  },

  title: {
    ...typography["heading-4-medium"],
    color: colors.mono[1000],
  },
});
