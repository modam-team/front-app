/*import {
  listenForegroundMessages,
  listenPushTokenRefresh,
  registerPushTokenToServer,
} from "@apis/notificationApi";*/
import { fetchOnboardingStatus, fetchUserProfile } from "@apis/userApi";
import { colors } from "@theme/colors";
import { clearAuth } from "@utils/auth";
import { getToken } from "@utils/secureStore";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

export default function AuthGateScreen({ navigation }) {
  const tokenRefreshUnsubRef = useRef(null);
  const foregroundUnsubRef = useRef(null);

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

        /*
        // 포그라운드 메시지 리스너도 1번만 등록
        if (!foregroundUnsubRef.current) {
          foregroundUnsubRef.current = listenForegroundMessages();
        }
       */

        // 유저 프로필 조회
        const profile = await fetchUserProfile();

        /*
        // 로그인/세션 유효 확정 후 푸시 토큰 등록
        // 실패해도 로그인 흐름 막지 않게 best-effort로
        try {
          await registerPushTokenToServer();

          // 이미 등록된 리스너가 있으면 중복 등록하지 않기
          if (!tokenRefreshUnsubRef.current) {
            tokenRefreshUnsubRef.current = listenPushTokenRefresh();
          }
        } catch (e) {
          console.warn("푸시 토큰 등록 실패(무시 가능):", e?.message || e);
        }
          */

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

    // 언마운트 시 리스너 제거
    return () => {
      if (tokenRefreshUnsubRef.current) {
        tokenRefreshUnsubRef.current();
        tokenRefreshUnsubRef.current = null;
      }
      if (foregroundUnsubRef.current) {
        foregroundUnsubRef.current();
        foregroundUnsubRef.current = null;
      }
    };
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
