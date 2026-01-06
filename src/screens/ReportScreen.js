import ReportSectionHeader from "../components/report/ReportSectionHeader";
import { fetchMonthlyReport } from "@apis/reportApi";
import { fetchUserProfile } from "@apis/userApi";
import YearMonthPicker from "@components/YearMonthPicker";
import MonthlyStats from "@components/report/MonthlyStats";
import PlaceHabits from "@components/report/PlaceHabits";
import PreferencePagerSection from "@components/report/PreferencePagerSection";
import ReportToggle from "@components/report/ReportToggle";
import ReportTopHeader from "@components/report/ReportTopHeader";
import Summary from "@components/report/Summary";
import TimeHabits from "@components/report/TimeHabits";
import {
  REPORT_BACKGROUND_MAP,
  REPORT_BACKGROUND_MAP_PAST,
} from "@constants/reportBackgroundMap";
import useSectionVisibilityAnimation from "@hooks/useSectionVisibilityAnimation";
import { useTabBarTheme } from "@navigation/TabBarThemeContext";
import { useIsFocused } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function ReportScreen() {
  const { reset: resetStatsAnim, ...statsAnim } = useSectionVisibilityAnimation(
    { ratio: 0.9 },
  );
  const { reset: resetPrefAnim, ...prefAnim } = useSectionVisibilityAnimation({
    ratio: 0.9,
  });
  const { reset: resetHabitAnim, ...habitAnim } = useSectionVisibilityAnimation(
    { ratio: 0.9 },
  );

  const [preferenceResetKey, setPreferenceResetKey] = useState(0);

  // 이 스크린이 현재 포커스(탭 선택) 상태인지
  const isFocused = useIsFocused();

  const navigation = useNavigation();

  // 탭바 테마 제어
  const { setTheme } = useTabBarTheme();

  // 닉네임 가져오기
  const [userName, setUserName] = useState("");
  // 프로필 이미지 가져오기
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await fetchUserProfile();
        setUserName(profile.nickname);
        setProfileImageUrl(profile.profileImageUrl ?? null);
      } catch (e) {
        console.error("유저 프로필 조회 실패", e);
      }
    };

    loadUser();
  }, [isFocused]);

  // 현재 날짜 기준 기본 연도랑 월 설정
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 이번달 리포트인지 지난 달 리포트인지 구분하기
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // 리포트 화면이 포커스일 때만 탭바 테마를 바꿈
  useEffect(() => {
    if (!isFocused) return;

    // 현재 달이면 초록, 아니면 기본(흰색)
    setTheme(isCurrentMonth ? "reportCurrent" : "default");

    // 화면 나가면 무조건 원복
    return () => setTheme("default");
  }, [isFocused, isCurrentMonth, setTheme]);

  // 리포트 데이터
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 연도랑 월 선택 관리
  const [pickerVisible, setPickerVisible] = useState(false);
  const openPicker = () => setPickerVisible(true);
  const closePicker = () => setPickerVisible(false);

  const scrollRef = useRef(null);

  // 습관 분석 토글
  const [habitTab, setHabitTab] = useState("time"); // 'time' | 'place'

  const [habitResetKey, setHabitResetKey] = useState(0);

  const [statsResetKey, setStatsResetKey] = useState(0);

  // 연도나 월을 변경하면 자동으로 리포트 재조회하도록
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);

        // 통계 리셋
        setStatsResetKey((k) => k + 1);
        resetStatsAnim();

        // 취향 리셋
        setPreferenceResetKey((k) => k + 1);
        resetPrefAnim();

        // 습관 리셋
        setHabitResetKey((k) => k + 1);
        resetHabitAnim();
        setHabitTab("time");
      } catch (e) {
        console.error(
          "리포트 조회 실패:",
          e?.response?.status,
          e?.response?.data,
          e,
        );
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month, resetStatsAnim, resetPrefAnim, resetHabitAnim]);

  // 탭 전환으로 이 스크린이 다시 포커스될 때마다
  useEffect(() => {
    if (!isFocused) return;

    resetStatsAnim();
    resetPrefAnim();
    resetHabitAnim();

    setStatsResetKey((k) => k + 1);
    setPreferenceResetKey((k) => k + 1);
    setHabitResetKey((k) => k + 1);

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [isFocused, resetStatsAnim, resetPrefAnim, resetHabitAnim]);

  const places = useMemo(() => {
    const list = data?.readingPlaces ?? [];
    const ratioByLabel = new Map(list.map((p) => [p.label, p.ratio]));

    return [
      {
        key: "MOVING",
        label: "이동중",
        ratio: ratioByLabel.get("이동중") ?? 0,
      },
      { key: "CAFE", label: "카페", ratio: ratioByLabel.get("카페") ?? 0 },
      { key: "HOME", label: "집", ratio: ratioByLabel.get("집") ?? 0 },
      {
        key: "LIBRARY",
        label: "도서관",
        ratio: ratioByLabel.get("도서관") ?? 0,
      },
    ];
  }, [data]);

  const scrollInfoRef = useRef({ y: 0, h: 0 });

  // 세로 스크롤할 때 섹션들이 화면에 보이는지 체크
  const handleScroll = (e) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const h = layoutMeasurement.height;

    scrollInfoRef.current = { y, h };

    statsAnim.checkAndAnimate(y, h);
    prefAnim.checkAndAnimate(y, h);
    habitAnim.checkAndAnimate(y, h);
  };

  const isEmpty = !!data?.summary?.isEmpty;
  const headerVariant = isCurrentMonth && !isEmpty ? "light" : "green";

  const personaKey = data?.summary?.title?.trim().split(/\s+/).pop();
  const map = isCurrentMonth
    ? REPORT_BACKGROUND_MAP
    : REPORT_BACKGROUND_MAP_PAST;

  const bgSource = !isEmpty && personaKey ? map[personaKey] : null;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <ImageBackground
        source={bgSource}
        resizeMode="cover"
        style={styles.bg}
      >
        <ReportTopHeader
          variant={headerVariant}
          onPressSettings={() => navigation.navigate("SettingsScreen")}
        />
        <View style={styles.content}>
          {loading || !data ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator
                size="large"
                color={colors.primary[500]}
              />
            </View>
          ) : (
            <>
              {/* Summary는 신규 유저여도 항상 */}
              <Summary
                summary={data.summary}
                userName={userName}
                isCurrentMonth={isCurrentMonth}
                onPressProfile={() => navigation.navigate("ProfileScreen")}
                onPressEditProfile={() => navigation.navigate("ProfileScreen")}
                profileImageUrl={profileImageUrl}
              />

              {/* 신규 유저면 나머지 섹션만 숨김 */}
              {isEmpty ? null : (
                <>
                  {/* 월별 통계 섹션 */}
                  <View onLayout={statsAnim.onLayout}>
                    <MonthlyStats
                      year={year}
                      month={month}
                      monthlyStatus={data.monthlyStatus}
                      onChangeYear={setYear}
                      onChangeMonth={setMonth}
                      animateKey={statsAnim.animateKey}
                      resetKey={statsResetKey}
                      onOpenPicker={openPicker}
                      isCurrentMonth={isCurrentMonth}
                    />
                  </View>

                  {/* 취향 분석 스와이프 페이저 섹션 */}
                  <PreferencePagerSection
                    year={year}
                    month={month}
                    variant={isCurrentMonth ? "current" : "past"}
                    isCurrentMonth={isCurrentMonth}
                    genreDistribution={data.genreDistribution}
                    reviewKeywords={data.reviewKeywords}
                    resetKey={preferenceResetKey}
                    onLayout={prefAnim.onLayout}
                    animateKey={prefAnim.animateKey}
                  />

                  {/* 습관 분석 섹션 */}
                  <View
                    style={{ marginTop: 30 }}
                    onLayout={habitAnim.onLayout}
                  >
                    {/* 섹션 헤더*/}
                    <ReportSectionHeader
                      month={month}
                      title="습관 분석"
                      caption="독서 기록 버튼을 누른 기록으로 분석했어요"
                      variant={isCurrentMonth ? "current" : "past"}
                    />

                    {/* 토글 */}
                    <ReportToggle
                      value={habitTab}
                      onChange={setHabitTab}
                    />

                    {/* 카드 */}
                    {habitTab === "time" ? (
                      <TimeHabits
                        readingCountsByWeekday={data.readingCountsByWeekday}
                        animateKey={habitAnim.animateKey}
                        resetKey={habitResetKey}
                      />
                    ) : (
                      <PlaceHabits
                        places={places}
                        animateKey={habitAnim.animateKey}
                        resetKey={habitResetKey}
                      />
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {/* 공통 YearMonthPicker */}
          <YearMonthPicker
            visible={pickerVisible}
            onClose={closePicker}
            selectedYear={year}
            selectedMonth={month}
            onSelectYear={setYear}
            onSelectMonth={setMonth}
          />
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  bg: {
    flexGrow: 1,
    width: "100%",
  },

  scrollContainer: {
    flexGrow: 1, // 컨텐츠 높이만큼 늘어나서 배경도 같이 스크롤
    paddingBottom: 70,
  },
  content: {
    padding: spacing.l,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.DEFAULT,
  },

  dropdownIcon: {
    fontSize: 12,
    color: colors.primary[500],
  },

  // 임시
  placeHolderCard: {
    height: 436,
    marginTop: 12,
    borderRadius: 28,
    backgroundColor: colors.mono[100],
    paddingVertical: 22,
    paddingHorizontal: 29,
    justifyContent: "center",
  },
  placeHolderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.mono[950],
    marginBottom: 8,
  },
  placeHolderCaption: {
    ...typography["body-2-regular"],
    color: colors.mono[500],
  },
});
