import ModamLogo from "@assets/icons/modam.svg";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function ReportTopHeader({ onPressSettings }) {
  return (
    <View style={styles.wrap}>
      <ModamLogo />

      <TouchableOpacity
        onPress={onPressSettings}
        hitSlop={10}
      >
        <MaterialIcons
          name="settings"
          size={24}
          color={colors.mono[0]}
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
});
