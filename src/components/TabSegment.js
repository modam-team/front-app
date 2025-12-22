import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TabSegment({ tabs, value, onChange }) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <TouchableOpacity
            key={t.value}
            onPress={() => onChange(t.value)}
            style={styles.tab}
          >
            <Text style={[styles.label, active && styles.active]}>
              {t.label}
            </Text>
            {active && <View style={styles.underline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 16, gap: 16 },
  tab: { paddingVertical: 10 },
  label: { color: "#6b7280", fontSize: 14 },
  active: { color: "#111827", fontWeight: "600" },
  underline: {
    height: 2,
    backgroundColor: "#111827",
    marginTop: 6,
    borderRadius: 2,
  },
});
