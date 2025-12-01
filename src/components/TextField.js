import { radius } from "../theme/radius";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function TextField({
  label,
  placeholder,
  helperText,
  showCount = false,
  maxLength,
  value,
  onChangeText,
  containerStyle,
}) {
  const [focused, setFocused] = useState(false);

  const length = value ? value.length : 0;
  const isFilled = length > 0;

  let borderColor = colors.primary[0];
  if (focused) borderColor = colors.primary[500];

  return (
    <View style={styles.container}>
      {/* Label */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Input Wrapper */}
      <View style={[styles.inputContainer, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          maxLength={maxLength}
          placeholderTextColor={colors.mono[500]}
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {/* Helper Text + Count */}
      {(helperText || showCount) && (
        <View style={styles.bottomRow}>
          <Text style={styles.helperText}>{helperText}</Text>

          {showCount && maxLength != null && (
            <Text style={styles.countText}>
              {length} / {maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.s,
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: radius[200],
    padding: spacing.s,
    backgroundColor: colors.mono[0],
  },
  input: {
    ...typography["body-2-regular"],
    color: colors.mono[900],
  },
  bottomRow: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.s,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helperText: {
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
  countText: {
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
});
