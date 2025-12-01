import AppHeader from "@components/AppHeader";
import Chip from "@components/Chip";
import OnboardingButton from "@components/OnboardingButton";
import ProgressBar from "@components/ProgressBar";
import { GENRES } from "@constants/genres";
import { useOnboardingStore } from "@store/onboardingStore";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function OnboardingStep2Screen({ navigation }) {
  const { categories, setCategories } = useOnboardingStore();

  const isSelected = (item) => categories.includes(item);

  const toggleCategory = (item) => {
    if (isSelected(item)) {
      // 이미 선택된 항목이면 제거
      setCategories(categories.filter((c) => c !== item));
    } else {
      // 최대 3개까지만 선택 가능하도록
      if (categories.length >= 3) return;
      setCategories([...categories, item]);
    }
  };
  // 아무것도 안 고르면 못 넘어가도록
  const canGoNext = categories.length > 0;

  const handlePrev = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (!canGoNext) return;
    navigation.navigate("Root");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}
    >
      <View style={styles.wrap}>
        <View>
          {/* 헤더 */}
          <AppHeader title="독서 습관 기록" />

          {/* 상단 진행바 */}
          <ProgressBar
            currentStep={2}
            totalSteps={3}
          />

          <View style={styles.content}>
            <Text style={styles.title}>선호하는 장르가 무엇인가요?</Text>
            <Text style={styles.subtitle}>3개까지 선택할 수 있습니다.</Text>
          </View>

          <View style={styles.chipContainer}>
            {GENRES.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={isSelected(g)}
                onPress={() => toggleCategory(g)}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.button}>
        <OnboardingButton
          label="다음"
          onPress={handleNext}
          disabled={!canGoNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    margin: spacing.layoutMargin,
  },
  title: {
    ...typography["heading-1-medium"],
    color: colors.mono[1000],
    marginBottom: spacing.s,
  },
  subtitle: {
    ...typography["body-2-regular"],
    color: colors.mono[800],
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.layoutMargin,
    gap: 12,
    rowGap: 20, // 칩들 위아래 줄 사이 간격
  },
  button: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
});
