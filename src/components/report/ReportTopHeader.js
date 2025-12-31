import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ReportTopHeader({
  onPressSettings,
  variant = "light",
}) {
  const isGreen = variant === "green";
  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.logo,
          { color: isGreen ? colors.primary[500] : colors.mono[0] },
        ]}
      >
        modam
      </Text>
      <TouchableOpacity
        onPress={onPressSettings}
        hitSlop={10}
      >
        <MaterialIcons
          name="settings"
          size={24}
          color={variant === "green" ? colors.primary[500] : colors.mono[0]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 62,
  },

  logo: {
    fontSize: 16,
    fontWeight: 600,
  },
});
