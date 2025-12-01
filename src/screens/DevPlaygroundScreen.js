import Chip from "@components/Chip";
import OnboardingButton from "@components/OnboardingButton";
import ProgressBar from "@components/ProgressBar";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DevPlaygroundScreen() {
  const [SelectedChip, setSelectedChip] = useState(false);

  // progress bar 테스트용 현재 스텝 state
  const [step, setStep] = useState(1);

  const goPrev = () => setStep((prev) => Math.max(1, prev - 1));
  const goNext = () => setStep((prev) => Math.min(3, prev + 1));

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

      {/* SECTION: ProgressBar 컴포넌트 */}
      <Text style={styles.label}>ProgressBar Component</Text>

      {/* 현재 step 표시 */}
      <Text style={styles.subLabel}>현재 Step: {step}</Text>

      {/* 애니메이션 되는 ProgressBar */}
      <ProgressBar
        currentStep={step}
        totalSteps={3}
      />

      {/* Step 변경 버튼 */}
      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.stepButton, styles.stepButtonOutline]}
          onPress={goPrev}
        >
          <Text style={styles.stepButtonText}>이전</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepButton, styles.stepButtonFilled]}
          onPress={goNext}
        >
          <Text style={[styles.stepButtonText, { color: colors.mono[0] }]}>
            다음
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION: OnboardingButton */}
      <Text style={styles.label}>OnboardingButton Component</Text>
      <View style={{ gap: spacing.s }}>
        <OnboardingButton
          label="다음 (Active)"
          disabled={false}
          onPress={() => {}}
        />

        <OnboardingButton
          label="다음 (Disabled)"
          disabled={true}
          onPress={() => {}}
        />

        <OnboardingButton
          label="독서 시작하기 (Active)"
          disabled={false}
          onPress={() => {}}
        />

        <OnboardingButton
          label="독서 시작하기 (Disabled)"
          disabled={true}
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
    marginVertical: 20,
    ...typography["body-1-bold"],
  },

  row: {
    flexDirection: "row",
    gap: spacing.buttonX,
    flexWrap: "wrap",
  },

  subLabel: {
    ...typography["detail-regular"],
    color: colors.mono[1000],
    marginVertical: spacing.s,
  },

  stepButtons: {
    marginTop: spacing.m,
    flexDirection: "row",
    gap: spacing.m,
  },
  stepButton: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: radius[500],
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonOutline: {
    borderWidth: 1,
    borderColor: colors.mono[300],
  },
  stepButtonFilled: {
    backgroundColor: colors.primary[500],
  },
  stepButtonText: {
    ...typography["detail-regular"],
    color: colors.mono[900],
  },
});
