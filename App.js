// App.js
import BottomTabs from "./src/navigation/BottomTabs";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DevPlaygroundScreen from "@screens/DevPlaygroundScreen";
import React from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";

// ← 중괄호 X, 정확한 경로

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#fff" },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
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
