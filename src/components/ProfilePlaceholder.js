import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfilePlaceholder({ size = 56 }) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.mark, { fontSize: size * 0.42 }]}>?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: "#d7eec4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#426b1f",
  },
  mark: {
    color: "#426b1f",
    fontWeight: "700",
  },
});
