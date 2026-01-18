import { setOnAuthFail } from "@apis/clientApi";
import ProgressBarImg from "@assets/progress-bar-img.png";
import {
  REPORT_BACKGROUND_MAP,
  REPORT_BACKGROUND_MAP_PAST,
} from "@constants/reportBackgroundMap";
import BottomTabs from "@navigation/BottomTabs";
import { navigationRef, resetToLogin } from "@navigation/navigationRef";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddEntryScreen from "@screens/AddEntryScreen";
import AuthGateScreen from "@screens/AuthGateScreen";
import BookDetailScreen from "@screens/BookDetailScreen";
import EditNameScreen from "@screens/EditNameScreen";
import FriendCalendarScreen from "@screens/FriendCalendarScreen";
import FriendListScreen from "@screens/FriendListScreen";
import GoalResultScreen from "@screens/GoalResultScreen";
import OnboardingFlowScreen from "@screens/OnboardingFlowScreen";
import OnboardingIntroScreen from "@screens/OnboardingIntroScreen";
import OnboardingLoginScreen from "@screens/OnboardingLoginScreen";
import ProfileScreen from "@screens/ProfileScreen";
import SettingsScreen from "@screens/SettingsScreen";
import { colors } from "@theme/colors";
import { clearAuth } from "@utils/auth";
import { Asset } from "expo-asset";
import React, { useEffect } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background.DEFAULT },
};

export default function App() {
  useEffect(() => {
    // 토큰 재발급 실패시 전역 처리
    setOnAuthFail(async (err) => {
      console.warn("[Auth] 토큰 재발급 실패 -> 로그인 화면으로 이동", err);
      await clearAuth();
      resetToLogin();
    });

    Asset.loadAsync([
      ...Object.values(REPORT_BACKGROUND_MAP),
      ...Object.values(REPORT_BACKGROUND_MAP_PAST),
      ProgressBarImg,
    ]);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
      >
        <Stack.Navigator initialRouteName="OnboardingIntro">
          <Stack.Screen
            name="OnboardingIntro"
            component={OnboardingIntroScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingLogin"
            component={OnboardingLoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingFlow"
            component={OnboardingFlowScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Root"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddEntry"
            component={AddEntryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookDetail"
            component={BookDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FriendList"
            component={FriendListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FriendCalendar"
            component={FriendCalendarScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="SettingsScreen"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditNameScreen"
            component={EditNameScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuthGate"
            component={AuthGateScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GoalResult"
            component={GoalResultScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
