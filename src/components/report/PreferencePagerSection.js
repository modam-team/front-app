import GenrePreferenceCard from "@components/report/GenrePreferenceCard";
import KeywordReviewCard from "@components/report/KeywordReviewCard";
import ReportSectionHeader from "@components/report/ReportSectionHeader";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, View } from "react-native";

const CARD_WIDTH = 300;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

function isScrollReady(scrollY, screenHeight) {
  return Number.isFinite(scrollY) && Number.isFinite(screenHeight);
}
export default function PreferencePagerSection({
  year,
  month,
  variant, // "current" or "past"
  isCurrentMonth,
  genreDistribution,
  reviewKeywords,
  resetKey, // 리셋 트리거 (연/월 변경, 포커스 변경 등)
  onLayout,
  animateKey,
}) {
  const pagerRef = useRef(null);

  const [activePage, setActivePage] = useState(0);

  // 카드 애니메이션 키 (내부 관리)
  const [genreAnimateKey, setGenreAnimateKey] = useState(0);
  const [keywordAnimateKey, setKeywordAnimateKey] = useState(0);

  const [hasTriggered, setHasTriggered] = useState(false);

  // resetKey 바뀌면 페이저/페이지/노출 트리거 상태 초기화
  useEffect(() => {
    setActivePage(0);

    setGenreAnimateKey((k) => k + 1);
    setKeywordAnimateKey((k) => k + 1);

    pagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [resetKey]);

  // 부모에서 animateKey 올라오면 여기서만 카드 애니메이션 트리거
  useEffect(() => {
    if (animateKey === 0) return;

    setHasTriggered(true);
    if (activePage === 0) setGenreAnimateKey((k) => k + 1);
    else setKeywordAnimateKey((k) => k + 1);
  }, [animateKey, activePage]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const { contentOffset } = e.nativeEvent;
      const pageIndex = Math.round(contentOffset.x / SNAP_INTERVAL);

      if (pageIndex === activePage) return;
      setActivePage(pageIndex);

      if (!hasTriggered) return; // 섹션 노출 전이면 애니메이션 금지
      // 페이지 바뀌면 해당 카드 애니메이션 재시작
      if (pageIndex === 0) setGenreAnimateKey((k) => k + 1);
      else setKeywordAnimateKey((k) => k + 1);
    },
    [activePage, hasTriggered],
  );

  return (
    <View onLayout={onLayout}>
      <ReportSectionHeader
        month={month}
        title="취향 분석"
        caption="나의 별점을 기준으로 작성된 표예요"
        variant={variant}
      />

      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: CARD_SPACING }}
      >
        <View style={{ width: CARD_WIDTH, marginRight: CARD_SPACING }}>
          <GenrePreferenceCard
            genres={genreDistribution}
            animateKey={genreAnimateKey}
            isCurrentMonth={isCurrentMonth}
          />
        </View>

        <View style={{ width: CARD_WIDTH }}>
          <KeywordReviewCard
            year={year}
            month={month}
            keywords={reviewKeywords}
            animateKey={keywordAnimateKey}
            isActive={activePage === 1}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
