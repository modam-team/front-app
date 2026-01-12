import CheckGreenIcon from "@assets/icons/check-green.svg";
import CheckIcon from "@assets/icons/check.svg";
import Button from "@components/common/Button";
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
  minDate,
  onToast,
}) {
  // 모달을 애니메이션 끝날 때까지 유지하기 위한 내부 상태
  const [mounted, setMounted] = useState(visible);

  // 시트 애니메이션 값 (아래에서 시작)
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // 나중엔 다시 이거만 남길 예정 !! (아래 코드 지우고)
  const baseDate = useMemo(() => new Date(), []);

  // 규민오빠 요청대로 임시 사항 !!!!!!!!!!!! 가입일 - 1개월 (최소 선택 가능 월)
  const minSelectableDate = useMemo(() => {
    if (!minDate) return null;

    // 연/월만 쓰기 위해 day=1로 고정
    const y = minDate.getFullYear();
    const m = minDate.getMonth(); // 0-based

    // "가입월 - 1개월" 계산
    // (new Date(y, m, 1)) 은 로컬 타임존 기준으로 안전
    const d = new Date(y, m, 1);
    d.setMonth(d.getMonth() - 1);

    return d;
  }, [minDate]);

  const years = useMemo(
    //() => buildYearsFrom2010(baseDate, minDate),
    () => buildYearsFrom2010(baseDate, minSelectableDate), // 임시 사항 !!!!!
    [baseDate, minSelectableDate], // 원랜 의존성 배열에 minSelectableDate 대신 minDate가 들어감
  );
  const months = useMemo(
    () =>
      mode === "year-month"
        ? buildMonthsByYear(selectedYear, baseDate, true, minDate)
        : [],
    [mode, selectedYear, baseDate, minDate],
  );

  const isBeforeMinSelectable = (y, m) => {
    if (!minSelectableDate) return false;

    const minY = minSelectableDate.getFullYear();
    const minM = minSelectableDate.getMonth() + 1;

    if (y < minY) return true;
    if (y === minY && m < minM) return true;
    return false;
  };

  const isMonthDisabled = (m) => isBeforeMinSelectable(selectedYear, m);

  /* 원래 코드
  // 가입일 이전인 월은 disabled로 정하는 함수
  const isMonthDisabled = (m) => {
    if (!minDate) return false;

    const minY = minDate.getFullYear();
    const minM = minDate.getMonth() + 1;

    // selectedYear가 가입년도보다 과거면 전부 disable
    if (selectedYear < minY) return true;

    // 가입년도면 가입월 이전만 disable
    if (selectedYear === minY && m < minM) return true;

    return false;
    
  };
  */

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

  // 테마별 체크 아이콘 관리
  const checkIconByTheme = useMemo(() => {
    const isMono = theme === "mono";
    return {
      ActiveCheck: isMono ? CheckGreenIcon : CheckIcon,
    };
  }, [theme]);

  const { ActiveCheck } = checkIconByTheme;

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

  // 연도만 고르는 picker 모드일 때
  const handlePressYear = (year) => {
    hideLocalToast();
    onSelectYear?.(year);

    // 연도 선택하면 선택된 연도를 가운데로 보여줌
    const idx = years.findIndex((y) => y === year);
    scrollToCenter(yearScrollRef, idx, years.length);
  };

  // 픽커 닫을 때
  const handleClose = () => {
    hideLocalToast(); // 토스트 띄운거 지우기
    onClose?.();
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

  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);

  // 가운데로 보내주는 헬퍼
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const scrollToCenter = (ref, index, itemCount) => {
    if (!ref?.current) return;

    const centerOffsetIndex = Math.floor(VISIBLE_COUNT / 2); // 6개면 3
    const targetIndex = clamp(
      index - centerOffsetIndex,
      0,
      Math.max(itemCount - VISIBLE_COUNT, 0),
    );
    const y = targetIndex * ITEM_HEIGHT;

    ref.current.scrollTo({ y, animated: false });
  };

  // 모달이 열릴 때 자동으로 스크롤
  useEffect(() => {
    if (!visible) return;

    // 애니메이션/레이아웃 이후에 스크롤이 먹히게
    requestAnimationFrame(() => {
      const yearIndex = years.findIndex((y) => y === selectedYear);
      scrollToCenter(yearScrollRef, Math.max(yearIndex, 0), years.length);

      if (mode === "year-month") {
        const monthIndex = months.findIndex((m) => m === selectedMonth);
        scrollToCenter(monthScrollRef, Math.max(monthIndex, 0), months.length);
      }
    });
  }, [visible, mode, selectedYear, selectedMonth, years, months]);

  // months 바뀔 때 selectedMonth가 유효한지 보정
  useEffect(() => {
    if (!visible) return;
    if (mode !== "year-month") return;

    // 해당 연도에 월이 없을 수는 없겠지만 안전장치
    if (!months || months.length === 0) return;

    const existsInList = months.includes(selectedMonth);
    const isDisabled = existsInList
      ? isBeforeMinSelectable(selectedYear, selectedMonth)
      : true;

    // 불가능하면: 가능한 월로 보정
    if (!existsInList || isDisabled) {
      // months는 desc=true라 최신이 앞에 있음.
      // "가능한 최소 월"로 보내야 하니 뒤에서부터(오름차순으로 보면 첫 가능값) 찾기
      const candidate = [...months]
        .reverse() // 1 -> 최신 순 (오름차순)
        .find((m) => !isBeforeMinSelectable(selectedYear, m));

      // 그래도 없으면 fallback
      const nextMonth = candidate ?? months[months.length - 1];

      onSelectMonth?.(nextMonth);

      const idx = months.findIndex((m) => m === nextMonth);
      scrollToCenter(monthScrollRef, Math.max(idx, 0), months.length);
    }
  }, [
    visible,
    mode,
    months,
    selectedMonth,
    selectedYear,
    minSelectableDate,
    onSelectMonth,
  ]);

  // 토스트 관련한 것들
  const [localToast, setLocalToast] = useState({
    visible: false,
    text: "",
    tone: "primary",
  });

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  // 토스트 보여주기
  const showLocalToast = (text, tone = "primary") => {
    if (!text) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setLocalToast({ visible: true, text, tone });

    toastOpacity.stopAnimation();
    toastOpacity.setValue(0);

    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setLocalToast((prev) => ({ ...prev, visible: false }));
      });
    }, 1800);
  };

  // 정상 월 클릭하면 토스트 바로 지워주기
  const hideLocalToast = () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }

    // 이미 안 보이면 스킵
    if (!localToast.visible) return;

    toastOpacity.stopAnimation();

    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setLocalToast((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

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
          onPress={handleClose}
        />

        {/* 토스트: 시트 위(바깥)에 띄우기 */}
        {localToast.visible && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pickerToastWrap,
              {
                opacity: toastOpacity,
                transform: [
                  {
                    translateY: toastOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Button
              label={localToast.text}
              size="large" // xlarge면 너무 커서 large 추천
              variant={localToast.tone === "error" ? "error" : "primary"}
              tone="fill"
              fullWidth
              style={{ borderRadius: 14 }}
            />
          </Animated.View>
        )}

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
                    ref={yearScrollRef}
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
                        ref={monthScrollRef}
                        showsVerticalScrollIndicator={false}
                        onScroll={handleMonthScroll}
                        scrollEventThrottle={16}
                      >
                        {months.map((month) => {
                          const isActive = month === selectedMonth;
                          const disabled = isMonthDisabled(month);
                          return (
                            <TouchableOpacity
                              key={month}
                              style={styles.itemRowMonth}
                              activeOpacity={disabled ? 1 : 0.85}
                              onPress={() => {
                                if (disabled) {
                                  showLocalToast(
                                    "가입일 이전 날짜예요!",
                                    "error",
                                  );
                                  return;
                                }

                                hideLocalToast();

                                onSelectMonth?.(month);

                                // 월 선택하면 선택한 월을 가운데로 보여줌
                                const idx = months.findIndex(
                                  (m) => m === month,
                                );
                                scrollToCenter(
                                  monthScrollRef,
                                  idx,
                                  months.length,
                                );
                              }}
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
                                  disabled && styles.itemTextDisabled,
                                ]}
                              >
                                {month}월
                              </Text>

                              <View style={styles.checkWrap}>
                                {!disabled && isActive ? (
                                  <ActiveCheck
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
              onPress={handleClose}
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

  // 토스트 스타일
  pickerToastWrap: {
    position: "absolute",
    left: spacing.s,
    right: spacing.s,

    // 픽커 시트 위 바깥에 뜨게
    bottom: SHEET_HEIGHT + 16,
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
    ...typography["heading-4-medium"],
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
  itemTextDisabled: {
    color: colors.mono[500],
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
