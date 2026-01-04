import AppHeader from "@components/AppHeader";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 1:1 문의를 받을 운영자 이메일
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

export default function InquiryScreen({ navigation }) {
  // 기본 앱을 열고 수신자, 제목, 본문을 미리 채워줌 (사용자는 전송 버튼만 누르면 됨 !!)
  const onPressEmail = useCallback(async () => {
    // 메일 제목 및 본문 템플릿
    const subject = "[모담] 1:1 문의드립니다";
    const body = [
      "안녕하세요! 모담 1:1 문의입니다.",
      "",
      "아래 내용을 작성해 주세요 🙏",
      "- 닉네임:",
      "- 문의 내용:",
      "",
      "※ 가능하면 아래 정보도 함께 보내주시면 좋아요",
      "- 기기/OS:",
      "- 앱 버전:",
    ].join("\n");

    // mailto 스킴 URL 생성
    // subject / body에는 공백, 줄바꿈, 한글이 포함되므로 반드시 인코딩이 필요하다고 합니다 !!
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    try {
      // 해당 URL을 열 수 있는지(메일 앱 존재 여부) 확인
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        // 메일 앱이 설정되지 않은 경우
        Alert.alert(
          "메일 앱을 열 수 없어요",
          "기본 메일 앱이 설정되어 있는지 확인해 주세요.",
        );
        return;
      }

      // 기본 메일 앱 실행
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("오류", "메일 앱을 여는 중 문제가 발생했어요.");
      console.error(e);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* 상단 헤더 */}
      <AppHeader
        title="1:1 문의"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {/* 본문 영역 */}
      <View style={styles.body}>
        {/* 안내 문구 */}
        <Text style={styles.desc}>문의는 아래 메일로 부탁드립니다.</Text>

        {/* 이메일 전송 버튼 */}
        <Pressable
          onPress={onPressEmail}
          style={({ pressed }) => [styles.emailBtn, pressed && styles.pressed]}
        >
          <Text style={styles.emailBtnText}>modam으로 이메일 보내기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 화면 전체 래퍼
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // 본문 컨테이너
  body: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.l,
    alignItems: "center",
  },

  // 안내 텍스트
  desc: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
    marginBottom: 12,
  },

  // 이메일 버튼
  emailBtn: {
    width: "100%",
    height: 40,
    borderRadius: radius[300],
    backgroundColor: colors.mono[150],
    alignItems: "center",
    justifyContent: "center",
  },

  // 버튼 텍스트
  emailBtnText: {
    ...typography["detail-bold"],
    color: colors.mono[950],
  },

  // 버튼 눌림 피드백
  pressed: {
    opacity: 0.6,
  },
});
