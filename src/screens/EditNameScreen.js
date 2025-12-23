import TextField from "../components/TextField";
import AppHeader from "@components/AppHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MAX = 30;

export default function EditNameScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initial = route?.params?.nickname ?? "";
  const onSave = route?.params?.onSave;

  const [value, setValue] = useState(initial);

  const countText = useMemo(() => `${value.length}/${MAX}`, [value]);

  const handleSave = () => {
    const next = value.trim();
    if (!next) return;
    onSave?.(next);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <AppHeader
          title="이름"
          showBack
          onPressBack={() => navigation.goBack()}
        />
        <Pressable
          onPress={handleSave}
          hitSlop={10}
          style={({ pressed }) => [styles.save, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>저장</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <TextField
          label="닉네임"
          placeholder="최대 50자"
          showCount
          maxLength={50}
          value={value}
          onChangeText={setValue}
        />
      </View>
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

  body: {
    paddingHorizontal: spacing.layoutMargin,
    paddingTop: 27,
  },
});
