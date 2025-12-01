import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AppHeader({
  title,
  backgroundColor = colors.background.DEFAULT,
}) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 45,
    paddingHorizontal: spacing.layoutMargin,
    justifyContent: "center",
  },
  title: {
    ...typography["heading-4-medium"],
    color: colors.mono[1000],
  },
});
