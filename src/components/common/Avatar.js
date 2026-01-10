import BasicCharacter from "@assets/basic-profile.svg";
import { colors } from "@theme/colors";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Avatar({ uri, size = 49, style }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <BasicCharacter
        width={size}
        height={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.mono[0],
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.mono[150],
  },
});
