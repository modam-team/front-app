import { withdrawUser } from "@apis/userApi";
import AppHeader from "@components/AppHeader";
import BottomTabs from "@navigation/BottomTabs";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { clearAuth } from "@utils/auth";
import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const navigation = useNavigation();

  const items = useMemo(
    () => [
      { key: "profile", label: "프로필" },
      { key: "notification", label: "알림" },
      { key: "notice", label: "공지사항" },
      { key: "inquiry", label: "1:1 문의" },
    ],
    [],
  );

  const onPressItem = (key) => {
    switch (key) {
      case "profile":
        navigation.navigate("ProfileScreen");
        break;
      case "notification":
        navigation.navigate("NotificationSettingScreen");
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
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  pressed: {
    opacity: 0.6,
  },
  title: {
    ...typography["heading-4-medium"],
  },
  rightSpacer: {
    width: 36,
    height: 36,
  },

  body: {
    marginVertical: 24,
    marginHorizontal: 28,
  },
  row: {
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    ...typography["body-1-regular"],
  },

  bottom: {
    marginTop: "auto",
    paddingHorizontal: 28,
    paddingBottom: 80,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logout: {
    ...typography["body-1-regular"],
    color: colors.warning.medium,
  },
  withdraw: {
    ...typography["body-1-regular"],
    color: colors.mono[400],
  },
});
