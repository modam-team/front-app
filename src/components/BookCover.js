import { colors } from "@theme/colors";
import React, { memo, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

/**
 * 책 제목이 없거나 표지가 없을 때
 * 대체로 보여줄 텍스트를 만들어주는 함수
 * - 제목이 있으면 앞 2글자
 * - 없으면 기본값으로 "책"
 */
function pickFallbackText(title) {
  const t = (title || "").trim();
  if (!t) return "책";
  return t.slice(0, 2);
}

// 책 표지 이미지를 보여주는 컴포넌트
function BookCover({
  uri, // 표지 이미지 URL
  title, // 책 제목 (fallback 텍스트용)
  width, // 커버 너비
  height, // 커버 높이
  radius = 0, // 테두리 라운드 값
  backgroundColor = colors.mono[150], // 이미지 없을 때 배경색
  textColor = colors.mono[950], // fallback 텍스트 색상
  containerStyle, // 외부에서 추가로 주고 싶은 컨테이너 스타일
  imageStyle, // 이미지에만 적용할 추가 스타일
  fallbackFontSize = 18, // fallback 텍스트 크기
}) {
  // 제목이 바뀔 때만 fallback 텍스트 다시 계산
  const fallback = useMemo(() => pickFallbackText(title), [title]);

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius: radius, backgroundColor },
        containerStyle,
      ]}
    >
      {/* 표지 이미지가 있으면 이미지 렌더 */}
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { borderRadius: Math.max(0, radius - 2) },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      ) : (
        // 표지 이미지가 없을 때 fallback 텍스트
        <Text
          style={[
            styles.fallbackText,
            { color: textColor, fontSize: fallbackFontSize },
          ]}
        >
          {fallback}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 공통 컨테이너
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // 실제 이미지 스타일
  image: {
    width: "100%",
    height: "100%",
  },

  // fallback 텍스트 기본 스타일
  fallbackText: {
    fontWeight: "700",
  },
});

// memo로 감싸서 동일한 props일 경우 불필요한 리렌더 방지
export default memo(BookCover);
