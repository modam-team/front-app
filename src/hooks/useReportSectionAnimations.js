import useSectionVisibilityAnimation from "@hooks/useSectionVisibilityAnimation";
import { useCallback, useMemo, useState } from "react";

// 리포트 스크린 전용 섹션 진입 애니메이션 관리 훅
export default function useReportSectionAnimations({ ratio = 0.9 } = {}) {
  // 각 섹션별 스크롤 진입 애니메이션 훅
  const { reset: resetStatsAnim, ...statsAnim } = useSectionVisibilityAnimation(
    { ratio },
  );
  const { reset: resetPrefAnim, ...prefAnim } = useSectionVisibilityAnimation({
    ratio,
  });
  const { reset: resetHabitAnim, ...habitAnim } = useSectionVisibilityAnimation(
    { ratio },
  );

  // 섹션 내부 카드 / 상태 리셋 트리거 (자식 resetKey)
  const [resetKeys, setResetKeys] = useState({
    stats: 0,
    pref: 0,
    habit: 0,
  });

  // 모든 섹션의 resetKey를 1씩 증가시켜서 자식 컴포넌트들이 상태를 초기화하도록 트리거
  const bumpResetKeys = useCallback(() => {
    setResetKeys((prev) => ({
      stats: prev.stats + 1,
      pref: prev.pref + 1,
      habit: prev.habit + 1,
    }));
  }, []);

  // 월 변경/탭 재진입 등 진입 애니메이션을 다시 허용해야 할 때 한 번에 호출
  const resetAll = useCallback(() => {
    bumpResetKeys();
    resetStatsAnim();
    resetPrefAnim();
    resetHabitAnim();
  }, [bumpResetKeys, resetStatsAnim, resetPrefAnim, resetHabitAnim]);

  // ScrollView onScroll에 연결되는 핸들러
  // 세로 스크롤할 때 섹션들이 화면에 보이는지 체크
  const handleScroll = useCallback(
    (e) => {
      const { contentOffset, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const h = layoutMeasurement.height;

      statsAnim.checkAndAnimate(y, h);
      prefAnim.checkAndAnimate(y, h);
      habitAnim.checkAndAnimate(y, h);
    },
    [statsAnim, prefAnim, habitAnim],
  );

  // 스크린에서는 섹션별로 필요한 최소만 노출
  const stats = useMemo(
    () => ({ onLayout: statsAnim.onLayout, animateKey: statsAnim.animateKey }),
    [statsAnim.onLayout, statsAnim.animateKey],
  );

  const pref = useMemo(
    () => ({ onLayout: prefAnim.onLayout, animateKey: prefAnim.animateKey }),
    [prefAnim.onLayout, prefAnim.animateKey],
  );

  const habit = useMemo(
    () => ({ onLayout: habitAnim.onLayout, animateKey: habitAnim.animateKey }),
    [habitAnim.onLayout, habitAnim.animateKey],
  );

  // 리포트 스크린에서 사용할 최종 인터페이스
  return useMemo(
    () => ({
      stats, // 독서 통계 제어용
      pref, // 선호도 분석 통계 제어용
      habit, // 습관 분석 통계 제어용
      resetKeys, // 내부 카드 상태 리셋 트리거
      resetAll, // 리포트 화면을 처음 상태로 되돌리는 함수
      handleScroll, // ScrollView의 onScroll에서 사용
    }),
    [stats, pref, habit, resetKeys, resetAll, handleScroll],
  );
}
