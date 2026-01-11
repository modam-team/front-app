import { client } from "@apis/clientApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const TOKEN_CACHE_KEY = `push_token_last_sent_${Platform.OS}`;

export async function registerPushTokenToServer() {
  // 1) 권한
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return null;

  // 2) Android 채널
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // 3) 기기 푸시 토큰 얻기
  const token = await Notifications.getDevicePushTokenAsync();

  //console.log("push token type:", token.type);
  //console.log("push token:", token.data);

  const pushToken = token?.data;
  if (!pushToken) return null;

  // 4) 중복 전송 방지(선택)
  const last = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
  if (last === pushToken) return pushToken;

  // 5) 서버에 저장
  await client.post("/log-token", pushToken, {
    headers: { "Content-Type": "application/json" },
  });

  await AsyncStorage.setItem(TOKEN_CACHE_KEY, pushToken);
  return pushToken;
}
