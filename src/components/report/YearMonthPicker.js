import CheckIcon from "@assets/icons/check.svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { buildMonthsByYear, buildYearsFrom2010 } from "@utils/dateOptions";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
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

export default function YearMonthPicker({
  visible,
  onClose,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
}) {
  const years = useMemo(() => buildYearsFrom2010(), []);
  const months = useMemo(() => buildMonthsByYear(selectedYear), [selectedYear]);

  // 위아래로 스크롤할 요소가 남아있는지에 따라서 fade 표시 여부 결정
  const [showYearTopFade, setShowYearTopFade] = useState(false);
  const [showYearBottomFade, setShowYearBottomFade] = useState(
    years.length > VISIBLE_COUNT,
  );

  const [showMonthTopFade, setShowMonthTopFade] = useState(false);
  const [showMonthBottomFade, setShowMonthBottomFade] = useState(
    months.length > VISIBLE_COUNT,
  );

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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* 모달 바깥 영역 누르면 닫히도록 */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.inner}>
            {/* 헤더 */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>날짜</Text>
            </View>

            {/* 가로 구분선 */}
            <View style={styles.divider} />

            {/* 연 / 월 영역 */}
            <View style={styles.columns}>
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
                          style={styles.itemRowYear}
                          onPress={() => onSelectYear?.(year)}
                        >
                          <Text
                            style={[
                              styles.itemText,
                              isActive && styles.itemTextActive,
                            ]}
                          >
                            {year}년
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </MaskedView>
              </View>

              {/* 세로 구분선 */}
              <View style={styles.verticalDivider} />

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
                              isActive && styles.itemTextActive,
                            ]}
                          >
                            {month}월
                          </Text>

                          {isActive && (
                            <CheckIcon
                              width={16}
                              height={16}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </MaskedView>
              </View>
            </View>

            {/* 가로 구분선 */}
            <View style={styles.divider} />

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  sheet: {
    width: "100%",
    height: 355,
  },
  inner: {
    borderRadius: radius[400],
    backgroundColor: colors.primary[400],
    overflow: "hidden",
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  headerTitle: {
    ...typography["body-1-bold"],
    color: colors.mono[0],
  },
  divider: {
    height: 1,
    backgroundColor: colors.primary[100],
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
  scrollContent: {
    paddingBottom: ITEM_HEIGHT,
  },
  itemRowYear: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  itemRowMonth: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
    justifyContent: "space-between",
  },
  itemText: {
    ...typography["body-1-regular"],
    color: colors.primary[0],
  },
  itemTextActive: {
    ...typography["body-1-bold"],
    color: colors.mono[0],
  },
  verticalDivider: {
    width: 1,
    backgroundColor: colors.primary[100],
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
    color: colors.mono[0],
  },
});
