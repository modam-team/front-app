import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BookShelfTabs({ tabs = [], activeTab, onPressTab }) {
  return (
    <View style={styles.tabsRow}>
      {tabs.map((t) => {
        const active = activeTab === t.value;
        return (
          <TouchableOpacity
            key={t.value}
            style={styles.tabItem}
            onPress={() => onPressTab?.(t.value)}
            activeOpacity={0.85}
          >
            {/* 탭 라벨 텍스트 */}
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {/* 활성화된 탭에만 하단 underline 표시 */}
            {active && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.DEFAULT,

    borderBottomWidth: 1,
    borderBottomColor: colors.mono[150],
  },
  tabItem: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  tabLabel: {
    ...typography["body-2-bold"],
    color: colors.mono[500],
  },
  tabLabelActive: { ...typography["body-1-bold"], color: colors.primary[500] },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    height: 2,
    width: 110,
    alignSelf: "center",

    backgroundColor: colors.primary[500],

    borderWidth: 2,
    borderRadius: 2,
    borderColor: colors.primary[500],
  },
});
