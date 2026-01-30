import { appleLogin, kakaoLogin } from "@apis/authApi";
import { resetAuthFailFlag } from "@apis/clientApi";
import { login } from "@react-native-seoul/kakao-login";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID;
const APPLE_REDIRECT_URI = process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI;
const AUTH_BYPASS =
  (process.env.EXPO_PUBLIC_AUTH_BYPASS || "").toLowerCase() === "true";

const APPLE_AUTH_URL = `https://appleid.apple.com/auth/authorize?client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
  APPLE_REDIRECT_URI || "",
)}&response_type=code&response_mode=query`;

export default function OnboardingLoginScreen({ navigation }) {
  // Apple OAuth 요청 설정
  const [showAppleWebView, setShowAppleWebView] = useState(false);
  const appleWebViewRef = useRef(null);

  // 화면 상단 짤림
  const insets = useSafeAreaInsets();

  const handleKakaoLogin = async () => {
    if (AUTH_BYPASS) {
      navigation.replace("OnboardingFlow");
      return;
    }
    try {
      // 네이티브 SDK로 로그인 -> 액세스 토큰 획득
      const token = await login();
      const accessToken = token.accessToken;

      // 백엔드 API 호출 -> accessToken 전달
      await kakaoLogin(accessToken);

      resetAuthFailFlag();

      navigation.replace("AuthGate");
    } catch (err) {
      console.error("카카오 로그인 실패:", err);
    }
  };

  const handleAppleLogin = () => {
    if (AUTH_BYPASS) {
      navigation.replace("OnboardingFlow");
      return;
    }
    if (!APPLE_CLIENT_ID || !APPLE_REDIRECT_URI) {
      Alert.alert(
        "애플 로그인 설정 필요",
        "APPLE_CLIENT_ID / APPLE_REDIRECT_URI 환경변수를 확인해주세요.",
      );
      return;
    }
    setShowAppleWebView(true);
  };

  // URL에서 code= 찾기
  const extractCodeFromUrl = (url) => {
    try {
      const query = url.split("?")[1] || "";
      const params = new URLSearchParams(query);
      return params.get("code");
    } catch (e) {
      // URLSearchParams 안되면 수동으로 파싱
      const query = url.split("?")[1] || "";
      const pairs = query.split("&");
      for (const p of pairs) {
        const [k, v] = p.split("=");
        if (k === "code") return decodeURIComponent(v);
      }
      return null;
    }
  };

  const handleAppleNavigationChange = async (navState) => {
    const { url } = navState;

    if (APPLE_REDIRECT_URI && url.startsWith(APPLE_REDIRECT_URI)) {
      const code = extractCodeFromUrl(url);

      if (!code) {
        setShowAppleWebView(false);
        return;
      }

      try {
        if (appleWebViewRef.current) {
          appleWebViewRef.current.stopLoading();
        }

        await appleLogin(code);

        resetAuthFailFlag();

        setShowAppleWebView(false);

        navigation.replace("AuthGate");
      } catch (err) {
        console.error("애플 로그인 실패:", err);
        setShowAppleWebView(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>MODAM에{`\n`}오신 것을 환영합니다</Text>
        </View>

        <View style={styles.loginSection}>
          {/* 간편 로그인 구분선 */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { marginLeft: spacing.l }]} />
            <Text style={styles.dividerLabel}>간편 로그인</Text>
            <View style={[styles.dividerLine, { marginRight: spacing.l }]} />
          </View>

          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.kakaoButton}
            onPress={handleKakaoLogin}
          >
            <Text style={styles.kakaoLabel}>KaKao</Text>
          </TouchableOpacity>
          {/* 애플 로그인 버튼 */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.appleButton}
            onPress={handleAppleLogin}
          >
            <Text style={styles.appleLabel}>Apple</Text>
          </TouchableOpacity>
          {AUTH_BYPASS && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.devBypassButton}
              onPress={() => navigation.replace("OnboardingFlow")}
            >
              <Text style={styles.devBypassLabel}>
                개발용: 로그인 없이 진행
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 애플 로그인 WebView 모달 */}
      <Modal
        visible={showAppleWebView}
        animationType="slide"
        onRequestClose={() => setShowAppleWebView(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              height: insets.top + 48,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.l,
              paddingTop: insets.top,
              borderBottomWidth: StyleSheet.hairlineWidth,
              justifyContent: "space-between",
            }}
          >
            <Text style={{ ...typography["body-1-bold"] }}>애플 로그인</Text>
            <TouchableOpacity onPress={() => setShowAppleWebView(false)}>
              <Text
                style={{
                  ...typography["body-2-regular"],
                  color: colors.warning.strong,
                }}
              >
                닫기
              </Text>
            </TouchableOpacity>
          </View>

          <WebView
            ref={appleWebViewRef}
            style={{ flex: 1 }}
            source={{ uri: APPLE_AUTH_URL }}
            startInLoadingState
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onShouldStartLoadWithRequest={(request) => {
              return true;
            }}
            onNavigationStateChange={handleAppleNavigationChange}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },

  // 제목
  titleWrap: {
    marginHorizontal: spacing.l,
  },
  title: {
    ...typography["heading-1-medium"],
    color: colors.mono[1000],
  },

  // 간편 로그인
  loginSection: {
    marginTop: spacing.xxl,
  },

  // 구분선
  divider: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.mono[500],
  },
  dividerLabel: {
    marginHorizontal: spacing.xs,
    ...typography["detail-regular"],
    color: colors.mono[600],
  },

  // 로그인 버튼
  kakaoButton: {
    height: 47,
    width: 361,
    borderRadius: 23.5,
    marginTop: spacing.m,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FAE100",
  },
  kakaoLabel: {
    ...typography["body-1-bold"],
    color: colors.mono[1000],
  },
  appleButton: {
    height: 47,
    width: 361,
    borderRadius: 23.5,
    marginTop: spacing.s,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.mono[950],
  },
  appleLabel: {
    ...typography["body-1-bold"],
    color: colors.mono[0],
  },
  devBypassButton: {
    height: 47,
    width: 361,
    borderRadius: 12,
    marginTop: spacing.s,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.mono[300],
    backgroundColor: colors.mono[100],
  },
  devBypassLabel: {
    ...typography["body-2-regular"],
    color: colors.mono[800],
  },
});
