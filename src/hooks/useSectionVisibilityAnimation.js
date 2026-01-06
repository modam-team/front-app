import { useCallback, useMemo, useState } from "react";

// 섹션이 화면에 ratio 이상 보이면 animateKey를 올려서 애니메이션을 트리거 해줌
export default function useSectionVisibilityAnimation({ ratio = 0.5 } = {}) {
  // 섹션의 y 위치와 높이
  const [layout, setLayout] = useState({ y: 0, height: 0 });

  // 애니메이션 재시작용 키
  const [animateKey, setAnimateKey] = useState(0);

  // 이미 애니메이션을 실행했는지 여부
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
