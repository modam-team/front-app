import { fetchOnboardingStatus, fetchUserProfile } from "@apis/userApi";
import { colors } from "@theme/colors";
import { clearAuth } from "@utils/auth";
import { getToken } from "@utils/secureStore";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthGateScreen({ navigation }) {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 토큰 존재 확인 (없으면 API 호출하지 말고 바로 로그인)
        const accessToken = await getToken("accessToken");
        const refreshToken = await getToken("refreshToken");

        if (!accessToken && !refreshToken) {
          navigation.reset({
            index: 0,
            routes: [{ name: "OnboardingLogin" }],
          });
          return;
        }

        // 유저 프로필 조회
        await fetchUserProfile();

        // 온보딩 여부 체크
        const onboarding = await fetchOnboardingStatus();

        if (onboarding.onboardingCompleted) {
          navigation.reset({
            index: 0,
            // 이미 온보딩 완료 했었어도 온보딩 화면 테스트 하고 싶으면 이거 OnboardingFlow로 바꾸면 됩니당
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
          routes: [{ name: "OnboardingLogin" }],
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
