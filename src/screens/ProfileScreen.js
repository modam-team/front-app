import ActionBottomSheet from "@components/ActionBottomSheet";
import AppHeader from "@components/AppHeader";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function ProfileScreen() {
  const navigation = useNavigation();

  // TODO: 실제 프로필 데이터로 교체
  const [nickname, setNickname] = useState("모담이");
  const [isPublic, setIsPublic] = useState(true);

  // 프로필 사진 변경 bottom sheet 표시 여부
  const [sheetVisible, setSheetVisible] = useState(false);

  const onPressEditName = () => {
    navigation.navigate("EditNameScreen", {
      nickname,
      onSave: (next) => setNickname(next),
    });
  };

  const onPressChangePhoto = () => {
    // TODO: 이미지 피커/업로드 연결
    setSheetVisible(false);
  };

  const onPressDeletePhoto = () => {
    // TODO: 프로필 사진 삭제 API 연결
    setSheetVisible(false);
  };

  const rows = useMemo(
    () => [
      {
        key: "nickname",
        left: "닉네임",
        right: nickname,
        onPress: onPressEditName,
        showChevron: true,
      },
      {
        key: "public",
        left: "공개여부",
        right: null,
        onPress: null,
        showChevron: false,
      },
    ],
    [nickname, isPublic],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        title="프로필"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
        {/* 프로필 이미지 영역 */}
        <View style={styles.profileArea}>
          <Pressable
            onPress={() => setSheetVisible(true)}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            {/* TODO: Image로 교체 */}
          </Pressable>

          <Pressable
            onPress={() => setSheetVisible(true)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.changeTextWrap,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.changeText}>프로필 변경</Text>
          </Pressable>
        </View>

        {/* 닉네임 row */}
        <Pressable
          onPress={onPressEditName}
          style={({ pressed }) => [
            styles.nicknameRow,
            pressed && styles.rowPressed,
          ]}
        >
          <Text style={styles.rowLeft}>닉네임</Text>

          <View style={styles.rowRight}>
            <Text style={styles.rowRightText}>{nickname}</Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.mono[500]}
            />
          </View>
        </Pressable>

        {/* 공개여부 row */}
        <View style={styles.publicRow}>
          <Text style={styles.rowLeft}>공개여부</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{
              false: colors.mono[200],
              true: colors.primary[300],
            }}
            thumbColor={colors.mono[0]}
          />
        </View>
      </View>

      {/* Bottom Sheet */}
      <ActionBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        actions={[
          {
            key: "edit",
            label: "변경하기",
            icon: "edit",
            onPress: () => {
              setSheetVisible(false);
              onPressChangePhoto();
            },
          },
          {
            key: "delete",
            label: "삭제하기",
            icon: "cancel",
            color: colors.warning.medium,
            onPress: () => {
              setSheetVisible(false);
              onPressDeletePhoto();
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.layoutMargin,
    paddingTop: 40,
  },

  profileArea: {
    alignItems: "center",
    marginBottom: 34,
    gap: 9,
  },

  avatar: {
    width: 89,
    height: 89,
    borderRadius: 999,
    backgroundColor: colors.mono[200],
  },

  changeTextWrap: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  changeText: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
  },

  nicknameRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    backgroundColor: colors.mono[0],
    borderRadius: 12,
  },

  publicRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.mono[0],
    borderRadius: 12,
  },

  rowPressed: {
    opacity: 0.6,
  },

  rowLeft: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowRightText: {
    ...typography["body-2-bold"],
    color: colors.mono[950],
  },

  pressed: {
    opacity: 0.6,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
