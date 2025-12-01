import { completeOnboarding } from "@apis/userApi";
import AppHeader from "@components/AppHeader";
import Chip from "@components/Chip";
import OnboardingButton from "@components/OnboardingButton";
import ProgressBar from "@components/ProgressBar";
import TextField from "@components/TextField";
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

export default function OnboardingFlowScreen({ navigation, route }) {
  const [step, setStep] = useState(1);

  // 백엔드에서 api 변경하면 다시 연결하기
  // onst userId = route?.params?.userId;

  // step 1에서 쓸 상태
  const [goalText, setGoalText] = useState("");
  const goalNumber = Number(goalText) || 0;
  const isValidGoal = goalNumber > 0;

  // zustand setter
  const goalScore = useOnboardingStore((s) => s.goalScore);
  const setGoalScore = useOnboardingStore((s) => s.setGoalScore);

  const handleChangeText = (text) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");
    setGoalText(onlyNumber);
  };

  // step 2에서 쓸 상태
  const categories = useOnboardingStore((s) => s.categories);
  const setCategories = useOnboardingStore((s) => s.setCategories);

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

  // step 3에서 쓸 상태
  const nickname = useOnboardingStore((s) => s.nickname);
  const setNickname = useOnboardingStore((s) => s.setNickname);

  const [nicknameInput, setNicknameInput] = useState(nickname || "");
  const isValidNickname = nicknameInput.trim().length > 0;

  // 이전 버튼
  const handlePrev = () => {
    if (step === 1) {
      return;
    }
    setStep((prev) => prev - 1);
  };

  // 다음 버튼
  const handleNext = async () => {
    if (step === 1) {
      if (!isValidGoal) return;
      setGoalScore(goalNumber);
      setStep(2);
    } else if (step === 2) {
      if (!isValidCategory) return;
      setStep(3);
    } else if (step === 3) {
      if (!isValidNickname) return;

      const trimmedNickname = nicknameInput.trim();
      setNickname(trimmedNickname);

      // 백엔드가 api 변경하면 다시 연결하기
      /*
      try {
        await completeOnboarding(userId, {
          nickname: trimmedNickname,
          goalScore,
          categories: categories.join(","),
        });

        navigation.replace("Root", { userId });
      } catch (e) {
        console.error("온보딩 실패:", e.response?.status, e.response?.data);
      }
        */

      navigation.replace("Root");
    }
  };

  const isNextDisabled =
    (step === 1 && !isValidGoal) ||
    (step === 2 && !isValidCategory) ||
    (step === 3 && !isValidNickname);

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
              <View>
                {/* step 1 제목 */}
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
            )}

            {/* 선호 장르 선택 */}
            {step === 2 && (
              <View>
                {/* step 2 제목 */}
                <View style={styles.content}>
                  <Text style={styles.title}>선호하는 장르가 무엇인가요?</Text>
                  <Text style={styles.subtitle}>
                    3개까지 선택할 수 있습니다.
                  </Text>
                </View>

                {/* 장르 칩들 */}
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

            {/* 닉네임 정하기 - 나중에 닉네임 중복 체크 버튼 추가하고 api 연결할 예정 ! */}
            {step === 3 && (
              <View>
                {/* step 3 제목 */}
                <View style={styles.content}>
                  <Text style={styles.title}>닉네임을 입력해주세요.</Text>
                  <Text style={styles.subtitle}>
                    이 앱에서 당신의 독서 기록을 담을 이름이에요.
                  </Text>
                </View>

                {/* 닉네임 입력 칸 */}
                <View style={styles.nicknameField}>
                  <TextField
                    label="닉네임"
                    placeholder="닉네임을 입력해 주세요."
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                  />
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

  //step 3
  nicknameField: {
    padding: spacing.layoutMargin,
  },
  fieldLabel: {
    ...typography["body-1-regular"],
    color: colors.mono[1000],
    marginBottom: spacing.s,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 4,
    padding: 10,
    ...typography["body-1-regular"],
    color: colors.mono[1000],
  },

  // 버튼
  button: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
});
