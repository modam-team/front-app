import BookshelfScreen from "../screens/BookshelfScreen";
import HomeScreen from "../screens/HomeScreen";
import ReportScreen from "../screens/ReportScreen";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReportStack from "@navigation/ReportStack";
import {
  TabBarThemeProvider,
  useTabBarTheme,
} from "@navigation/TabBarThemeContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

// 탭 라벨 및 아이콘 정의
const TAB_META = {
  책장: { icon: "book" },
  홈: { icon: "home-variant" },
  리포트: { icon: "chart-box" },
};

const TAB_BAR_HEIGHT = 52;

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
  const insets = useSafeAreaInsets();

  // theme 가져오기
  const { theme } = useTabBarTheme();

  // 초록 테마 여부
  const isGreen = theme === "reportCurrent";

  const currentRouteName = state.routes[state.index]?.name;

  const palette = useMemo(() => {
    return {
      tabBg: isGreen ? colors.primary[500] : colors.mono[0], // 탭바 배경
      active: colors.primary[500], // 활성 아이콘 및 텍스트
      inactive: isGreen ? colors.mono[0] : colors.mono[950], // 비활성 아이콘 및 텍스트
      focusedBg: isGreen ? colors.primary[0] : colors.primary[0], // 선택 탭 pill 배경
      fabBg: colors.primary[700], // + 버튼 배경
    };
  }, [isGreen]);

  return (
    <View style={styles.root}>
      {/* FAB도 스타일시트로 */}
      {currentRouteName === "책장" && (
        <View style={styles.fabWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AddEntry")}
            style={[styles.fabButton, { backgroundColor: palette.fabBg }]} // 색만 동적으로
          >
            <Ionicons
              name="add"
              size={24}
              color={colors.mono[0]}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* 라운드/그림자 문제 방지용 2겹 구조 */}
      <View style={styles.tabShadowOuter}>
        {/* radius + clip 전용 */}
        <View style={styles.tabClip}>
          {/* 실제 탭바 */}
          <View
            style={[
              styles.tabInner,
              { backgroundColor: palette.tabBg },
              {
                height: TAB_BAR_HEIGHT + insets.bottom,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <View style={styles.row}>
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

                const iconName = TAB_META[route.name]?.icon || "ellipse";

                const iconColor = isFocused ? palette.active : palette.inactive;
                const textColor = isFocused ? palette.active : palette.inactive;

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    activeOpacity={0.9}
                    style={styles.tabButton}
                  >
                    <View
                      style={[
                        styles.pill,
                        isFocused && { backgroundColor: palette.focusedBg },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconName}
                        size={20}
                        color={iconColor}
                      />
                      <Text style={[styles.tabLabel, { color: textColor }]}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },

  // FAB
  fabWrap: {
    position: "absolute",
    right: 24,
    bottom: 96,
    zIndex: 10,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",

    // shadow (iOS)
    shadowColor: colors.mono[950],
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,

    // elevation (Android)
    elevation: 6,
  },

  // 그림자 전용
  tabShadowOuter: {
    borderTopLeftRadius: radius[500],
    borderTopRightRadius: radius[500],

    // iOS shadow
    shadowColor: colors.mono[950],
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 20,

    // Android elevation
    elevation: 10,
    backgroundColor: "transparent",
  },

  // 클립 레이어
  tabClip: {
    borderTopLeftRadius: radius[500],
    borderTopRightRadius: radius[500],
    overflow: "hidden",
  },

  tabInner: {
    paddingHorizontal: spacing.m,
    justifyContent: "center",
  },

  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tabButton: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "transparent",
  },

  pill: {
    width: 100,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    ...typography["detail-regular"],
  },
});
