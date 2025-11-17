import BookshelfScreen from "../screens/BookshelfScreen";
import HomeScreen from "../screens/HomeScreen";
import ReportScreen from "../screens/ReportScreen";
import colors from "../theme/legacyColors";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabs({ navigation }) {
  return (
    <>
      {/* DEV 버튼: 화면 오른쪽 상단 */}
      {__DEV__ && (
        <TouchableOpacity
          onPress={() => navigation.navigate("DevPlayground")}
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            zIndex: 999,
            backgroundColor: "rgba(0,0,0,0.1)",
            padding: 6,
            borderRadius: 6,
          }}
        >
          <Text>DEV</Text>
        </TouchableOpacity>
      )}

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
          name="책장"
          component={BookshelfScreen}
        />
        <Tab.Screen
          name="홈"
          component={HomeScreen}
        />
        <Tab.Screen
          name="리포트"
          component={ReportScreen}
        />
      </Tab.Navigator>
    </>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const activeColor = "#426B1F";
  const currentRouteName = state.routes[state.index]?.name;
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
          backgroundColor: "#FAFAF5",
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
                  color={isFocused ? activeColor : "#252829"}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: isFocused ? activeColor : "#252829",
                    marginTop: 4,
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
