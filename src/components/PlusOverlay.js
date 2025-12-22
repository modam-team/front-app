import colors from "../theme/legacyColors";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PlusOverlay({ visible, onClose, onSelect }) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      presentationStyle="overFullScreen"
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.backdrop}
        onPress={onClose}
      >
        {/* 캡션 */}
        <View
          style={styles.captionWrap}
          pointerEvents="none"
        >
          <Text style={styles.caption}>책을 읽을 장소를 선택해주세요</Text>
        </View>

        {/* 2 x 2 원형 버튼 */}
        <View style={styles.grid}>
          {["집", "카페", "도서관", "기타"].map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={styles.circle}
              onPress={() => onSelect?.(label)}
              activeOpacity={0.85}
            >
              <Text style={styles.circleText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const SIZE = 78;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  captionWrap: { marginBottom: 28 },
  caption: { color: "#fff", fontSize: 16, fontWeight: "700" },
  grid: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: { color: colors.text, fontWeight: "700" },
});
