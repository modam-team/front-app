import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MonthView({ year = 2025, month = 10, onPrev, onNext }) {
  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.head}>
        <Text style={styles.title}>{`${year}년 ${month}월`}</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={onPrev}>
            <Text style={styles.nav}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext}>
            <Text style={styles.nav}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.box} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  nav: { fontSize: 18, color: "#111827" },
  box: {
    height: 260,
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
