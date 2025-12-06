import { colors } from "@theme/colors";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const tabs = [
  { label: "읽고 싶은", value: "before" },
  { label: "읽는 중인", value: "reading" },
  { label: "완독한", value: "after" },
];

export default function BookshelfScreen() {
  const [tab, setTab] = useState("before");
  const [search, setSearch] = useState("");
  const screenWidth = Dimensions.get("window").width;
  const translateX = useRef(new Animated.Value(0)).current;

  const tabOrder = useMemo(() => tabs.map((t) => t.value), []);
  const currentIndex = tabOrder.indexOf(tab);

  const switchTab = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= tabOrder.length) return;
    if (nextIndex === currentIndex) return;

    const nextTab = tabOrder[nextIndex];
    setTab(nextTab);
    Animated.spring(translateX, {
      toValue: -nextIndex * screenWidth,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();
  };

  // 좌우 스와이프로 탭 전환
  const panResponder = useMemo(() => {
    const SWIPE_THRESHOLD = 30;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;

        if (dx < 0) {
          switchTab(currentIndex + 1);
        } else if (dx > 0) {
          switchTab(currentIndex - 1);
        }
      },
    });
  }, [currentIndex, switchTab]);

  return (
    <SafeAreaView
      style={styles.safe}
      {...panResponder.panHandlers}
    >
      {/* 상단 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>책장</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabsRow}>
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => switchTab(tabOrder.indexOf(t.value))}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 검색 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#8A8A8A"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="책장 속 책을 검색해보세요"
            placeholderTextColor="#B1B1B1"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* 정렬 */}
      <View style={styles.bodyArea}>
        <View style={styles.sortRow}>
          <Ionicons
            name="funnel-outline"
            size={14}
            color="#191919"
          />
          <Text style={styles.sortText}>최신순</Text>
        </View>

        <View style={styles.swipeContainer}>
          <Animated.View
            style={[
              styles.pagesContainer,
              {
                width: screenWidth * tabs.length,
                transform: [{ translateX }],
              },
            ]}
          >
            {tabs.map((t) => (
              <ScrollView
                key={t.value}
                style={[styles.page, { width: screenWidth }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 상단 여백 (책 자리) */}
                <View style={styles.topSpacer} />

                {/* 상단 선반 */}
                <View style={styles.shelfArea}>
                  <View style={styles.shelfGroup}>
                    <View style={styles.shelfBar}>
                      <LinearGradient
                        colors={["#FFFFFF", "#878787"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.hole, styles.holeLeft]}
                      />
                      <LinearGradient
                        colors={["#FFFFFF", "#878787"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.hole, styles.holeRight]}
                      />
                    </View>
                  </View>
                </View>

                {/* 빈 상태 문구 */}
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    추가된 책이 없습니다.{"\n"}책을 추가한 후 독서를 시작해보세요.
                  </Text>
                </View>

                {/* 하단 선반 */}
                <View style={[styles.shelfArea, styles.bottomShelfArea]}>
                  <View style={[styles.shelfGroup, styles.shelfSpacing]}>
                    <View style={styles.shelfBar}>
                      <LinearGradient
                        colors={["#FFFFFF", "#878787"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.hole, styles.holeLeft]}
                      />
                      <LinearGradient
                        colors={["#FFFFFF", "#878787"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.hole, styles.holeRight]}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>
            ))}
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAF5",
  },
  header: {
    height: 64,
    backgroundColor: "#FAFAF5",
    paddingTop: 0,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2A3D",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAF5",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tabItem: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 14,
    paddingBottom: 4,
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B1B1B1",
  },
  tabLabelActive: { color: "#426B1F" },
  tabUnderline: {
    marginTop: 6,
    width: 112,
    height: 2,
    backgroundColor: "#426B1F",
    borderRadius: 2,
  },
  searchWrap: {
    backgroundColor: "#FAFAF5",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#191919",
    marginLeft: 8,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    color: "#191919",
    fontWeight: "500",
  },
  scrollContent: {
    backgroundColor: "#E9E9E9",
    paddingBottom: 160,
  },
  topSpacer: {
    height: 140,
    width: "90%",
    alignSelf: "center",
    marginBottom: -24,
  },
  shelfArea: {
    backgroundColor: "#E9E9E9",
    paddingTop: 16,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  shelfGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: 22,
  },
  shelfSpacing: {
    marginTop: 40,
  },
  bottomShelfArea: {
    paddingTop: 0,
    marginTop: 12,
  },
  shelfBar: {
    width: 374,
    height: 45,
    borderRadius: 5,
    backgroundColor: "rgba(66, 107, 31, 0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
    position: "relative",
    alignSelf: "center",
  },
  hole: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  holeLeft: { left: 6, top: 27 },
  holeRight: { right: 6, top: 27 },
  emptyWrap: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    color: "#888888",
    lineHeight: 26,
  },
  swipeContainer: {
    flex: 1,
    overflow: "hidden",
  },
  pagesContainer: {
    flexDirection: "row",
  },
  page: {
    flex: 1,
  },
  bodyArea: {
    flex: 1,
    backgroundColor: "#E9E9E9",
  },
});
