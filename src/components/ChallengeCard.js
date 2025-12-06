import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ChallengeCard({
  title = "책을 다 읽어보기 챌린지",
  progress = 0.7,
  count = 4,
}) {
  const pct = Math.round(progress * 100);
  return (
    <View style={styles.card}>
      <View style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.meta}>📚 {count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    gap: 12,
  },
  thumb: { width: 60, height: 40, backgroundColor: "#f3f4f6", borderRadius: 6 },
  title: { fontWeight: "700", marginBottom: 8, color: "#111827" },
  barBg: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: "#111827" },
  meta: { marginTop: 8, color: "#6b7280", fontSize: 12 },
});
