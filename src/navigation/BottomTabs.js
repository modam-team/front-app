import BookshelfScreen from "../screens/BookshelfScreen";
import HomeScreen from "../screens/HomeScreen";
import ReportScreen from "../screens/ReportScreen";
import colors from "../theme/legacyColors";
import { Ionicons } from "@expo/vector-icons";
import ReportStack from "@navigation/ReportStack";
import {
  TabBarThemeProvider,
  useTabBarTheme,
} from "@navigation/TabBarThemeContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabs({ navigation }) {
  return (
    <TabBarThemeProvider>
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
          },
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
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
          name="리포트"
          component={ReportStack}
        />
      </Tab.Navigator>
    </TabBarThemeProvider>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const activeColor = "#426B1F";
  const currentRouteName = state.routes[state.index]?.name;

  // theme 가져오기
  const { theme } = useTabBarTheme();

  // 초록 테마 여부
  const isGreen = theme === "reportCurrent";

  return (
    <View style={{ backgroundColor: "transparent" }}>
      {currentRouteName === "책장" && (
        <View
          style={{
            position: "absolute",
            right: 24,
            bottom: 96,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AddEntry")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: activeColor,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons
              name="add"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={{
          // ✅ (수정4) 탭바 배경색 분기 (기본: 하양 / 리포트 현재달: 초록)
          backgroundColor: isGreen ? "#426B1F" : "#FAFAF5",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
          }}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName =
              route.name === "책장"
                ? "bookmark"
                : route.name === "홈"
                  ? "home"
                  : "bar-chart";

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  marginHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: isFocused ? "#D7EEC4" : "transparent",
                }}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={
                    isGreen
                      ? isFocused
                        ? activeColor
                        : "#FFFFFF"
                      : isFocused
                        ? activeColor
                        : "#252829"
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isGreen
                      ? isFocused
                        ? activeColor
                        : "#FFFFFF"
                      : isFocused
                        ? activeColor
                        : "#252829",
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View
          style={{
            alignItems: "center",
            paddingTop: 8,
          }}
        >
          <View
            style={{
              width: 134,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#000",
            }}
          />
        </View>
      </View>
    </View>
  );
}
