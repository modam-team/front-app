import { fetchMonthlyReport } from "@apis/reportApi";
import { fetchUserProfile } from "@apis/userApi";
import GenrePreferenceCard from "@components/report/GenrePreferenceCard";
import KeywordReviewCard from "@components/report/KeywordReviewCard";
import MonthlyStats from "@components/report/MonthlyStats";
import Summary from "@components/report/Summary";
import YearMonthPicker from "@components/report/YearMonthPicker";
import {
  REPORT_BACKGROUND_MAP,
  REPORT_BACKGROUND_MAP_PAST,
} from "@constants/reportBackgroundMap";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CARD_WIDTH = 300;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

export default function ReportScreen() {
  // 닉네임 가져오기
  const [userName, setUserName] = useState("");
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await fetchUserProfile();
        setUserName(profile.nickname);
      } catch (e) {
        console.error("유저 프로필 조회 실패", e);
      }
    };

    loadUser();
  }, []);

  // 현재 날짜 기준 기본 연도랑 월 설정
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 이번달 리포트인지 지난 달 리포트인지 구분하기
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // 리포트 데이터
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 연도랑 월 선택 관리
  const [pickerVisible, setPickerVisible] = useState(false);
  const openPicker = () => setPickerVisible(true);
  const closePicker = () => setPickerVisible(false);

  // 이 스크린이 현재 포커스(탭 선택) 상태인지
  const isFocused = useIsFocused();

  const scrollRef = useRef(null);

  // 통계 섹션 레이아웃 정보 (스크롤에서 보이는지 계산용)
  const [statsLayout, setStatsLayout] = useState({ y: 0, height: 0 });

  // 취향 분석(페이저) 섹션 레이아웃
  const [preferenceLayout, setPreferenceLayout] = useState({
    y: 0,
    height: 0,
  });

  // 세로 스크롤 애니메이션 트리거 키
  const [statsAnimateKey, setStatsAnimateKey] = useState(0);
  const [statsResetKey, setStatsResetKey] = useState(0);

  // 취향 섹션 안의 개별 카드 애니메이션 키
  const [keywordAnimateKey, setKeywordAnimateKey] = useState(0);
  const [genreAnimateKey, setGenreAnimateKey] = useState(0);

  // 이번 포커스 사이클에서 이미 애니메이션 돌렸는지 플래그
  const [statsAnimatedThisFocus, setStatsAnimatedThisFocus] = useState(false);
  const [preferenceAnimatedThisFocus, setPreferenceAnimatedThisFocus] =
    useState(false);

  // 페이저 현재 페이지 (0: 키워드, 1: 장르)
  const [activePreferencePage, setActivePreferencePage] = useState(0);
  const preferencePagerRef = useRef(null);

  // 연도나 월을 변경하면 자동으로 리포트 재조회하도록
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);

        // 통계랑 취향 섹션 모두 다시 애니메이션 가능하도록 리셋
        setStatsResetKey((k) => k + 1);
        setStatsAnimatedThisFocus(false);
        setPreferenceAnimatedThisFocus(false);

        // 페이지 안 카드 키들도 초기화
        setKeywordAnimateKey((k) => k + 1);
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
  }, [year, month]);

  // 탭 전환으로 이 스크린이 다시 포커스될 때마다
  useEffect(() => {
    if (isFocused) {
      setStatsAnimatedThisFocus(false);
      setPreferenceAnimatedThisFocus(false);

      setStatsResetKey((k) => k + 1);

      // 현재 보고있는 페이지에서 다시 애니메이션 돌릴 수 있게
      setKeywordAnimateKey((k) => k + 1);
      setGenreAnimateKey((k) => k + 1);

      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          y: 0,
          animated: true,
        });
      }
    }
  }, [isFocused]);

  // 통계 섹션 위치 저장
  const handleStatsLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setStatsLayout({ y, height });
  };

  // 취향(페이저) 섹션 위치 저장
  const handlePreferenceLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setPreferenceLayout({ y, height });
  };

  // 특정 섹션이 화면에 50% 이상 보이는지 계산하는 헬퍼
  const isSectionVisible = (section, scrollY, screenHeight) => {
    const sectionTop = section.y;
    const sectionBottom = sectionTop + section.height;
    if (!section.height) return false;

    const scrollTop = scrollY;
    const scrollBottom = scrollY + screenHeight;

    const visibleTop = Math.max(scrollTop, sectionTop);
    const visibleBottom = Math.min(scrollBottom, sectionBottom);
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) return false;

    const visibleRatio = visibleHeight / section.height;
    return visibleRatio >= 0.5;
  };

  // 세로 스크롤할 때 섹션들이 화면에 보이는지 체크
  const handleScroll = (e) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const screenHeight = layoutMeasurement.height;

    // 월별 통계 섹션
    const statsVisible = isSectionVisible(statsLayout, scrollY, screenHeight);
    if (statsVisible && !statsAnimatedThisFocus) {
      setStatsAnimateKey((k) => k + 1);
      setStatsAnimatedThisFocus(true);
    }

    // 취향(페이저) 섹션
    const prefVisible = isSectionVisible(
      preferenceLayout,
      scrollY,
      screenHeight,
    );
    if (prefVisible && !preferenceAnimatedThisFocus) {
      // 현재 활성 페이지 카드만 애니메이션
      if (activePreferencePage === 0) {
        setKeywordAnimateKey((k) => k + 1);
      } else {
        setGenreAnimateKey((k) => k + 1);
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
        setKeywordAnimateKey((k) => k + 1);
      } else {
        setGenreAnimateKey((k) => k + 1);
      }
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator
          size="large"
          color={colors.primary[500]}
        />
      </View>
    );
  }

  const isEmpty = !!data.summary?.isEmpty;

  const personaKey = data.summary?.title.trim().split(/\s+/).pop();
  const map = isCurrentMonth
    ? REPORT_BACKGROUND_MAP
    : REPORT_BACKGROUND_MAP_PAST;

  const bgSource = !isEmpty ? map[personaKey] : null;

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
        <View style={styles.content}>
          <View style={styles.topSpacer} />

          <Summary
            summary={data.summary}
            userName={userName}
            isCurrentMonth={isCurrentMonth}
          />

          {isEmpty ? null : (
            <>
              {/* 월별 통계 섹션 */}
              <View onLayout={handleStatsLayout}>
                <MonthlyStats
                  year={year}
                  month={month}
                  monthlyStatus={data.monthlyStatus}
                  onChangeYear={setYear}
                  onChangeMonth={setMonth}
                  animateKey={statsAnimateKey}
                  resetKey={statsResetKey}
                  onOpenPicker={openPicker}
                  isCurrentMonth={isCurrentMonth}
                />
              </View>

              {/* 취향 분석 스와이프 페이저 섹션 */}
              <View onLayout={handlePreferenceLayout}>
                {/* 섹션 헤더*/}
                {/* 섹션 헤더 */}
                <View style={styles.header}>
                  <View style={styles.titleBlock}>
                    {/* 제목 + 연도 드롭다운 */}
                    <View style={styles.titleRow}>
                      <Text style={styles.sectionTitle}>취향 분석</Text>
                      <TouchableOpacity
                        style={styles.monthButton}
                        onPress={openPicker}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.monthText}>{month}월</Text>
                        <MaterialIcons
                          name="arrow-forward-ios"
                          size={17}
                          color={colors.primary[500]}
                          style={{
                            marginLeft: 4,
                            transform: [{ rotate: "90deg" }],
                          }} // 아래 방향처럼 보이게 회전
                        />
                      </TouchableOpacity>
                    </View>

                    {/* 캡션 */}
                    <Text style={styles.caption}>
                      나의 별점을 기준으로 작성된 표예요
                    </Text>
                  </View>
                </View>

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
                  {/* 페이지 0: 키워드 리뷰 */}
                  <View
                    style={{ width: CARD_WIDTH, marginRight: CARD_SPACING }}
                  >
                    <KeywordReviewCard
                      year={year}
                      month={month}
                      keywords={data.reviewKeywords}
                      animateKey={keywordAnimateKey}
                    />
                  </View>

                  {/* 페이지 1: 최근 선호 장르 도넛 차트 */}
                  <View style={{ width: CARD_WIDTH }}>
                    <GenrePreferenceCard
                      genres={data.genreDistribution}
                      animateKey={genreAnimateKey}
                    />
                  </View>
                </Animated.ScrollView>
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
  },
  content: {
    padding: spacing.l,
  },
  topSpacer: {
    height: 75,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.DEFAULT,
  },

  header: {
    marginBottom: spacing.m,
  },
  titleBlock: {
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  sectionTitle: {
    ...typography["heading-1-medium"],
    color: colors.mono[950],
    fontWeight: "600",
  },
  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  monthText: {
    ...typography["heading-1-medium"],
    color: colors.primary[500],
    fontWeight: "600",
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.primary[500],
  },
  caption: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
  },
});
