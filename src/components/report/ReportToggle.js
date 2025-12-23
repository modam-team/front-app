import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ReportToggle({ value, onChange }) {
  const isTime = value === "time";

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange("time")}
        style={[styles.tab, isTime && styles.tabActive]}
      >
        <Text style={[styles.text, isTime && styles.textActive]}>시간</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("place")}
        style={[styles.tab, !isTime && styles.tabActive]}
      >
        <Text style={[styles.text, !isTime && styles.textActive]}>장소</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.primary[0],
    borderRadius: 28,
    padding: 4,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.mono[0],
  },
  text: {
    ...typography["body-2-bold"],
    color: colors.mono[500],
  },
  textActive: {
    ...typography["body-2-bold"],
    color: colors.mono[950],
  },
});
