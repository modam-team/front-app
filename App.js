import BottomTabs from "./src/navigation/BottomTabs";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import BookDetailScreen from "./src/screens/BookDetailScreen";
import EditNameScreen from "./src/screens/EditNameScreen";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingFlowScreen from "@screens/OnboardingFlowScreen";
import OnboardingIntroScreen from "@screens/OnboardingIntroScreen";
import OnboardingLoginScreen from "@screens/OnboardingLoginScreen";
import ProfileScreen from "@screens/ProfileScreen";
import SettingsScreen from "@screens/SettingsScreen";
import { colors } from "@theme/colors";
import React from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background.DEFAULT },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      {/* 앱이 처음 켜질 때 OnboardingIntro부터 보이도록 ! */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
