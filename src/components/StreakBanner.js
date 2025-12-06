import colors from "../theme/legacyColors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StreakBanner({ days = 4 }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{days}일 연속으로 읽었어요!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.muted,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  text: { fontWeight: "600", color: colors.text },
});
