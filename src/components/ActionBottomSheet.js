import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ActionBottomSheet({
  visible, // 바텀시트 표시 여부
  onClose, // 완전히 닫힌 뒤 호출되는 콜백
  actions = [], // 버튼 목록 [{ key, label, icon, color?, onPress }]
  height = 172, // 시트 높이
  backgroundColor = colors.mono[0],
}) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // 열릴 때: 아래에서 위로
      translateY.setValue(height);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, height, translateY]);

  const handleClose = () => {
    // 닫힐 때: 위에서 아래로
    Animated.timing(translateY, {
      toValue: height,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose?.();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
    >
      <View style={styles.backdrop}>
        {/* 회색 배경은 고정 */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />

        {/* 시트만 올라오게 */}
        <Animated.View
          style={[styles.sheet, { height, transform: [{ translateY }] }]}
        >
          <View style={[styles.inner, { backgroundColor }]}>
            {/* 상단 드래그 핸들 */}
            <View style={styles.handle} />

            {/* 액션 버튼 영역 */}
            <View style={styles.content}>
              {actions.map((action, idx) => (
                <Pressable
                  key={action.key ?? `${action.label}-${idx}`}
                  onPress={() => {
                    // 액션 실행 후 시트 닫기
                    action.onPress?.();
                    handleClose();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <MaterialIcons
                    name={action.icon}
                    size={20}
                    color={action.color ?? colors.mono[950]}
                  />
                  <Text
                    style={[
                      styles.text,
                      action.color ? { color: action.color } : null,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 전체 배경 (회색 오버레이)
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  // 애니메이션 대상 컨테이너
  sheet: {
    width: "100%",
  },

  // 실제 시트 UI
  inner: {
    flex: 1,
    borderTopLeftRadius: radius[400],
    borderTopRightRadius: radius[400],
    overflow: "hidden",
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
  },

  // 상단 핸들
  handle: {
    alignSelf: "center",
    width: 56,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.mono[900],
    opacity: 0.2,
    marginTop: 12,
    marginBottom: spacing.s,
  },

  // 액션 리스트 영역
  content: {
    paddingTop: spacing.s,
    gap: 20,
  },

  // 개별 액션 버튼
  item: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 12,
  },

  // 눌렀을 때 배경
  itemPressed: {
    backgroundColor: colors.mono[50],
  },

  // 텍스트
  text: {
    ...typography["body-1-bold"],
    color: colors.mono[950],
  },
});
