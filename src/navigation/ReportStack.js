import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChangeGenreScreen from "@screens/ChangeGenreScreen";
import EditNameScreen from "@screens/EditNameScreen";
import InquiryScreen from "@screens/InquiryScreen";
import NoticeScreen from "@screens/NoticeScreen";
import ProfileScreen from "@screens/ProfileScreen";
import ReportScreen from "@screens/ReportScreen";
import SettingsScreen from "@screens/SettingsScreen";
import ThemeScreen from "@screens/ThemeScreen";
import React from "react";

const Stack = createNativeStackNavigator();

export default function ReportStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ReportMain"
        component={ReportScreen}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="EditNameScreen"
        component={EditNameScreen}
      />
      <Stack.Screen
        name="ThemeScreen"
        component={ThemeScreen}
      />
      <Stack.Screen
        name="ChangeGenreScreen"
        component={ChangeGenreScreen}
      />
      <Stack.Screen
        name="NoticeScreen"
        component={NoticeScreen}
      />
      <Stack.Screen
        name="InquiryScreen"
        component={InquiryScreen}
      />
    </Stack.Navigator>
  );
}
