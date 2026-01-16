/*
import { client } from "@apis/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 포그라운드에서도 알림 배너 보이게
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const TOKEN_CACHE_KEY = `fcm_token_last_sent_${Platform.OS}`;

//Android 로컬 알림/푸시 채널 설정
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
  });
}

// 서버에 토큰 저장
async function postTokenToServer(token) {
  await client.post("/log-token", JSON.stringify(token), {
    headers: { "Content-Type": "application/json" },
  });
}

// RN Firebase Messaging으로 FCM 토큰 얻기
async function getFcmTokenByRnFirebase() {
  try {
    // iOS 권한 요청
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    // iOS에서 권한 거부면 토큰 못 얻음
    if (!enabled && Platform.OS === "ios") return null;

    const fcmToken = await messaging().getToken();
    return fcmToken || null;
  } catch (e) {
    console.warn("[push] RNFirebase getToken 실패:", e?.message || e);
    return null;
  }
}

// Android에서만 Expo API로 FCM 토큰 나오는 경우가 있어서
async function getFcmTokenByExpoFallback() {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return null;

    await ensureAndroidChannel();

    const token = await Notifications.getDevicePushTokenAsync();
    if (token?.type === "fcm" && typeof token.data === "string") {
      return token.data;
    }
    return null;
  } catch (e) {
    console.warn("[push] Expo fallback 실패:", e?.message || e);
    return null;
  }
}

//서버에 FCM 토큰 등록
export async function registerPushTokenToServer() {
  await ensureAndroidChannel();

  // 1) RNFirebaseeas
  const fcm1 = await getFcmTokenByRnFirebase();

  // 2) fallback: 개발 중 Android Expo 환경 대비
  const fcm2 =
    fcm1 ??
    (Platform.OS === "android" ? await getFcmTokenByExpoFallback() : null);

  const fcmToken = fcm2;
  if (!fcmToken) return null;

  // 중복 전송 방지
  const last = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
  if (last === fcmToken) return fcmToken;

  await postTokenToServer(fcmToken);
  await AsyncStorage.setItem(TOKEN_CACHE_KEY, fcmToken);

  return fcmToken;
}

// 토큰 갱신 시 서버에도 반영
export function listenPushTokenRefresh() {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      await postTokenToServer(newToken);
      await AsyncStorage.setItem(TOKEN_CACHE_KEY, newToken);
    } catch (e) {
      console.warn("[push] token refresh 저장 실패:", e?.message || e);
    }
  });
}

// 앱이 켜져있을 때 들어오는 fcm 메시지를 받아서 로컬 알림으로 띄워주는 리스너
export function listenForegroundMessages() {
  return messaging().onMessage(async (remoteMessage) => {
    try {
      await ensureAndroidChannel();

      const hasNotificationPayload =
        !!remoteMessage?.notification?.title ||
        !!remoteMessage?.notification?.body;

      // data-only일 때만 로컬 알림으로 띄우기 (중복 방지)
      if (hasNotificationPayload) return;

      const title = remoteMessage?.data?.title || "MODAM";
      const body = remoteMessage?.data?.body || "";

      if (!title && !body) return;

      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } catch (e) {
      console.warn("[push] foreground message 처리 실패:", e?.message || e);
    }
  });
}
*/
