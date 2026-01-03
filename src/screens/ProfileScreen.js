import { deleteProfileImage, uploadProfileImage } from "@apis/userApi";
import { fetchUserProfile } from "@apis/userApi";
import { updateProfile } from "@apis/userApi";
import ActionBottomSheet from "@components/ActionBottomSheet";
import AppHeader from "@components/AppHeader";
import ProfilePlaceholder from "@components/ProfilePlaceholder";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const navigation = useNavigation();

  // TODO: 실제 프로필 데이터로 교체
  const [nickname, setNickname] = useState("모담이");
  const [isPublic, setIsPublic] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 프로필 사진 변경 bottom sheet 표시 여부
  const [sheetVisible, setSheetVisible] = useState(false);

  const onPressEditName = () => {
    navigation.navigate("EditNameScreen", {
      nickname,
      onSave: (next) => setNickname(next),
    });
  };

  const pickImage = async () => {
    // 갤러리 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    const imageType =
      ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images;

    // 갤러리 열기
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0];
  };

  const onPressChangePhoto = async () => {
    try {
      if (uploading) return;
      setUploading(true);
      const asset = await pickImage();
      if (!asset) return;

      await uploadProfileImage(asset);

      // 업로드 후 서버 데이터로 동기화
      try {
        const refreshed = await fetchUserProfile();
        setProfileImageUrl(
          refreshed.profileImageUrl ?? refreshed.imageUrl ?? asset.uri,
        );
        setNickname(refreshed.nickname ?? nickname);
        setIsPublic(
          refreshed.isPublic ?? refreshed.public ?? refreshed.publicYn ?? true,
        );
      } catch (err) {
        // 서버 응답이 없어도 로컬로 우선 반영
        setProfileImageUrl(asset.uri);
        console.error("프로필 재조회 실패:", err);
      }

      setSheetVisible(false);
    } catch (e) {
      console.error("프로필 업로드 실패:", e);
    } finally {
      setUploading(false);
    }
  };

  const onPressDeletePhoto = async () => {
    try {
      if (deleting) return;
      setDeleting(true);
      await deleteProfileImage();

      // 삭제 후 서버 데이터로 동기화
      try {
        const refreshed = await fetchUserProfile();
        setProfileImageUrl(
          refreshed.profileImageUrl ?? refreshed.imageUrl ?? null,
        );
        setNickname(refreshed.nickname ?? nickname);
        setIsPublic(
          refreshed.isPublic ?? refreshed.public ?? refreshed.publicYn ?? true,
        );
      } catch (err) {
        setProfileImageUrl(null);
        console.error("프로필 재조회 실패:", err);
      }

      setSheetVisible(false);
    } catch (e) {
      console.error("프로필 삭제 실패:", e);
    } finally {
      setDeleting(false);
    }
  };

  // 시트 닫은 뒤 실행용 래퍼 (시트 닫기 애니메이션과 충돌 방지)
  const onPressChangeFromSheet = () => {
    if (uploading) return;
    setSheetVisible(false);
    setTimeout(() => {
      onPressChangePhoto();
    }, 220);
  };

  const onPressDeleteFromSheet = () => {
    if (deleting) return;
    setSheetVisible(false);
    setTimeout(() => {
      onPressDeletePhoto();
    }, 220);
  };

  const onTogglePublic = async (next) => {
    // 1) UI 먼저 반영
    setIsPublic(next);

    try {
      // 2) 서버 저장
      await updateProfile({ isPublic: next });
    } catch (e) {
      console.error("공개여부 수정 실패:", e);

      // 3) 실패하면 롤백
      setIsPublic((prev) => !prev);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfile = async () => {
        try {
          const profile = await fetchUserProfile();

          if (!isMounted) return;

          setNickname(profile.nickname);
          setIsPublic(
            profile.isPublic ?? profile.public ?? profile.publicYn ?? true,
          );
          setProfileImageUrl(profile.profileImageUrl ?? null);
        } catch (e) {
          console.error("프로필 조회 실패:", e);
        }
      };

      loadProfile();

      return () => {
        isMounted = false;
      };
    }, []),
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
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <ProfilePlaceholder size={89} />
            )}
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
            onValueChange={onTogglePublic}
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
            onPress: onPressChangeFromSheet,
          },
          {
            key: "delete",
            label: "삭제하기",
            icon: "cancel",
            color: colors.warning.medium,
            onPress: onPressDeleteFromSheet,
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
