import AppHeader from "@components/AppHeader";
import OnboardingButton from "@components/OnboardingButton";
import ProgressBar from "@components/ProgressBar";
import { useOnboardingStore } from "@store/onboardingStore";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function OnvoardingStep1Screen({ navigation, route }) {
  const [goalText, setGoalText] = useState("");
  const goalNumber = Number(goalText) || 0;
  const isValid = goalNumber > 0;

  // zustand setter
  const setGoalScore = useOnboardingStore((s) => s.setGoalScore);

  const handleChangeText = (text) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");
    setGoalText(onlyNumber);
  };

  const handleNext = () => {
    if (!isValid) return;

    // 상태 저장
    setGoalScore(goalNumber);

    navigation.navigate("Root");
  };

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
              currentStep={1}
              totalSteps={3}
            />

            <View style={styles.content}>
              <Text style={styles.title}>목표 권수는 몇권인가요?</Text>
              <Text style={styles.subtitle}>
                이번 달, 당신에게 딱 맞는 속도를 찾아보세요.
              </Text>
            </View>

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

          <View style={styles.button}>
            <OnboardingButton
              label="다음"
              onPress={handleNext}
              disabled={!isValid}
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
    marginBottom: 60,
  },
  num: {
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
  button: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
});
