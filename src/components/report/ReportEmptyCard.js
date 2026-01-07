import FailBasicIcon from "@assets/fail-basic-icon.svg";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ReportEmptyCard({
  height = 436,
  title = "기록이 없어요",
  caption = "독서 기록을 남기면 분석이 표시돼요",
}) {
  return (
    <View style={[styles.card, { height }]}>
      <FailBasicIcon
        width={96}
        height={96}
      />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius[500],
    backgroundColor: colors.mono[0],
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: spacing.m,
    fontSize: 16,
    fontWeight: "700",
    color: colors.mono[950],
  },
  caption: {
    marginTop: spacing.xs,
    ...typography["detail-regular"],
    color: colors.mono[500],
    textAlign: "center",
  },
});
