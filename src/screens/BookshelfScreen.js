import TabSegment from "../components/TabSegment";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

// ✅ 중괄호 X

const tabs = [
  { label: "읽기 전", value: "before" },
  { label: "읽는 중", value: "reading" },
  { label: "읽은 후", value: "after" },
];

const dummy = new Array(12).fill(0).map((_, i) => ({ id: String(i) }));

export default function BookshelfScreen() {
  const [tab, setTab] = useState("before");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={styles.title}>책장</Text>
      </View>
      <TabSegment
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />
      {/* ✅ */}
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={dummy}
        keyExtractor={(i) => i.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={() => <View style={styles.book} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 },
  book: {
    width: "31%",
    aspectRatio: 0.7,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
