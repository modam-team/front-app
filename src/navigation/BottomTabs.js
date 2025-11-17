import PlusOverlay from "../components/PlusOverlay";
import BookshelfScreen from "../screens/BookshelfScreen";
import HomeScreen from "../screens/HomeScreen";
import ReportScreen from "../screens/ReportScreen";
import SettingsScreen from "../screens/SettingsScreen";
import colors from "../theme/legacyColors";
// ✅ StyleSheet 포함!
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Tab = createBottomTabNavigator();

function EmptyScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}

export default function BottomTabs() {
  const [showPlus, setShowPlus] = useState(false);

  const onSelect = (label) => {
    // TODO: label 기준으로 AddEntryScreen으로 이동/상태 저장 등 원하는 액션
    setShowPlus(false);
  };

  const PlusButton = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.fab}
      onPress={() => setShowPlus(true)}
    >
      <Text style={styles.fabPlus}>＋</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
          },
          tabBarStyle: {
            height: 64,
            paddingBottom: 10,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            backgroundColor: "#f5f5f5",
          },
          tabBarActiveTintColor: colors.text,
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tab.Screen
          name="책장"
          component={BookshelfScreen}
        />
        <Tab.Screen
          name="홈"
          component={HomeScreen}
        />
        <Tab.Screen
          name="작성"
          component={EmptyScreen}
          options={{ tabBarButton: () => <PlusButton />, headerShown: false }}
        />
        <Tab.Screen
          name="리포트"
          component={ReportScreen}
        />
        <Tab.Screen
          name="설정"
          component={SettingsScreen}
        />
      </Tab.Navigator>

      {/* 가운데 + 오버레이 */}
      <PlusOverlay
        visible={showPlus}
        onClose={() => setShowPlus(false)}
        onSelect={onSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22, // 살짝 떠보이게
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabPlus: { fontSize: 30, lineHeight: 30, color: colors.text },
});
