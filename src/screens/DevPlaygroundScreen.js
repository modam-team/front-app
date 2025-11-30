import Chip from "@components/Chip";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DevPlaygroundScreen() {
  const [SelectedChip, setSelectedChip] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>
        Dev Playground{"\n"}(이것저것 테스트해보세용)
      </Text>

      {/* SECTION: Chip 컴포넌트 */}
      <Text style={styles.label}>Chip Component</Text>
      <View style={styles.row}>
        <Chip
          label="Chip - default"
          selected={false}
          onPress={() => {}}
        />

        <Chip
          label="Chip - active"
          selected={true}
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.layoutMargin,
    backgroundColor: colors.background.DEFAULT,
  },
  sectionTitle: {
    ...typography["heading-1-medium"],
  },
  label: {
    marginTop: 20,
    ...typography["body-1-bold"],
  },
  row: {
    marginTop: 20,
    flexDirection: "row",
    gap: spacing.buttonX,
    flexWrap: "wrap",
  },
});
