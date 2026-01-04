import CheckGreenIcon from "@assets/icons/check-green.svg";
import CheckIcon from "@assets/icons/check.svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { buildMonthsByYear, buildYearsFrom2010 } from "@utils/dateOptions";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ITEM_HEIGHT = 32;
const VISIBLE_COUNT = 6;
const SHEET_HEIGHT = 355;

export default function YearMonthPicker({
  visible,
  onClose,
  mode = "year-month", // "연도만 보여줄 거면 -> year" | "연도랑 월 모두 보여줄 거면 -> year-month"
  theme = "green", // green이랑 mono 중에서 선택하기
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
}) {
  // 모달을 애니메이션 끝날 때까지 유지하기 위한 내부 상태
  const [mounted, setMounted] = useState(visible);

  // 시트 애니메이션 값 (아래에서 시작)
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const years = useMemo(() => buildYearsFrom2010(), []);
  const months = useMemo(
    () => (mode === "year-month" ? buildMonthsByYear(selectedYear) : []),
    [mode, selectedYear],
  );

  // 테마별 색상 세트
  const themeColors = useMemo(() => {
    const isMono = theme === "mono";

    return {
      sheetBg: isMono ? colors.mono[0] : colors.primary[400],
      divider: isMono ? colors.mono[400] : colors.primary[100],
      headerText: isMono ? colors.mono[950] : colors.mono[0],
      itemText: isMono ? colors.mono[950] : colors.primary[0],
      itemTextActive: isMono ? colors.primary[500] : colors.mono[0],
    };
  }, [theme]);

  // 위아래로 스크롤할 요소가 남아있는지에 따라서 fade 표시 여부 결정
  const [showYearTopFade, setShowYearTopFade] = useState(false);
  const [showYearBottomFade, setShowYearBottomFade] = useState(
    years.length > VISIBLE_COUNT,
  );

  const [showMonthTopFade, setShowMonthTopFade] = useState(false);
  const [showMonthBottomFade, setShowMonthBottomFade] = useState(
    months.length > VISIBLE_COUNT,
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SHEET_HEIGHT);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, translateY]);

  // months 바뀌면 fade 상태도 재계산
  useEffect(() => {
    setShowMonthTopFade(false);
    setShowMonthBottomFade(months.length > VISIBLE_COUNT);
  }, [months.length]);

  // 연도만 고르는 picker 모드면, 연도 선택 시 자동으로 닫아주기
  const handlePressYear = (year) => {
    onSelectYear?.(year);
  };

  // 연도 스크롤 제어
  const handleYearScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const maxScroll = contentSize.height - layoutMeasurement.height;

    if (maxScroll <= 0) {
      setShowYearTopFade(false);
      setShowYearBottomFade(false);
      return;
    }

    setShowYearTopFade(y > 0);
    setShowYearBottomFade(y < maxScroll);
  };

  // 월 스크롤 제어
  const handleMonthScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const maxScroll = contentSize.height - layoutMeasurement.height;

    if (maxScroll <= 0) {
      setShowMonthTopFade(false);
      setShowMonthBottomFade(false);
      return;
    }

    setShowMonthTopFade(y > 0);
    setShowMonthBottomFade(y < maxScroll);
  };

  // early return
  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, mode === "year" && styles.backdropDim]}>
        {/* 모달 바깥 영역 누르면 닫히도록 */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View
            style={[styles.inner, { backgroundColor: themeColors.sheetBg }]}
          >
            {/* 헤더 */}
            <View style={styles.headerRow}>
              <Text
                style={[styles.headerTitle, { color: themeColors.headerText }]}
              >
                날짜
              </Text>
            </View>

            {/* 가로 구분선 */}
            <View
              style={[styles.divider, { backgroundColor: themeColors.divider }]}
            />

            {/* 연 / 월 영역 */}
            <View style={[styles.columns, mode === "year"]}>
              {/* 연도 컬럼 */}
              <View style={styles.column}>
                <MaskedView
                  style={styles.listContainer}
                  maskElement={
                    <View style={styles.mask}>
                      {/* 위쪽 fade */}
                      {showYearTopFade && (
                        <LinearGradient
                          colors={["rgba(0,0,0,0)", "rgba(0,0,0,1)"]}
                          style={styles.topMask}
                        />
                      )}

                      {/* 스크롤 리스트가 또렷하게 보이는 영역 */}
                      <View style={styles.middleMask} />

                      {/* 아래쪽 fade */}
                      {showYearBottomFade && (
                        <LinearGradient
                          colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
                          style={styles.bottomMask}
                        />
                      )}
                    </View>
                  }
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    onScroll={handleYearScroll}
                    scrollEventThrottle={16}
                  >
                    {years.map((year) => {
                      const isActive = year === selectedYear;
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.itemRowYear,
                            mode === "year" && styles.itemRowYearWithCheck, // year 모드일 때 양쪽 정렬
                          ]}
                          onPress={() => handlePressYear(year)}
                        >
                          <Text
                            style={[
                              styles.itemText,
                              styles.itemTextCenter,
                              { color: themeColors.itemText },
                              isActive && [
                                styles.itemTextActive,
                                { color: themeColors.itemTextActive },
                              ],
                            ]}
                          >
                            {year}년
                          </Text>

                          {/* 연도만 선택 모드일 때 체크 아이콘 표시 */}
                          {mode === "year" && (
                            <View style={styles.checkWrap}>
                              {isActive ? <CheckGreenIcon /> : null}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </MaskedView>
              </View>

              {/* mode === "year-month" 일 때만 월 컬럼(구분선 포함) 렌더링 */}
              {mode === "year-month" && (
                <>
                  {/* 세로 구분선 */}
                  <View
                    style={[
                      styles.verticalDivider,
                      { backgroundColor: themeColors.divider },
                    ]}
                  />

                  {/* 월 칼럼 */}
                  <View style={styles.column}>
                    <MaskedView
                      style={styles.listContainer}
                      maskElement={
                        <View style={styles.mask}>
                          {/* 위쪽 fade */}
                          {showMonthTopFade && (
                            <LinearGradient
                              colors={["rgba(0,0,0,0)", "rgba(0,0,0,1)"]}
                              style={styles.topMask}
                            />
                          )}

                          {/* 스크롤 리스트가 또렷하게 보이는 영역 */}
                          <View style={styles.middleMask} />

                          {/* 아래쪽 fade */}
                          {showMonthBottomFade && (
                            <LinearGradient
                              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
                              style={styles.bottomMask}
                            />
                          )}
                        </View>
                      }
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        onScroll={handleMonthScroll}
                        scrollEventThrottle={16}
                      >
                        {months.map((month) => {
                          const isActive = month === selectedMonth;
                          return (
                            <TouchableOpacity
                              key={month}
                              style={styles.itemRowMonth}
                              onPress={() => onSelectMonth?.(month)}
                            >
                              <Text
                                style={[
                                  styles.itemText,
                                  styles.itemTextCenter,
                                  { color: themeColors.itemText },
                                  isActive && [
                                    styles.itemTextActive,
                                    { color: themeColors.itemTextActive },
                                  ],
                                ]}
                              >
                                {month}월
                              </Text>

                              <View style={styles.checkWrap}>
                                {isActive ? (
                                  <CheckIcon
                                    width={16}
                                    height={16}
                                  />
                                ) : null}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </MaskedView>
                  </View>
                </>
              )}
            </View>

            {/* 가로 구분선 */}
            <View
              style={[styles.divider, { backgroundColor: themeColors.divider }]}
            />

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text
                style={[styles.closeText, { color: themeColors.headerText }]}
              >
                닫기
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "stretch",
  },

  // 연도만 선택 모드 딤
  backdropDim: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  // 아이콘 래퍼
  checkWrap: {
    height: ITEM_HEIGHT, // row 높이랑 같게
    justifyContent: "center", // 세로 가운데
    alignItems: "center",
  },

  itemTextCenter: {
    lineHeight: ITEM_HEIGHT, // 텍스트도 row 기준 세로 중앙
  },

  sheet: {
    width: "100%",
    height: 355,
  },
  inner: {
    borderRadius: radius[400],
    overflow: "hidden",
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  headerTitle: {
    ...typography["body-1-bold"],
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.m,
  },
  columns: {
    flexDirection: "row",
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  column: {
    flex: 1,
  },
  listContainer: {
    height: ITEM_HEIGHT * VISIBLE_COUNT,
    overflow: "hidden",
    position: "relative",
  },
  itemRowYear: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  // year 모드일 때 체크 아이콘 때문에 space-between
  itemRowYearWithCheck: {
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemRowMonth: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
    justifyContent: "space-between",
  },
  itemText: {
    ...typography["body-1-regular"],
  },
  itemTextActive: {
    ...typography["body-1-bold"],
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: spacing.m,
  },
  mask: {
    flex: 1,
  },
  topMask: {
    height: ITEM_HEIGHT * 1.5,
  },
  middleMask: {
    flex: 1,
    backgroundColor: "black",
  },
  bottomMask: {
    height: ITEM_HEIGHT * 1.5,
  },
  closeButton: {
    alignItems: "center",
    paddingTop: spacing.s,
    paddingBottom: spacing.xl,
  },
  closeText: {
    ...typography["heading-4-medium"],
  },
});
