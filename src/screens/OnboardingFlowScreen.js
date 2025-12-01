import AppHeader from "@components/AppHeader";
import Chip from "@components/Chip";
import OnboardingButton from "@components/OnboardingButton";
import ProgressBar from "@components/ProgressBar";
import { GENRES } from "@constants/genres";
import { useOnboardingStore } from "@store/onboardingStore";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function OnboardingFlowScreen({ navigation }) {
  const [step, setStep] = useState(1);

  // step 1에서 쓸 상태
  const [goalText, setGoalText] = useState("");
  const goalNumber = Number(goalText) || 0;
  const isValidGoal = goalNumber > 0;

  // zustand setter
  const setGoalScore = useOnboardingStore((s) => s.setGoalScore);

  const handleChangeText = (text) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");
    setGoalText(onlyNumber);
  };

  // step 2에서 쓸 상태
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
  const isValidCategory = categories.length > 0;

  // 이전 버튼
  const handlePrev = () => {
    if (step === 1) {
      return;
    }
    setStep((prev) => prev - 1);
  };

  // 다음 버튼
  const handleNext = () => {
    if (step === 1) {
      if (!isValidGoal) return;
      setGoalScore(goalNumber);
      setStep(2);
    } else if (step === 2) {
      if (!isValidCategory) return;
      setStep(3);
    } else if (step === 3) {
      // 나중에 step 3에 해당하는 거 추가할 예정 !

      navigation.replace("Root");
    }
  };

  const isNextDisabled =
    (step === 1 && !isValidGoal) || (step === 2 && !isValidCategory);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}
    >
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <KeyboardAvoidingView
          style={styles.wrap}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View>
            {/* 헤더 */}
            <AppHeader title="독서 습관 기록" />

            {/* 상단 진행바 */}
            <ProgressBar
              currentStep={step}
              totalSteps={3}
            />

            {/* 가운데 내용: step별로 분기 */}
            {step === 1 && (
              <View style={styles.content}>
                <Text style={styles.title}>목표 권수는 몇권인가요?</Text>
                <Text style={styles.subtitle}>
                  이번 달, 당신에게 딱 맞는 속도를 찾아보세요.
                </Text>

                {/* 목표 권수 숫자 입력 */}
                <View style={styles.num}>
                  <View style={styles.row}>
                    <TextInput
                      value={goalText}
                      onChangeText={handleChangeText}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor={colors.mono[200]}
                      style={styles.input}
                    />
                    <Text style={styles.unit}>권</Text>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.content}>
                <Text style={styles.title}>선호하는 장르가 무엇인가요?</Text>
                <Text style={styles.subtitle}>3개까지 선택할 수 있습니다.</Text>

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
            )}
          </View>

          {/* 하단 버튼 */}
          <View style={styles.button}>
            <OnboardingButton
              label="다음"
              onPress={handleNext}
              disabled={isNextDisabled}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
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

  // step 1
  num: {
    marginTop: 60,
    marginHorizontal: spacing.layoutMargin,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  input: {
    width: 83,
    height: 48,
    borderBottomColor: colors.mono[200],
    borderBottomWidth: 1,
    textAlign: "center",
    marginRight: spacing.s,
    backgroundColor: colors.mono[100],
  },
  unit: {
    ...typography["heading-1-medium"],
    color: colors.mono[1000],
  },

  // step 2
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.layoutMargin,
    gap: 12,
    rowGap: 20, // 칩들 위아래 줄 사이 간격
  },

  // 버튼
  button: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
});
