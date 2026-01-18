import { fetchMonthlyReport } from "@apis/reportApi";
import { fetchUserProfile } from "@apis/userApi";
import YearMonthPicker from "@components/common/YearMonthPicker";
import MonthlyStats from "@components/report/MonthlyStats";
import PlaceHabits from "@components/report/PlaceHabits";
import PreferencePagerSection from "@components/report/PreferencePagerSection";
import ReportEmptyCard from "@components/report/ReportEmptyCard";
import ReportProfileHeader from "@components/report/ReportProfileHeader";
import ReportSectionHeader from "@components/report/ReportSectionHeader";
import ReportToggle from "@components/report/ReportToggle";
import ReportTopHeader from "@components/report/ReportTopHeader";
import Summary from "@components/report/Summary";
import TimeHabits from "@components/report/TimeHabits";
import {
  REPORT_BACKGROUND_MAP,
  REPORT_BACKGROUND_MAP_PAST,
} from "@constants/reportBackgroundMap";
import useReportSectionAnimations from "@hooks/useReportSectionAnimations";
import { useTabBarTheme } from "@navigation/TabBarThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// 리포트 화면
export default function ReportScreen() {
  // 이 스크린이 현재 포커스(탭 선택) 상태인지
  const isFocused = useIsFocused();

  const navigation = useNavigation();

  // 탭바 테마 제어
  const { setTheme } = useTabBarTheme();

  /* ========= User Profile 관련 ========= */
  const [userName, setUserName] = useState(""); // 닉네임 가져오기
  const [profileImageUrl, setProfileImageUrl] = useState(null); // 프로필 이미지 가져오기
  const [userCreatedAt, setUserCreatedAt] = useState(null); // 가입일 가져오기

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await fetchUserProfile();
        setUserName(profile.nickname);
        setProfileImageUrl(profile.profileImageUrl ?? null);
        setUserCreatedAt(
          profile.createdAt ? new Date(profile.createdAt) : null,
        );
      } catch (e) {
        console.error("유저 프로필 조회 실패", e);
      }
    };

    loadUser();
  }, [isFocused]);

  /* ========= Date (year / month) & current month 판단 ========= */
  // 현재 날짜 기준 기본 연도랑 월 설정
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 이번달 리포트인지 지난 달 리포트인지 구분하기
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  /* ========= 이번 달 첫 방문 여부 체크 키 ========= */
  // 이번 달 기준 key는 앱 실행 중에 바뀌면 안돼서 memo로 고정
  const CURRENT_MONTH_KEY = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const REPORT_VISIT_KEY = `report_tab_visited_${CURRENT_MONTH_KEY}`;

  /* ========= 리포트 데이터 ========= */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEmpty = !!data?.summary?.isEmpty;

  /* ========= Section Animation 관련 ========= */
  const {
    stats: statsAnim,
    pref: prefAnim,
    habit: habitAnim,
    resetKeys,
    resetAll,
    handleScroll,
  } = useReportSectionAnimations({ ratio: 0.9 });

  // 습관 분석 토글
  const [habitTab, setHabitTab] = useState("time"); // time | place

  // 스크롤 제어
  const scrollRef = useRef(null);

  // 마지막 스크롤 정보 보관
  const scrollInfoRef = useRef({ y: 0, h: 0 });

  /* ========= year / month 변경 시 재조회 + 애니메이션 리셋 ========= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);

        // 월 변경 시 섹션 진입 애니메이션 상태를 모두 초기화
        resetAll();

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
  }, [year, month, resetAll]);

  /* ========= 탭 전환으로 이 스크린이 다시 포커스 되면 애니메이션 다시 허용 + 스크롤을 top 으로 ========= */
  useEffect(() => {
    if (!isFocused) return;

    resetAll();

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [isFocused, resetAll]);

  /* ========= 파생된 데이터들 ========= */
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

  const isSelectedMonthEmpty = useMemo(() => {
    if (!data) return true;

    // 1) 요일별 기록 합
    const weekdayTotal = (data.readingCountsByWeekday || []).reduce(
      (sum, d) => {
        const slots = d?.slots || {};
        return (
          sum +
          (slots.morning || 0) +
          (slots.afternoon || 0) +
          (slots.evening || 0)
        );
      },
      0,
    );

    // 2) 장소 비율 합
    const placeTotal = (data.readingPlaces || []).reduce(
      (sum, p) => sum + (Number(p.ratio) || 0),
      0,
    );

    // 3) 장르 비율 합
    const genreTotal = (data.genreDistribution || []).reduce(
      (sum, g) => sum + (Number(g.ratio) || 0),
      0,
    );

    // 4) 키워드 합
    const keywordTotal = (data.reviewKeywords || []).reduce(
      (sum, k) => sum + (Number(k.weight) || 0),
      0,
    );

    // 백엔드가 기본값을 내려줘도 합계는 0으로 남아있으니까 여기서 기록이 없는 달을 판별 가능
    return (
      weekdayTotal === 0 &&
      placeTotal === 0 &&
      genreTotal === 0 &&
      keywordTotal === 0
    );
  }, [data]);

  const hasAnyRecordInYear = useMemo(() => {
    const list = data?.monthlyStatus || [];
    // monthlyStatus가 12개 고정으로 내려오더라도 count 합이 1 이상이면 "있다"
    const yearTotal = list.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    return yearTotal > 0;
  }, [data]);

  /* ========= 이번 달 첫 방문인지 체크 ========= */
  const [isFirstVisitThisMonth, setIsFirstVisitThisMonth] = useState(false);

  useEffect(() => {
    if (!isFocused) return;

    const checkFirstVisit = async () => {
      try {
        const visited = await AsyncStorage.getItem(REPORT_VISIT_KEY);

        // 달 바뀐 후 이번 달 첫 방문이면 true
        const first = !visited;
        setIsFirstVisitThisMonth(first);

        // 들어온 순간 방문 처리 (이번 달에 1번만)
        if (!visited) {
          await AsyncStorage.setItem(REPORT_VISIT_KEY, "1");
        }
      } catch (e) {
        console.error("리포트 탭 방문 플래그 체크 실패", e);
        setIsFirstVisitThisMonth(false);
      }
    };

    checkFirstVisit();
  }, [isFocused, REPORT_VISIT_KEY]);

  // 진한 초록 배경은은 첫 방문 + 이번달 + 데이터 있음 일 때만
  const shouldUseCurrentTheme =
    isFirstVisitThisMonth && isCurrentMonth && !isEmpty;

  // 리포트 화면이 포커스일 때만 탭바 테마를 바꿈
  useEffect(() => {
    if (!isFocused) return;

    // 현재 달이면 초록, 아니면 기본(흰색) + 신규 유저면 past 테마로
    setTheme(shouldUseCurrentTheme ? "reportCurrent" : "default");

    // 화면 나가면 무조건 원복
    return () => setTheme("default");
  }, [isFocused, shouldUseCurrentTheme, setTheme]);

  const isCurrentUI = shouldUseCurrentTheme; // current 스타일을 써야 하는가?
  const styleVariant = shouldUseCurrentTheme ? "current" : "past";
  const headerVariant = shouldUseCurrentTheme ? "light" : "green";

  const personaKey = data?.summary?.title?.trim().split(/\s+/).pop();
  const map =
    styleVariant === "current"
      ? REPORT_BACKGROUND_MAP
      : REPORT_BACKGROUND_MAP_PAST;
  const bgSource = !isEmpty && personaKey ? map[personaKey] : null;

  /* ========= 연도랑 월 선택 관리 ========= */
  const [pickerVisible, setPickerVisible] = useState(false);
  const openPicker = () => setPickerVisible(true);
  const closePicker = () => setPickerVisible(false);

  const pickerMinDate = useMemo(() => {
    if (!userCreatedAt) return undefined;

    // 가입월 1일 기준으로 정규화
    const joinMonthStart = new Date(
      userCreatedAt.getFullYear(),
      userCreatedAt.getMonth(),
      1,
    );

    // 기본: 가입월 - 1개월
    const joinMinusOne = new Date(joinMonthStart);
    joinMinusOne.setMonth(joinMinusOne.getMonth() - 1);

    // 리포트 데이터에서 가장 이른 기록 월(있으면)
    const ym = data?.meta?.earliestRecordYM;
    if (ym?.year && ym?.month) {
      const earliest = new Date(ym.year, ym.month - 1, 1);

      // 가입일보다 더 과거 기록이 있으면 그 달부터 오픈
      if (earliest < joinMonthStart) return earliest;
    }

    // 과거 기록 없으면 기존처럼 (가입 -1개월부터)
    return joinMinusOne;
  }, [userCreatedAt, data]);

  /* ========= 개발할 때 테스트 용으로 이번 달 방문 기록 초기화 ========= */
  const resetReportVisitDebug = async () => {
    try {
      await AsyncStorage.removeItem(REPORT_VISIT_KEY);

      // 상태도 즉시 반영
      setIsFirstVisitThisMonth(true);

      // 확인 로그
      // const v = await AsyncStorage.getItem(REPORT_VISIT_KEY);
      // console.log("[reset key]:", REPORT_VISIT_KEY, "after:", v); // null이면 성공
    } catch (e) {
      console.error("리포트 방문 플래그 초기화 실패", e);
    }
  };

  return (
    <ImageBackground
      source={bgSource}
      resizeMode="cover"
      style={styles.bg}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ReportTopHeader
          variant={headerVariant}
          onLongPressLogo={__DEV__ ? resetReportVisitDebug : undefined}
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
              {/* 항상 보이는 프로필 영역 */}
              <ReportProfileHeader
                profileImageUrl={profileImageUrl}
                onPressProfile={() => navigation.navigate("ProfileScreen")}
                onPressEditProfile={() => navigation.navigate("ProfileScreen")}
              />

              {/* Summary는 이번 달을 조회할 때만 보여줌 */}
              {isCurrentMonth ? (
                <Summary
                  summary={data.summary}
                  userName={userName}
                  year={year}
                  month={month}
                  onPressProfile={() => navigation.navigate("ProfileScreen")}
                  onPressEditProfile={() =>
                    navigation.navigate("ProfileScreen")
                  }
                  profileImageUrl={profileImageUrl}
                  isCurrentUI={isCurrentUI}
                />
              ) : null}

              {/* 월별 통계 섹션 */}
              <View onLayout={statsAnim.onLayout}>
                <MonthlyStats
                  year={year}
                  month={month}
                  monthlyStatus={data.monthlyStatus}
                  onChangeYear={setYear}
                  onChangeMonth={setMonth}
                  animateKey={statsAnim.animateKey}
                  resetKey={resetKeys.stats}
                  onOpenPicker={openPicker}
                  isCurrentMonth={isCurrentUI}
                  isEmpty={!hasAnyRecordInYear}
                />
              </View>

              {/* 취향 분석 스와이프 페이저 섹션 */}
              {isSelectedMonthEmpty ? (
                <View onLayout={prefAnim.onLayout}>
                  <ReportSectionHeader
                    month={month}
                    title="취향 분석"
                    caption="나의 별점을 기준으로 작성된 표예요"
                    variant={styleVariant}
                  />
                  <ReportEmptyCard
                    height={373}
                    title={`${year}년 ${month}월은 별점을 남긴 책이 없어요`}
                    caption="완독 후 별점을 남기면 취향 분석을 볼 수 있어요"
                  />
                </View>
              ) : (
                <PreferencePagerSection
                  year={year}
                  month={month}
                  variant={styleVariant}
                  isCurrentMonth={isCurrentUI}
                  genreDistribution={data.genreDistribution}
                  reviewKeywords={data.reviewKeywords}
                  resetKey={resetKeys.pref}
                  onLayout={prefAnim.onLayout}
                  animateKey={prefAnim.animateKey}
                />
              )}

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
                  variant={styleVariant}
                />

                {isSelectedMonthEmpty ? (
                  <ReportEmptyCard
                    height={436}
                    title={`${year}년 ${month}월은 독서한 기록이 없어요`}
                    caption="독서 기록 버튼을 눌러야 습관 분석을 볼 수 있어요"
                  />
                ) : (
                  <>
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
                        resetKey={resetKeys.habit}
                      />
                    ) : (
                      <PlaceHabits
                        places={places}
                        animateKey={habitAnim.animateKey}
                        resetKey={resetKeys.habit}
                      />
                    )}
                  </>
                )}
              </View>
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
            minDate={pickerMinDate}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  bg: {
    flex: 1,
    width: "100%",
  },

  scrollContainer: {
    flexGrow: 1, // 컨텐츠 높이만큼 늘어나서 배경도 같이 스크롤
  },
  content: {
    padding: spacing.l,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },

  dropdownIcon: {
    fontSize: 12,
    color: colors.primary[500],
  },
});
