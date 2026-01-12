import BottomTabs from "./src/navigation/BottomTabs";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import AuthGateScreen from "./src/screens/AuthGateScreen";
import BookDetailScreen from "./src/screens/BookDetailScreen";
import EditNameScreen from "./src/screens/EditNameScreen";
import FriendCalendarScreen from "./src/screens/FriendCalendarScreen";
import FriendListScreen from "./src/screens/FriendListScreen";
import ProgressBarImg from "@assets/progress-bar-img.png";
import {
  REPORT_BACKGROUND_MAP,
  REPORT_BACKGROUND_MAP_PAST,
} from "@constants/reportBackgroundMap";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GoalResultScreen from "@screens/GoalResultScreen";
import OnboardingFlowScreen from "@screens/OnboardingFlowScreen";
import OnboardingIntroScreen from "@screens/OnboardingIntroScreen";
import OnboardingLoginScreen from "@screens/OnboardingLoginScreen";
import ProfileScreen from "@screens/ProfileScreen";
import SettingsScreen from "@screens/SettingsScreen";
import { colors } from "@theme/colors";
import { Asset } from "expo-asset";
import React, { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background.DEFAULT },
};

export default function App() {
  useEffect(() => {
    Asset.loadAsync([
      ...Object.values(REPORT_BACKGROUND_MAP),
      ...Object.values(REPORT_BACKGROUND_MAP_PAST),
      ProgressBarImg,
    ]);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme}>
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
