import ReportSectionHeader from "../components/report/ReportSectionHeader";
import { fetchMonthlyReport } from "@apis/reportApi";
import { fetchUserProfile } from "@apis/userApi";
import YearMonthPicker from "@components/YearMonthPicker";
import GenrePreferenceCard from "@components/report/GenrePreferenceCard";
import KeywordReviewCard from "@components/report/KeywordReviewCard";
import MonthlyStats from "@components/report/MonthlyStats";
import PlaceHabits from "@components/report/PlaceHabits";
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
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CARD_WIDTH = 300;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

export default function ReportScreen() {
  const { reset: resetStatsAnim, ...statsAnim } = useSectionVisibilityAnimation(
    { ratio: 0.5 },
  );
  const { reset: resetHabitAnim, ...habitAnim } = useSectionVisibilityAnimation(
    { ratio: 0.5 },
  );

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

  // 취향 분석(페이저) 섹션 레이아웃
  const [preferenceLayout, setPreferenceLayout] = useState({
    y: 0,
    height: 0,
  });

  // 습관 분석 토글
  const [habitTab, setHabitTab] = useState("time"); // 'time' | 'place'

  const [habitResetKey, setHabitResetKey] = useState(0);

  const [statsResetKey, setStatsResetKey] = useState(0);

  // 취향 섹션 안의 개별 카드 애니메이션 키
  const [keywordAnimateKey, setKeywordAnimateKey] = useState(0);
  const [genreAnimateKey, setGenreAnimateKey] = useState(0);

  const [preferenceAnimatedThisFocus, setPreferenceAnimatedThisFocus] =
    useState(false);

  // 페이저 현재 페이지 (0: 키워드, 1: 장르)
  const [activePreferencePage, setActivePreferencePage] = useState(0);
  const preferencePagerRef = useRef(null);

  const isSectionVisible = (section, scrollY, screenHeight, ratio = 0.5) => {
    if (!section?.height) return false;

    const sectionTop = section.y;
    const sectionBottom = sectionTop + section.height;

    const scrollTop = scrollY;
    const scrollBottom = scrollY + screenHeight;

    const visibleTop = Math.max(scrollTop, sectionTop);
    const visibleBottom = Math.min(scrollBottom, sectionBottom);
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) return false;

    const visibleRatio = visibleHeight / section.height;
    return visibleRatio >= ratio;
  };

  // 연도나 월을 변경하면 자동으로 리포트 재조회하도록
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);

        if (preferencePagerRef.current) {
          preferencePagerRef.current.scrollTo({ x: 0, animated: false });
        }
        setActivePreferencePage(0);

        // 통계랑 취향 섹션 모두 다시 애니메이션 가능하도록 리셋
        setStatsResetKey((k) => k + 1);
        resetStatsAnim();
        setPreferenceAnimatedThisFocus(false);

        // 습관도 같이 리셋
        setHabitResetKey((k) => k + 1);
        resetHabitAnim();
        setHabitTab("time");

        // 페이지 안 카드 키들도 초기화
        setGenreAnimateKey((k) => k + 1);
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
  }, [year, month, resetStatsAnim, resetHabitAnim]);

  // 탭 전환으로 이 스크린이 다시 포커스될 때마다
  useEffect(() => {
    if (!isFocused) return;

    resetStatsAnim();
    resetHabitAnim();

    // bar 내부 값 0으로 초기화
    setStatsResetKey((k) => k + 1);
    setHabitResetKey((k) => k + 1);

    setPreferenceAnimatedThisFocus(false);
    setKeywordAnimateKey((k) => k + 1);
    setGenreAnimateKey((k) => k + 1);

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [isFocused, resetStatsAnim, resetHabitAnim]);

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

  // 취향(페이저) 섹션 위치 저장
  const handlePreferenceLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setPreferenceLayout({ y, height });
  };

  // 세로 스크롤할 때 섹션들이 화면에 보이는지 체크
  const handleScroll = (e) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const screenHeight = layoutMeasurement.height;

    statsAnim.checkAndAnimate(scrollY, screenHeight);
    habitAnim.checkAndAnimate(scrollY, screenHeight);

    // 취향(페이저) 섹션
    const prefVisible = isSectionVisible(
      preferenceLayout,
      scrollY,
      screenHeight,
    );
    if (prefVisible && !preferenceAnimatedThisFocus) {
      // 현재 활성 페이지 카드만 애니메이션
      if (activePreferencePage === 0) {
        setGenreAnimateKey((k) => k + 1);
      } else {
        setKeywordAnimateKey((k) => k + 1);
      }
      setPreferenceAnimatedThisFocus(true);
    }
  };

  // 가로 페이저 스크롤 끝났을 때 페이지 계산
  const handlePreferencePageScrollEnd = (e) => {
    const { contentOffset } = e.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / SNAP_INTERVAL);

    if (pageIndex !== activePreferencePage) {
      setActivePreferencePage(pageIndex);

      // 페이지 전환 시, 해당 페이지 카드 애니메이션 재시작
      if (pageIndex === 0) {
        setGenreAnimateKey((k) => k + 1);
      } else {
        setKeywordAnimateKey((k) => k + 1);
      }
    }
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
                  <View onLayout={handlePreferenceLayout}>
                    {/* 섹션 헤더*/}
                    <ReportSectionHeader
                      month={month}
                      title="취향 분석"
                      caption="나의 별점을 기준으로 작성된 표예요"
                      variant={isCurrentMonth ? "current" : "past"}
                    />

                    {/* 스와이프 카드 */}
                    <Animated.ScrollView
                      ref={preferencePagerRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={handlePreferencePageScrollEnd}
                      scrollEventThrottle={16}
                      snapToInterval={SNAP_INTERVAL}
                      decelerationRate="fast"
                      contentContainerStyle={{
                        // 왼쪽에서부터 차례대로 보이게 (스크린 패딩만 신경)
                        paddingRight: CARD_SPACING,
                      }}
                    >
                      {/* 페이지 0: 최근 선호 장르 도넛 차트 */}
                      <View
                        style={{ width: CARD_WIDTH, marginRight: CARD_SPACING }}
                      >
                        <GenrePreferenceCard
                          genres={data.genreDistribution}
                          animateKey={genreAnimateKey}
                          isCurrentMonth={isCurrentMonth}
                        />
                      </View>

                      {/* 페이지 1: 키워드 리뷰 */}
                      <View style={{ width: CARD_WIDTH }}>
                        <KeywordReviewCard
                          year={year}
                          month={month}
                          keywords={data.reviewKeywords}
                          animateKey={keywordAnimateKey}
                          isActive={activePreferencePage === 1}
                        />
                      </View>
                    </Animated.ScrollView>
                  </View>

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
