import TextField from "../components/TextField";
import { checkNicknameAvailable, updateProfile } from "@apis/userApi";
import AppHeader from "@components/AppHeader";
import Button from "@components/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MIN = 3;
const MAX = 8;

export default function EditNameScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initial = route?.params?.nickname ?? "";
  const onSave = route?.params?.onSave;

  const [value, setValue] = useState(initial);

  // 닉네임 길이 체크
  const trimmed = value.trim();
  const isValidLength = trimmed.length >= MIN && trimmed.length <= MAX;

  // 닉네임 변경이 이루어졌는지 확인
  const isSameAsInitial = trimmed === initial;

  // 중복 체크 상태
  const [checking, setChecking] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null); // true | false | null

  // 입력 변경 시 중복 확인 상태 리셋
  const handleChange = (text) => {
    setValue(text);
    setNicknameChecked(false);
    setIsAvailable(null);
  };

  // 중복 확인 버튼
  const handleCheckNickname = async () => {
    const next = trimmed;
    if (!isValidLength) return;

    try {
      setChecking(true);
      setNicknameChecked(false);

      const res = await checkNicknameAvailable(next);
      setIsAvailable(res.available);
      setNicknameChecked(true);
    } catch (e) {
      console.error("닉네임 중복 확인 실패:", e);
    } finally {
      setChecking(false);
    }
  };

  // 버튼 라벨/variant
  const nicknameButtonVariant =
    nicknameChecked && isAvailable === false ? "error" : "primary";

  const nicknameButtonLabel = nicknameChecked
    ? isAvailable
      ? "사용 가능한 닉네임이에요"
      : "중복된 닉네임이에요"
    : "중복 확인";

  // 저장 가능 조건: 길이 OK + 중복확인 완료 + available = true
  const canSave =
    isValidLength &&
    !isSameAsInitial &&
    nicknameChecked &&
    isAvailable === true;

  const handleSave = async () => {
    const next = value.trim();
    if (next.length < MIN || next.length > MAX) return;

    try {
      // 서버에 저장
      await updateProfile({ nickname: next });

      // 로컬 UI도 업데이트 (부모 state)
      onSave?.(next);

      navigation.goBack();
    } catch (e) {
      console.error("닉네임 수정 실패:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <AppHeader
              title="이름"
              showBack
              onPressBack={() => navigation.goBack()}
            />
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              hitSlop={10}
              style={({ pressed }) => [
                styles.save,
                pressed && canSave && styles.pressed,
                !canSave && styles.saveDisabled,
              ]}
            >
              <Text
                style={[styles.saveText, !canSave && styles.saveTextDisabled]}
              >
                저장
              </Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            <TextField
              label="닉네임"
              placeholder="3~8자로 입력해 주세요."
              showCount
              maxLength={MAX}
              value={value}
              onChangeText={handleChange}
            />

            {/* 중복확인 버튼 */}
            <Button
              label={nicknameButtonLabel}
              variant={nicknameButtonVariant}
              tone="outline"
              size="medium"
              fullWidth
              onPress={handleCheckNickname}
              disabled={!isValidLength || checking || isSameAsInitial}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.DEFAULT },

  headerRow: {
    position: "relative",
  },
  save: {
    position: "absolute",
    right: spacing.layoutMargin,
    top: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
  },
  pressed: { opacity: 0.6 },

  saveDisabled: {
    opacity: 0.3,
  },
  saveTextDisabled: {
    color: colors.mono[400],
  },

  body: {
    paddingHorizontal: spacing.layoutMargin,
    paddingTop: 27,
  },
});
