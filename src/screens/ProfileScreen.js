import { deleteProfileImage, uploadProfileImage } from "@apis/userApi";
import { fetchUserProfile } from "@apis/userApi";
import { updateProfile } from "@apis/userApi";
import BasicCharacter from "@assets/basic-profile.svg";
import ActionBottomSheet from "@components/ActionBottomSheet";
import AppHeader from "@components/AppHeader";
import PublicSwitch from "@components/PublicSwitch";
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

  /**
   * 화면에 표시되는 프로필 상태들
   * - nickname: 닉네임 텍스트
   * - isPublic: 공개/비공개 스위치 값
   * - profileImageUrl: 서버에서 내려오는 프로필 이미지 url (없으면 null)
   * - uploading / deleting: 중복 요청 방지용 로딩 플래그
   */
  const [nickname, setNickname] = useState("모담이");
  const [isPublic, setIsPublic] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 프로필 사진 변경 bottom sheet 표시 여부
  const [sheetVisible, setSheetVisible] = useState(false);

  // 닉네임 수정 화면으로 이동
  const onPressEditName = () => {
    navigation.navigate("EditNameScreen", {
      nickname,
      onSave: (next) => setNickname(next),
    });
  };

  // 갤러이에서 이미지 선택
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

  // 프로필 이미지 변경 처리
  const onPressChangePhoto = async () => {
    try {
      if (uploading) return; // 중복 방지
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

        setIsPublic(refreshed.public);
      } catch (err) {
        console.error("프로필 재조회 실패:", err);
      }

      setSheetVisible(false);
    } catch (e) {
      console.error("프로필 업로드 실패:", e);
    } finally {
      setUploading(false);
    }
  };

  // 프로필 이미지 삭제 처리
  const onPressDeletePhoto = async () => {
    try {
      if (deleting) return; // 중복 방지
      setDeleting(true);

      await deleteProfileImage();

      // 삭제 후 서버 데이터로 동기화
      try {
        const refreshed = await fetchUserProfile();

        setProfileImageUrl(refreshed.profileImageUrl);
        setNickname(refreshed.nickname);
        setIsPublic(refreshed.public);
      } catch (err) {
        console.error("프로필 재조회 실패:", err);
      }

      setSheetVisible(false);
    } catch (e) {
      console.error("프로필 삭제 실패:", e);
    } finally {
      setDeleting(false);
    }
  };

  // 변경하기로 시트 닫은 뒤 실행용 래퍼 (시트 닫기 애니메이션과 충돌 방지)
  const onPressChangeFromSheet = () => {
    if (uploading) return;
    setSheetVisible(false);
    setTimeout(() => {
      onPressChangePhoto();
    }, 220);
  };

  // 삭제하기로 시트 닫은 뒤 실행용 래퍼 (시트 닫기 애니메이션과 충돌 방지)
  const onPressDeleteFromSheet = () => {
    if (deleting) return;
    setSheetVisible(false);
    setTimeout(() => {
      onPressDeletePhoto();
    }, 220);
  };

  // 공개 여부 토글
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

  // 화면에 다시 포커스될 때마다 프로필 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfile = async () => {
        try {
          const profile = await fetchUserProfile();

          if (!isMounted) return;

          setNickname(profile.nickname);
          setIsPublic(profile.public);
          setProfileImageUrl(profile.profileImageUrl);
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
      {/* 상단 헤더 */}
      <AppHeader
        title="프로필"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
        {/* 프로필 이미지 영역 */}
        <View style={styles.profileArea}>
          {/* 프사 클릭 -> BottomSheet 열기 */}
          <Pressable
            onPress={() => setSheetVisible(true)}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            {/* 이미지가 있으면 서버 이미지 표시 */}
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
              // 없으면 기본 캐릭터 표시

              <BasicCharacter
                width={60}
                height={60}
              />
            )}
          </Pressable>

          {/* "프로필 변경" 텍스트 버튼 (BottomSheet 열기) */}
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
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Text style={styles.rowLeft}>닉네임</Text>

          <View style={styles.rowRight}>
            <Text style={styles.rowRightText}>{nickname}</Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.mono[0]}
            />
          </View>
        </Pressable>

        {/* 공개여부 row */}
        <View style={styles.row}>
          <Text style={styles.rowLeft}>공개여부</Text>

          <View style={styles.publicRight}>
            <Text style={styles.publicText}>
              {isPublic ? "공개" : "비공개"}
            </Text>
            <PublicSwitch
              value={isPublic}
              onChange={onTogglePublic}
            />
          </View>
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
  // 전체 래퍼
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // 콘텐츠 영역
  body: {
    flex: 1,
    paddingHorizontal: spacing.l,
    paddingTop: 40,
  },

  // 프사 이미지 + 프로필 변경 텍스트 묶음
  profileArea: {
    alignItems: "center",
    marginBottom: 34,
    gap: 10,
  },

  // 프사 영역
  avatar: {
    width: 89,
    height: 89,
    borderRadius: 999,
    backgroundColor: colors.mono[0],
    borderWidth: 1,
    borderColor: colors.mono[150],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // 프사 이미지 스타일
  avatarImage: {
    width: "100%",
    height: "100%",
  },

  // 프로필 변경 텍스트 터치 영역
  changeTextWrap: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  // 프로필 변경 텍스트
  changeText: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
  },

  // 프사 + 프로필 변경하기 텍스트 눌렀을 때 피드백
  pressed: {
    opacity: 0.6,
  },

  // 하나의 row 스타일
  row: {
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    backgroundColor: colors.primary[400],
    borderRadius: radius[200],
  },

  // row 눌렸을 때 피드백
  rowPressed: {
    opacity: 0.6,
  },

  // row 왼쪽 라벨 텍스트
  rowLeft: {
    ...typography["body-2-regular"],
    color: colors.mono[0],
  },

  // row 오른쪽 영역
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // row 오른쪽 영역 텍스트
  rowRightText: {
    ...typography["body-2-bold"],
    color: colors.mono[0],
  },

  // 공개 여부 텍스트 + 토글 컨테이너
  publicRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // 공개 or 비공개 텍스트
  publicText: {
    ...typography["body-2-regular"],
    color: colors.mono[0],
    marginRight: 10,
  },
});
