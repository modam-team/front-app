import { useCallback, useMemo, useState } from "react";

// 필요한 이유 : 스크롤 기반 섹션 진입 애니메이션을 한 번만 안정적으로 트리거하기 위해
// 역할: 스크롤이 화면에 일정 비율(ratio) 이상 노출되면 animateKey를 증가시켜서 자식 애니메이션을 재생함
export default function useSectionVisibilityAnimation({ ratio = 0.5 } = {}) {
  // 섹션의 화면상 위치 및 크기가 있어야 노출 비율 계산이 가능하므로 layout을 저장함
  const [layout, setLayout] = useState({ y: 0, height: 0 });

  // 리렌더 기반으로 애니메이션을 다시 시작시키기 위한 트리거 키
  const [animateKey, setAnimateKey] = useState(0);

  // 이미 애니메이션을 실행했는지 여부 (스크롤 이벤트가 계속 들어와도 1회만 실행하는 것을 보장하기 위해)
  const [hasAnimated, setHasAnimated] = useState(false);

  // 섹션 레이아웃 측정
  const onLayout = useCallback((e) => {
    const { y, height } = e.nativeEvent.layout;
    setLayout({ y, height });
  }, []);

  // 현재 섹션이 화면에 ratio 이상 보이는지 계산
  const isVisible = useCallback(
    (scrollY, screenHeight) => {
      if (!layout.height) return false;

      const sectionTop = layout.y;
      const sectionBottom = sectionTop + layout.height;

      const scrollTop = scrollY;
      const scrollBottom = scrollY + screenHeight;

      const visibleTop = Math.max(scrollTop, sectionTop);
      const visibleBottom = Math.min(scrollBottom, sectionBottom);
      const visibleHeight = visibleBottom - visibleTop;

      if (visibleHeight <= 0) return false;
      return visibleHeight / layout.height >= ratio;
    },
    [layout, ratio],
  );

  // 스크롤 시 호출해서 조건을 만족하면 애니메이션을 트리거함
  const checkAndAnimate = useCallback(
    (scrollY, screenHeight) => {
      // 이미 실행했으면 무시
      if (hasAnimated) return false;

      if (!isVisible(scrollY, screenHeight)) return false;

      // 애니메이션 재시작
      setAnimateKey((k) => k + 1);

      // 1번만 실행되도록 마킹
      setHasAnimated(true);
      return true;
    },
    [hasAnimated, isVisible],
  );

  // 애니메이션 실행 여부 초기화
  const reset = useCallback(() => {
    setHasAnimated(false);
  }, []);

  // 외부에서 사용할 API
  return useMemo(
    () => ({
      onLayout, // 섹션 View에 연결
      animateKey, // 자식 컴포넌트 애니메이션 트리거용
      reset, // 다시 실행 가능하게 초기화
      checkAndAnimate, // onScroll에서 호출
    }),
    [onLayout, animateKey, reset, checkAndAnimate],
  );
}
