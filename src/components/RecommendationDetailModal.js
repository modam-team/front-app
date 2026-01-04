import BookCover from "@components/BookCover";
import StarIcon from "@components/StarIcon";
import Tag from "@components/Tag";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo, useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const starGray = colors.mono[400];

function Rating({ value = 0, color = starGray, inactiveColor = starGray }) {
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
              size={16}
              color={color}
              emptyColor={inactiveColor}
              variant={isFull ? "full" : isHalf ? "half" : "empty"}
            />
          </View>
        );
      })}
    </View>
  );
}

/**
 * 추천 상세 모달
 * - visible: boolean
 * - book: recoDetail 객체
 * - onClose: () => void
 */
function RecommendationDetailModal({ visible, book, onClose }) {
  // 키워드 3개
  const detailTags = useMemo(() => {
    if (!book) return [];

    if (Array.isArray(book.topKeywords)) {
      return book.topKeywords
        .filter((x) => typeof x === "string" && x.trim())
        .slice(0, 3);
    }

    let keywords = [];

    if (Array.isArray(book.reviews)) {
      book.reviews.forEach((r) => {
        if (Array.isArray(r.keywords)) keywords.push(...r.keywords);
      });
    }

    if (Array.isArray(book.reviewKeywords)) keywords = book.reviewKeywords;

    const cleaned = (keywords || [])
      .filter((k) => typeof k === "string")
      .map((k) => k.trim())
      .filter(Boolean);

    if (cleaned.length === 0) return [];

    const countMap = {};
    cleaned.forEach((k) => (countMap[k] = (countMap[k] || 0) + 1));

    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }, [book]);

  // 실제 리뷰 최대 3개 (테스트용 더미도 fallback)
  const topReviews = useMemo(() => {
    if (!book) return [];

    const raw = Array.isArray(book.reviews) ? book.reviews : [];
    const normalized = raw
      .map((r, idx) => ({
        id: r.id ?? `${idx}`,
        nickname: r.nickname ?? r.user?.nickname ?? "닉네임",
        avatar: r.avatar ?? r.user?.avatarUrl ?? r.profileImageUrl ?? null,
        content: r.content ?? r.comment ?? r.userComment ?? "",
      }))
      .filter(
        (r) => typeof r.content === "string" && r.content.trim().length > 0,
      )
      .slice(0, 3);

    return normalized;
  }, [book]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* 상단: 왼쪽 커버 / 오른쪽 메타 */}
              <View style={styles.topRow}>
                <BookCover
                  uri={book?.cover}
                  title={book?.title}
                  width={120}
                  height={177}
                  radius={7}
                  backgroundColor={colors.mono[150]}
                  textColor={colors.mono[950]}
                  fallbackFontSize={18}
                  containerStyle={styles.cover}
                />

                {/* 오른쪽: 표지와 높이 같은 래퍼 */}
                <View style={styles.metaWrapper}>
                  {/* headerRow */}
                  <View style={styles.headerRow}>
                    {!!book?.categoryName && (
                      <Tag
                        label={book.categoryName}
                        variant="round"
                        size="medium"
                      />
                    )}

                    <Pressable
                      hitSlop={8}
                      onPress={onClose}
                      style={styles.closeBtn}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.mono[950]}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.infoBlock}>
                    {/* 제목/저자 */}
                    <View style={styles.metaTop}>
                      <Text
                        style={styles.title}
                        numberOfLines={2}
                      >
                        {book?.title}
                      </Text>

                      <Text
                        style={styles.author}
                        numberOfLines={2}
                      >
                        {`${book?.author || ""}${book?.publisher ? ` / ${book.publisher}` : ""}`}
                      </Text>
                    </View>
                    {/* 별점 */}
                    <View style={styles.ratingLine}>
                      <Rating value={book?.rate || 0} />
                      <Text style={styles.reviewCount}>
                        ({book?.totalReview || 0})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 키워드(태그): 상단 덩어리 아래 */}
              {detailTags.length > 0 && (
                <View style={styles.tagRow}>
                  {detailTags.map((tag, idx) => (
                    <Tag
                      key={`${tag}-${idx}`}
                      label={tag}
                      size="small"
                      variant="square"
                    />
                  ))}
                </View>
              )}

              {/* 리뷰 리스트: 키워드 아래 / 최대 3개 */}
              <View style={styles.reviewList}>
                {topReviews.map((r) => (
                  <View
                    key={r.id}
                    style={styles.reviewCard}
                  >
                    <View style={styles.reviewItem}>
                      {r.avatar ? (
                        <Image
                          source={{ uri: r.avatar }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder} />
                      )}

                      <View style={styles.reviewTextBox}>
                        <Text style={styles.reviewNickname}>{r.nickname}</Text>
                        <Text
                          style={styles.reviewContent}
                          numberOfLines={2}
                        >
                          {r.content}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
const styles = StyleSheet.create({
  // 딤 처리된 배경
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // 모달 카드(전체 컨테이너)
  card: {
    width: "100%",
    backgroundColor: colors.background.DEFAULT,
    borderRadius: 16,
    padding: spacing.m,
  },

  // 상단 영역: 표지(왼쪽) + 메타(오른쪽)
  topRow: {
    flexDirection: "row",
    gap: spacing.m,
    alignItems: "stretch",
    minWidth: 0, // row 내부 텍스트가 부모 폭을 넘기지 않도록
  },

  // BookCover 컨테이너(정렬용)
  cover: {
    alignItems: "center",
    justifyContent: "center",
  },

  // 오른쪽 메타 래퍼(표지와 동일 높이로 고정)
  metaWrapper: {
    flex: 1,
    height: 177,
    justifyContent: "space-between",
    minWidth: 0, // 텍스트가 옆으로 삐져나가는 문제 방지
  },

  // 카테고리 칩 + 닫기 버튼 한 줄
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  // 닫기 버튼 영역(터치 영역 확보)
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  infoBlock: {
    gap: spacing.m, // 제목/저자 블록과 별점 사이 간격
    minWidth: 0, // 텍스트 튀어나옴 방지
  },

  // 제목/저자 블록(간격)
  metaTop: {
    minWidth: 0, // title/author 줄바꿈 안정화
  },

  // 책 제목
  title: {
    ...typography["heading-1-bold"],
    color: colors.primary[600],
  },

  // 저자 / 출판사
  author: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary[600],
  },

  // 별점 라인(별점 + 리뷰 수)
  ratingLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  // 별 아이콘 가로 정렬
  ratingRow: {
    flexDirection: "row",
  },

  // 별 하나 폭 고정(아이콘 정렬 이쁘게)
  starBox: {
    width: 20,
    alignItems: "center",
  },

  // (리뷰 수) 텍스트
  reviewCount: {
    ...typography["body-2-regular"],
    color: colors.mono[400],
  },

  // 키워드 태그 영역(상단 덩어리 아래)
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
    marginTop: 12,
  },

  // 리뷰 리스트 컨테이너(카드들만 세로로 쌓는 영역)
  reviewList: {
    marginTop: spacing.l,
    gap: spacing.s,
  },

  // 리뷰 1개 카드(흰 배경)
  reviewCard: {
    backgroundColor: colors.mono[0],
    borderRadius: 16,
    padding: spacing.s,
  },

  // 리뷰 한 줄(아바타 + 텍스트)
  reviewItem: {
    flexDirection: "row",
    gap: spacing.m,
    alignItems: "flex-start",
  },

  // 아바타 없을 때 placeholder
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.mono[150],
  },

  // 아바타 이미지
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 999,
  },

  // 리뷰 텍스트 영역(닉네임 + 내용)
  reviewTextBox: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0, // 리뷰 텍스트도 줄바꿈 안정화
  },

  // 리뷰 작성자 닉네임
  reviewNickname: {
    ...typography["detail-bold"],
    color: colors.mono[950],
  },

  // 리뷰 내용
  reviewContent: {
    ...typography["detail-regular"],
    color: colors.mono[950],
  },
});

export default memo(RecommendationDetailModal);
