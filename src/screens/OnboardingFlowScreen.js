import { checkNicknameAvailable, completeOnboarding } from "@apis/userApi";
import ProgressBar from "@components/ProgressBar";
import TextField from "@components/TextField";
import AppHeader from "@components/common/AppHeader";
import Button from "@components/common/Button";
import Chip from "@components/common/Chip";
import { GENRES } from "@constants/genres";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnboardingStore } from "@store/onboardingStore";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PREF_GENRES_KEY = "preferredGenres";

const AUTH_BYPASS =
  (process.env.EXPO_PUBLIC_AUTH_BYPASS || "").toLowerCase() === "true";

export default function OnboardingFlowScreen({ navigation, route }) {
  const [step, setStep] = useState(1);

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

  // 닉네임 중복 체크 관련
  const [checking, setChecking] = useState(false); // 요청 중
  const [nicknameChecked, setNicknameChecked] = useState(false); // 확인 여부
  const [isAvailable, setIsAvailable] = useState(null); // true | false | null

  // 닉네임 중복확인 버튼 variant 조건
  const nicknameButtonVariant =
    nicknameChecked && isAvailable === false ? "error" : "primary";

  // 닉네임 글자수 제한 (3~8자만 허용)
  const trimmedNickname = nicknameInput.trim();
  const isValidNickname =
    trimmedNickname.length >= 3 && trimmedNickname.length <= 8;

  // 버튼 라벨
  const nicknameButtonLabel = nicknameChecked
    ? isAvailable
      ? "사용 가능한 닉네임이에요"
      : "중복된 닉네임이에요"
    : "중복 확인";

  // 버튼 텍스트
  const nextButtonLabel = step === 3 ? "독서 시작하기" : "다음";

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

      try {
        if (!AUTH_BYPASS) {
          await completeOnboarding({
            nickname: trimmedNickname,
            goalScore,
            categories,
          });
        }

        // 선호 장르를 캐시에 저장
        await AsyncStorage.setItem(PREF_GENRES_KEY, JSON.stringify(categories));

        navigation.replace("Root");
      } catch (e) {
        console.error("온보딩 실패:", e.response?.status, e.response?.data);
      }
    }
  };

  const isNextDisabled =
    (step === 1 && !isValidGoal) ||
    (step === 2 && !isValidCategory) ||
    (step === 3 && (!isValidNickname || !nicknameChecked || !isAvailable));

  // 중복 확인 버튼 핸들러
  const handleCheckNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) return;

    try {
      setChecking(true);
      setNicknameChecked(false);

      const res = await checkNicknameAvailable(trimmed);
      setIsAvailable(res.available);
      setNicknameChecked(true);
    } catch (e) {
      console.error("닉네임 중복 확인 실패", e);
    } finally {
      setChecking(false);
    }
  };

  // 닉네임 입력 시 확인 상태 리셋하기
  const handleNicknameChange = (text) => {
    setNicknameInput(text);
    setNicknameChecked(false);
    setIsAvailable(null);
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
            <AppHeader
              title="독서 습관 기록"
              showBack={step >= 2}
              onPressBack={handlePrev}
              align="left"
            />

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
                    placeholder="닉네임을 입력해 주세요. (3~8자 이내)"
                    value={nicknameInput}
                    onChangeText={handleNicknameChange}
                  />
                  <Button
                    label={nicknameButtonLabel}
                    variant={nicknameButtonVariant}
                    tone="outline"
                    size="medium"
                    fullWidth // 가로 꽉
                    disabled={!isValidNickname || checking} // 글자수가 맞지 않거나 이미 중복 확인 중이면 비활성화
                    onPress={handleCheckNickname}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* 하단 버튼 */}
          <View style={styles.button}>
            <Button
              label={nextButtonLabel}
              onPress={handleNext}
              variant="primary"
              tone="fill"
              size="large"
              fullWidth
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

  // 버튼
  button: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
});
