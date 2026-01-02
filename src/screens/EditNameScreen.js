import TextField from "../components/TextField";
import { updateProfile } from "@apis/userApi";
import AppHeader from "@components/AppHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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
              disabled={!isValidLength}
              hitSlop={10}
              style={({ pressed }) => [
                styles.save,
                pressed && isValidLength && styles.pressed,
                !isValidLength && styles.saveDisabled,
              ]}
            >
              <Text
                style={[
                  styles.saveText,
                  !isValidLength && styles.saveTextDisabled,
                ]}
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
              onChangeText={setValue}
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
