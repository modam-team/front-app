import RecommendationItemRow from "./RecommendationItemRow";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * 홈 추천 섹션 카드 (큰 카드 1개)
 * - 제목/설명/새로고침 버튼
 * - 안에 추천 책 2개 행을 렌더
 */
function RecommendationSectionCard({
  nickname,
  recs = [], // 추천 책 배열 (최대 2개 사용)
  onRefresh,
  onPressItem, // (book) => void
  onToggleHeart, // (book) => void
  isLiked, // (bookId) => boolean
  heartDisabledIds = new Set(), // Set(bookId)
}) {
  const top2 = (Array.isArray(recs) ? recs : []).slice(0, 2);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.header}>
        {/* 제목 + 새로고침 */}
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>
            {nickname}님께 추천하는 책이에요
          </Text>

          <Pressable
            hitSlop={8}
            onPress={onRefresh}
          >
            <Ionicons
              name="refresh"
              size={22}
              color={colors.mono[600]}
            />
          </Pressable>
        </View>

        {/* 캡션 */}
        <Text style={styles.caption}>클릭하면 독서 노트를 볼 수 있어요</Text>
      </View>

      {/* 아이템 2개 */}
      {top2.map((b) => (
        <RecommendationItemRow
          key={b.bookId ?? b.id}
          title={b.title}
          authorText={`${b.author || ""}${b.publisher ? ` / ${b.publisher}` : ""}`}
          rating={Number(b.rate) || 0}
          totalReview={Number(b.totalReview) || 0}
          cover={b.cover}
          keywords={b.topKeywords || b.userHashTag || b.tags || []} // 키워드 Top3를 아직 안 넘겨줘서 .. 일단 이중 하나는 이름 얻어걸리겠지 하구 넣어 봤어요 ..
          liked={isLiked?.(b.bookId ?? b.id)}
          onPress={() => onPressItem?.(b)}
          onToggleHeart={() => onToggleHeart?.(b)}
          heartDisabled={heartDisabledIds.has(b.bookId ?? b.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 전체 래퍼
  sectionCard: {
    backgroundColor: colors.mono[0],
    borderRadius: 16,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    gap: spacing.xs,
  },

  // 헤더 전체 (제목줄 + 캡션줄)
  header: {
    gap: spacing.xs,
  },

  // 제목 + 새로고침 버튼
  titleRow: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // 헤더
  headerTitle: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
  },

  // 캡션
  caption: {
    ...typography["detail-regular"],
    color: colors.mono[950],
  },
});

export default memo(RecommendationSectionCard);
