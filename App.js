import BottomTabs from "./src/navigation/BottomTabs";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DevPlaygroundScreen from "@screens/DevPlaygroundScreen";
import OnboardingIntroScreen from "@screens/OnboardingIntroScreen";
import OnboardingLoginScreen from "@screens/OnboardingLoginScreen";
import OnboardingStep1Screen from "@screens/OnboardingStep1Screen";
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
          name="OnboardingStep1"
          component={OnboardingStep1Screen}
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
          options={{ title: "기록 추가" }}
        />
        {/* 테스트용 화면*/}
        <Stack.Screen
          name="DevPlayground"
          component={DevPlaygroundScreen}
          options={{ title: "Dev Playground" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
