import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EditNameScreen from "@screens/EditNameScreen";
import ProfileScreen from "@screens/ProfileScreen";
import ReportScreen from "@screens/ReportScreen";
import SettingsScreen from "@screens/SettingsScreen";
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
    </Stack.Navigator>
  );
}
