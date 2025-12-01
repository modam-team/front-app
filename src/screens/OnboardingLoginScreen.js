import { kakaoLogin } from "@apis/authApi";
import { fetchOnboardingStatus } from "@apis/userApi";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI;

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(
  KAKAO_REDIRECT_URI,
)}&response_type=code`;

export default function OnboardingLoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Kakao OAuth 요청 설정
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef(null);

  const handleKakaoLogin = () => {
    setShowWebView(true);
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

  // WebView에서 URL 바뀔 때마다 호출
  const handleNavigationChange = async (navState) => {
    const { url } = navState;

    // 카카오가 redirect_uri?code=... 로 돌려보낼 때
    if (url.startsWith(KAKAO_REDIRECT_URI)) {
      const code = extractCodeFromUrl(url);

      if (!code) {
        setShowWebView(false);
        return;
      }

      try {
        setLoading(true);

        // 더 이상 WebView 로딩하지 않게 중단
        if (webViewRef.current) {
          webViewRef.current.stopLoading();
        }

        const loginResult = await kakaoLogin(code);

        const { userId } = loginResult;

        setShowWebView(false);
        navigation.replace("OnboardingStep1", { userId });
      } catch (err) {
        console.error("카카오 로그인 실패:", err);
        setShowWebView(false);
      } finally {
        setLoading(false);
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
        </View>
      </View>

      {/* 카카오 로그인 WebView 모달 */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              height: 48,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.l,
              borderBottomWidth: StyleSheet.hairlineWidth,
              justifyContent: "space-between",
            }}
          >
            <Text style={{ ...typography["body-1-bold"] }}>카카오 로그인</Text>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
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
            ref={webViewRef}
            style={{ flex: 1 }}
            source={{ uri: KAKAO_AUTH_URL }}
            startInLoadingState
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onShouldStartLoadWithRequest={(request) => {
              return true;
            }}
            // redirect 처리
            onNavigationStateChange={handleNavigationChange}
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
});
