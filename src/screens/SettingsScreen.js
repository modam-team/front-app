import { withdrawUser } from "@apis/userApi";
import AppHeader from "@components/common/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { clearAuth } from "@utils/auth";
import React, { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PREF_GENRES_KEY = "preferredGenres";

export default function SettingsScreen() {
  const navigation = useNavigation();

  // 렌더링마다 새 배열 생성 방지
  const items = useMemo(
    () => [
      { key: "profile", label: "프로필" },
      { key: "theme", label: "테마" },
      { key: "genre", label: "선호 장르 변경" },
      { key: "notice", label: "공지사항" },
      { key: "inquiry", label: "1:1 문의" },
    ],
    [],
  );

  // 설정 항목 클릭 시 이동 처리
  const onPressItem = (key) => {
    switch (key) {
      case "profile":
        navigation.navigate("ProfileScreen");
        break;
      case "theme":
        navigation.navigate("ThemeScreen");
        break;
      case "genre":
        navigation.navigate("ChangeGenreScreen");
        break;
      case "notice":
        navigation.navigate("NoticeScreen");
        break;
      case "inquiry":
        navigation.navigate("InquiryScreen");
        break;
      default:
        break;
    }
  };

  // 로그아웃 처리
  const onLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await clearAuth();

          navigation.reset({
            index: 0,
            routes: [{ name: "OnboardingIntro" }],
          });
        },
      },
    ]);
  };

  // 회원 탈퇴 처리
  const onWithdraw = () => {
    Alert.alert(
      "회원탈퇴",
      "정말 회원탈퇴할까요?\n탈퇴 후에는 복구할 수 없어요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            try {
              await withdrawUser(); // 서버 탈퇴
              await clearAuth(); // 토큰 완전 삭제
              await AsyncStorage.removeItem(PREF_GENRES_KEY); // 선호 장르 기반 문구 추천하던거도 지움

              Alert.alert("완료", "회원탈퇴가 완료됐어요.");

              // 온보딩 화면으로
              navigation.reset({
                index: 0,
                routes: [{ name: "OnboardingIntro" }],
              });
            } catch (e) {
              console.error(
                "회원탈퇴 실패",
                e?.response?.status,
                e?.response?.data,
                e,
              );
              Alert.alert(
                "실패",
                "회원탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <AppHeader
        title="설정"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {/* Body */}
      <View style={styles.body}>
        {items.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => onPressItem(it.key)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.rowText}>{it.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          onPress={onLogout}
          hitSlop={10}
        >
          <Text style={styles.logout}>로그아웃</Text>
        </Pressable>

        <Pressable
          onPress={onWithdraw}
          hitSlop={10}
        >
          <Text style={styles.withdraw}>회원탈퇴</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 화면 전체 높이 및 앱 기본 배경 색
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // 설정 목록들이 있는 영역
  body: {
    marginVertical: spacing.l,
    marginHorizontal: 28,
  },

  // 설정 한 줄에 해당하는 스타일
  row: {
    paddingBottom: 14,
  },

  // row 터치 중 상태 (투명도 조절)
  rowPressed: {
    opacity: 0.6,
  },

  // 설정 항목 텍스트
  rowText: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
  },

  // 하단 고정 영역
  bottom: {
    marginTop: "auto",
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // 로그아웃 텍스트
  logout: {
    ...typography["body-1-regular"],
    color: colors.warning.medium,
  },

  // 회원 탈퇴 텍스트
  withdraw: {
    ...typography["body-1-regular"],
    color: colors.mono[400],
  },
});
