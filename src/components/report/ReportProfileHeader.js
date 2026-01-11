import BasicCharacter from "@assets/basic-profile.svg";
import Button from "@components/common/Button";
import { spacing } from "@theme/spacing";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

export default function ReportProfileHeader({
  onPressProfile,
  onPressEditProfile,
  profileImageUrl,
}) {
  return (
    <View style={styles.headerTop}>
      <Pressable
        onPress={onPressProfile}
        disabled={!onPressProfile}
        style={styles.profileCircle}
        hitSlop={8}
      >
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.basicAvatar}>
            <BasicCharacter
              width={49}
              height={49}
            />
          </View>
        )}
      </Pressable>

      <Button
        label="프로필 편집"
        onPress={onPressEditProfile}
        variant="primary"
        tone="outline"
        size="small"
        style={styles.editBtn}
        textStyle={styles.editBtnText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 프사랑 프로필 편집 버튼
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  // 프사 동그라미
  profileCircle: {
    width: 49,
    height: 49,
    borderRadius: 999,
    overflow: "hidden",
  },

  // 프사 이미지
  profileImage: {
    width: "100%",
    height: "100%",
  },

  // 기본 프사 캐릭터
  basicAvatar: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
