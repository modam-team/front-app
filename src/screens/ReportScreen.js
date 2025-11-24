import { fetchMonthlyReport } from "@apis/reportApi";
import MonthlyStats from "@components/report/MonthlyStats";
import Summary from "@components/report/Summary";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { shadow } from "@theme/shadow";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ReportScreen() {
  // 현재 날짜 기준 기본 연도랑 월 설정
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 일단 임시 더미 데이터에서 받아온 리포트 데이터
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 이 스크린이 현재 포커스(탭 선택) 상태인지
  const isFocused = useIsFocused();

  const scrollRef = useRef(null);

  // 통계 섹션 레이아웃 정보 (스크롤에서 보이는지 계산용)
  const [statsLayout, setStatsLayout] = useState({ y: 0, height: 0 });

  // 애니메이션 트리거 키
  const [statsAnimateKey, setStatsAnimateKey] = useState(0);

  // 그래프 리셋용 키
  const [statsResetKey, setStatsResetKey] = useState(0);

  // 이번 포커스 사이클에서 이미 애니메이션 돌렸는지 플래그
  const [animatedThisFocus, setAnimatedThisFocus] = useState(false);

  // 연도나 월을 변경하면 자동으로 리포트 재조회하도록
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);
      } catch (e) {
        // 에러 UI 나중에 추가할 거면 여기다가 추가하기 !!
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  // 탭 전환으로 이 스크린이 다시 포커스될 때마다
  useEffect(() => {
    if (isFocused) {
      // 새로 포커스된 상태에서는 아직 애니메이션 안 돌린 걸로 리셋
      setAnimatedThisFocus(false);

      // 그래프를 0으로 초기화
      setStatsResetKey((k) => k + 1);

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

  // 스크롤할 때 통계 섹션이 화면에 보이는지 체크
  const handleScroll = (e) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const screenHeight = layoutMeasurement.height;

    const sectionTop = statsLayout.y;
    const sectionBottom = sectionTop + statsLayout.height;

    if (!statsLayout.height) return; // 아직 레이아웃 정보 없으면 패스

    const scrollTop = scrollY;
    const scrollBottom = scrollY + screenHeight;

    // 화면 영역과 섹션 영역의 겹치는 부분 계산
    const visibleTop = Math.max(scrollTop, sectionTop);
    const visibleBottom = Math.min(scrollBottom, sectionBottom);
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) return; // 안 보이는 상태

    const visibleRatio = visibleHeight / statsLayout.height; // 0 ~ 1

    // 섹션의 50% 이상이 화면 안에 들어왔을 때만 true
    const visible = visibleRatio >= 0.5;

    // 통계 섹션이 화면에 보이고 이번 포커스 사이클에서 아직 애니메이션 안 돌린 경우
    if (visible && !animatedThisFocus) {
      setStatsAnimateKey((k) => k + 1); // MonthlyStats 애니메이션 트리거
      setAnimatedThisFocus(true); // 이번 포커스에선 다시 안 돌리게 막기
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

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      onScroll={handleScroll} // 스크롤 핸들러 연결
      scrollEventThrottle={16} // 스크롤 이벤트 빈도
    >
      <Summary summary={data.summary} />
      <View onLayout={handleStatsLayout}>
        <MonthlyStats
          year={year}
          month={month}
          monthlyStatus={data.monthlyStatus}
          onChangeYear={setYear}
          onChangeMonth={setMonth}
          animateKey={statsAnimateKey}
          resetKey={statsResetKey}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
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
});
