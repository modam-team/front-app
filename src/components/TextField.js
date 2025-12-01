/**
 * 사용 방법
 *
 *===================================
 *
 * 기본
 *
 * <TextField
 *   label="닉네임"
 *   placeholder="닉네임을 입력하세요"
 *   value={nickname}
 *   onChangeText={setNickname}
 * />
 *
 * -----------------------------------
 *
 * 글자 수 카운터 표시하고 싶을 때
 *
 * <TextField
 *   label="예시"
 *   placeholder="최대 50자"
 *   showCount
 *   maxLength={50}
 *   value={value}
 *   onChangeText={setValue}
 * />
 *
 * -----------------------------------
 *
 * 도움말을 제공하고 싶을 때
 *
 * <TextField
 *   label="아이디"
 *   placeholder="아이디를 입력하세요"
 *   helperText="아이디는 두 글자 이상이어야 합니다."
 *   value={id}
 *   onChangeText={setId}
 * />
 *
 *===================================
 * Props 목록
 *
 * label?: string  ->  인풋 위에 표시될 라벨 텍스트
 * placeholder?: string  ->  입력 전 보여줄 placeholder
 * helperText?: string  ->  입력창 아래 왼쪽에 표시될 도움말 문구
 * showCount?: boolean ->  글자 수 카운트 표시 여부 (기본은 false !)
 * maxLength?: number  ->  최대 글자 수
 * value: string  ->  현재 입력값
 * onChangeText: (text: string) => void  ->  입력 변경 핸들러
 *
 */
import DeleteIcon from "@assets/icons/typcn_delete.svg";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const INPUT_HEIGHT = 35;

export default function TextField({
  label,
  placeholder,
  helperText,
  showCount = false,
  maxLength,
  value,
  onChangeText,
  containerStyle,
}) {
  const [focused, setFocused] = useState(false);

  const length = value ? value.length : 0;
  const isFilled = length > 0;

  let borderColor = colors.primary[0];
  if (focused) borderColor = colors.primary[500];

  return (
    <View style={styles.container}>
      {/* Label */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Input Wrapper */}
      <View style={[styles.inputContainer, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          maxLength={maxLength}
          placeholderTextColor={colors.mono[500]}
          underlineColorAndroid="transparent"
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* 지우기 아이콘 */}
        {(focused || isFilled) && value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <DeleteIcon
              width={16}
              height={16}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text + Count */}
      {(helperText || showCount) && (
        <View style={styles.bottomRow}>
          <Text style={styles.helperText}>{helperText}</Text>

          {showCount && maxLength != null && (
            <Text style={styles.countText}>
              {length} / {maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.s,
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius[200],
    paddingHorizontal: spacing.s,
    height: INPUT_HEIGHT,
    backgroundColor: colors.mono[0],
    gap: spacing.s,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    ...typography["body-2-regular"],
    color: colors.mono[900],
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  bottomRow: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.s,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helperText: {
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
  countText: {
    ...typography["detail-regular"],
    color: colors.mono[700],
  },
});
