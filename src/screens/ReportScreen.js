// src/screens/ReportScreen.js
import colors from "../theme/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ReportScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>리포트</Text>
      <Text style={styles.sub}>월별/주별 독서 통계를 여기에 표시</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 8, color: "#6b7280" },
});
