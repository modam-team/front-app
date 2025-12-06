import { radius } from "../theme/radius";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function OnboardingButton({
  label = "다음",
  onPress,
  disabled = false,
}) {
  return (
    <Pressable
      activeColor={colors.primary[700]}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 40,
    borderRadius: radius[400],
    backgroundColor: colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.primary[500],
    opacity: 0.32,
  },
  buttonPressed: {
    backgroundColor: colors.primary[700],
  },
  text: {
    ...typography["body-1-regular"],
    color: colors.mono[0],
  },
});
