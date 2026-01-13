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
  const handleLayout = useCallback((e) => {
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

      // 아직 화면에 보이지 않으면 무시
      if (!isVisible(scrollY, screenHeight)) return false;

      // animateKey 변경으로 자식 애니메이션이 새로 시작되도록 함
      setAnimateKey((k) => k + 1);

      // 1번만 실행되도록 마킹
      setHasAnimated(true);

      return true;
    },
    [hasAnimated, isVisible],
  );

  // 같은 화면에서 다시 애니메이션을 허용해야 할 때 사용 (장르 <-> 키워드 카드 변환 / 시간 <-> 장소 카드 변환)
  const reset = useCallback(() => {
    setHasAnimated(false);
  }, []);

  // 스크린에서 사용할 훅의 공개 인터페이스
  return useMemo(
    () => ({
      onLayout: handleLayout, // 섹션이 화면에 배치된 후 위치/크기를 한 번만 측정하기 위한 핸들러
      animateKey, // 애니메이션을 다시 시작시키기 위한 트리거 값 (값이 변경되면 자식 컴포넌트에서 진입 애니메이션을 재생함)
      reset, // 같은 화면 내에서 애니메이션을 다시 허용해야 할 때 상태를 초기화함
      checkAndAnimate, // 스크롤 위치와 화면 높이를 기반으로 섹션 가시성을 판단하고 애니메이션 실행 여부를 결정함
    }),
    [handleLayout, animateKey, reset, checkAndAnimate],
  );
}
