import { fetchOnboardingStatus, fetchUserProfile } from "@apis/userApi";
import { colors } from "@theme/colors";
import { clearAuth } from "@utils/auth";
import { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

export default function AuthGateScreen({ navigation }) {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 유저 프로필 조회
        const profile = await fetchUserProfile();

        // 탈퇴 유예 상태 체크
        if (profile.status === "WITHDRAWAL_PENDING") {
          Alert.alert(
            "탈퇴 처리 중인 계정이에요",
            "아직 14일이 지나지 않아\n계정을 복구할 수 있어요.\n다시 돌아오시겠어요?",
            [
              {
                text: "아니요",
                style: "cancel",
                onPress: async () => {
                  await clearAuth();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "OnboardingIntro" }],
                  });
                },
              },
              {
                text: "네, 돌아올게요",
                onPress: async () => {
                  // (선택) 복구 API 있으면 여기서 호출
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Root" }],
                  });
                },
              },
            ],
          );
          return;
        }

        // 온보딩 여부 체크
        const onboarding = await fetchOnboardingStatus();

        if (onboarding.onboardingCompleted) {
          navigation.reset({
            index: 0,
            routes: [{ name: "Root" }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "OnboardingFlow" }],
          });
        }
      } catch (e) {
        console.error("AuthGate 실패", e);
        await clearAuth();
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
      }
    };

    bootstrap();
  }, []);

  // 로딩 화면
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator
        size="large"
        color={colors.primary[500]}
      />
    </View>
  );
}
