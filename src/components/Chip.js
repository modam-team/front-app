import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { Pressable, StyleSheet, Text } from "react-native";

export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.SelectedChip : styles.DefaultChip]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  SelectedChip: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[500],
  },
  DefaultChip: {
    backgroundColor: colors.mono[0],
    borderColor: colors.mono[400],
  },
  label: {
    ...typography["body-1-regular"],
    color: colors.primary[1000],
  },
});
