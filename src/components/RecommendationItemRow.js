import BookCover from "@components/BookCover";
import StarIcon from "@components/StarIcon";
import Tag from "@components/Tag";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

function Rating({ value = 0 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.ratingRow}>
      {stars.map((star) => {
        const diff = value - star;
        const isFull = diff >= 0;
        const isHalf = diff >= -0.5 && diff < 0;
        return (
          <View
            key={star}
            style={styles.starBox}
          >
            <StarIcon
              size={20}
              color={colors.mono[300]}
              emptyColor={colors.mono[300]}
              variant={isFull ? "full" : isHalf ? "half" : "empty"}
            />
          </View>
        );
      })}
      {/* 리뷰 수 */}
    </View>
  );
}

/**
 * 추천 책 1개 행(스샷의 리스트 한 줄)
 * - 표지
 * - 제목/저자
 * - 별점(회색) + (리뷰수)
 * - 키워드 칩 최대 3개
 * - 우측 하트
 */
function RecommendationItemRow({
  title,
  authorText,
  rating = 0,
  totalReview = 0,
  cover,
  keywords = [],
  liked = false,
  onPress,
  onToggleHeart,
  heartDisabled = false,
}) {
  const topKeywords = useMemo(() => {
    if (!Array.isArray(keywords)) return [];
    const cleaned = keywords
      .filter((k) => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim());
    return Array.from(new Set(cleaned)).slice(0, 3);
  }, [keywords]);

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
    >
      {/* 표지 */}
      <BookCover
        uri={cover}
        title={title}
        width={84}
        height={113}
        radius={0}
        backgroundColor={colors.mono[100]}
        textColor={colors.mono[950]}
        fallbackFontSize={18}
      />

      {/* 메타 */}
      <View style={styles.meta}>
        <View style={styles.topMeta}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={styles.author}
            numberOfLines={1}
          >
            {authorText}
          </Text>

          <View style={styles.ratingLine}>
            <Rating value={rating} />
            <Text style={styles.reviewCount}>({totalReview})</Text>
          </View>
        </View>

        {/* 키워드 칩 + 하트 */}
        <View style={styles.bottomRow}>
          <View style={styles.chipRow}>
            {topKeywords.map((k, idx) => (
              <Tag
                key={`${k}-${idx}`}
                label={k}
                size="small"
                variant="square"
              />
            ))}
          </View>

          <Pressable
            hitSlop={8}
            onPress={onToggleHeart}
            disabled={heartDisabled}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? colors.primary[400] : colors.mono[400]}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 한 줄짜리 추천 아이템 전체 래퍼
  row: {
    height: 129,
    flexDirection: "row",
    paddingVertical: spacing.s,
    borderRadius: 8,
    backgroundColor: colors.mono[0],
  },

  // 표지 오른쪽 메타 영역 (제목 / 별점 / 키워드)
  meta: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },

  // 제목 + 저자 + 별점 묶음
  topMeta: { gap: spacing.xs },

  // 책 제목
  title: { ...typography["body-2-bold"], color: colors.mono[950] },

  // 저자 / 출판사
  author: { ...typography["detail-2-regular"], color: colors.mono[950] },

  // 별점 + (리뷰 수) 라인
  ratingLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  // 별 아이콘 행
  ratingRow: { flexDirection: "row" },

  // 별 하나의 고정 박스
  starBox: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // 리뷰 개수 텍스트
  reviewCount: { ...typography["body-2-regular"], color: colors.mono[400] },

  // 하단 영역 (키워드 칩 + 하트 버튼)
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // 키워드 칩 한 묶음
  chipRow: { flexDirection: "row", gap: spacing.xs },
});

export default memo(RecommendationItemRow);
