import { colors } from "@theme/colors";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  UIManager,
  LayoutAnimation,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Defs, ClipPath, Rect } from "react-native-svg";
import {
  updateBookcaseState,
  createReview,
  fetchBookcase,
} from "@apis/bookcaseApi";

const placeholder = require("../../assets/icon.png");

const StarIcon = ({ size = 28, color = "#426B1F", variant = "full" }) => {
  const width = size;
  const height = size * (31 / 32); // keep original ratio
  const clipId = useMemo(
    () => `starHalf-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const basePath =
    "M10.4436 3.69495C12.0444 -1.23178 19.0144 -1.23178 20.6152 3.69495C21.3311 5.89826 23.3843 7.39 25.701 7.39C30.8813 7.39 33.0351 14.0189 28.8442 17.0638C26.97 18.4255 26.1857 20.8392 26.9016 23.0425C28.5024 27.9692 22.8635 32.0661 18.6726 29.0212C16.7984 27.6595 14.2605 27.6595 12.3862 29.0212C8.19529 32.0661 2.55644 27.9692 4.15723 23.0425C4.87313 20.8392 4.08887 18.4255 2.21463 17.0638C-1.9763 14.0189 0.177549 7.39 5.35782 7.39C7.67451 7.39 9.72772 5.89826 10.4436 3.69495Z";

  return (
    <Svg width={width} height={height} viewBox="0 0 32 31" fill="none">
      <Path d={basePath} fill="#D9D9D9" />
      {variant === "full" && <Path d={basePath} fill={color} />}
      {variant === "half" && (
        <>
          <Defs>
            <ClipPath id={clipId}>
              <Rect x="0" y="0" width={16} height={31} />
            </ClipPath>
          </Defs>
          <Path d={basePath} fill={color} clipPath={`url(#${clipId})`} />
        </>
      )}
    </Svg>
  );
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BookDetailScreen({ navigation, route }) {
  const book = route.params?.book || {};
  const coverUri = book.coverUri || book.cover || null;
  const initialStatus = (book.status || "").toLowerCase() || "before";
  const [status, setStatus] = useState(initialStatus); // 선택된 상태
  const [committedStatus, setCommittedStatus] = useState(initialStatus); // 서버에 반영된 상태
  const [loading, setLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewTagDropdown, setShowReviewTagDropdown] = useState(false);
  const [selectedReviewTag, setSelectedReviewTag] = useState(null);
  const [rating, setRating] = useState(book.userRate || 0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewDone, setReviewDone] = useState(initialStatus === "after");
  const [reviewPosted, setReviewPosted] = useState(initialStatus === "after");
  const [pendingAfter, setPendingAfter] = useState(false);
  const [isNoteBack, setIsNoteBack] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteRating, setNoteRating] = useState(book.userRate || 0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const runFlip = useCallback(
    (toValue) => {
      Animated.spring(flipAnim, {
        toValue,
        useNativeDriver: true,
        friction: 14,
        tension: 40,
        overshootClamping: false,
      }).start(() => setIsNoteBack(toValue === 1));
    },
    [flipAnim],
  );
  useEffect(() => {
    if (status !== "after" && isNoteBack) {
      runFlip(0);
    }
  }, [status, isNoteBack, runFlip]);
  const tagCatalog = {
    "감정 키워드": ["감동적인", "따뜻한", "여운이 남는", "웃긴", "위로가 되는", "희망적인"],
    "경험 키워드": ["스릴 있는", "무거운", "몰입감 있는", "도전적인", "설레는"],
    "문체 키워드": ["간결한", "유머러스한", "시적인", "직설적인", "현대적인"],
  };
  const reviewTagOptions = ["감정 키워드", "경험 키워드", "문체 키워드"];

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const statusOptions = [
    { label: "읽기 전", value: "before" },
    { label: "읽는 중", value: "reading" },
    { label: "완독한", value: "after" },
  ];

  const statusLabel = useMemo(() => {
    return statusOptions.find((o) => o.value === status)?.label || "읽기 전";
  }, [status]);

  const displayTotalReview = useMemo(() => {
    const base = book.totalReview || 0;
    if (committedStatus === "after") {
      // 새로 작성한 리뷰가 아직 목록에 반영되지 않았다면 +1
      if (reviewDone && !reviewPosted) return base + 1;
    }
    return base;
  }, [book.totalReview, committedStatus, reviewDone, reviewPosted]);

  const toggleTag = (tag) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      if (exists) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  };

  const submit = async () => {
    if (!book.id) {
      navigation.goBack();
      return;
    }
    if (status === "after" && !reviewDone) {
      setShowReviewModal(true);
      setPendingAfter(true);
      return;
    }
    try {
      setLoading(true);
      let reviewCreated = false;
      // 1) 먼저 상태를 서버에 반영
      const updateRes = await updateBookcaseState(book.id, status.toUpperCase());

      // 1-1) 서버에서 실제 반영된 상태를 재확인 (완독 상태가 아니면 리뷰 생성 중단)
      let isAfterOnServer = false;
      let serverState =
        updateRes?.state?.toLowerCase?.() || updateRes?.status?.toLowerCase?.();
      if (status === "after") {
        if (!serverState) {
          const latest = await fetchBookcase();
          const found =
            latest?.after?.find?.((b) => b.bookId === book.id) ||
            latest?.after?.find?.((b) => b.id === book.id);
          serverState = found ? "after" : null;
        }
        isAfterOnServer = (serverState || "").toLowerCase() === "after";
        if (!isAfterOnServer) {
          Alert.alert(
            "완독 상태 반영 실패",
            "서버에 완독 상태가 반영되지 않아 리뷰를 저장할 수 없습니다. 다시 시도해 주세요.",
          );
          setLoading(false);
          return;
        }
      } else {
        isAfterOnServer = (serverState || status).toLowerCase() === "after";
      }

      // 2) 리뷰 생성 (완독 + 리뷰 완료 시, 서버 상태 AFTER 일 때만)
      if (isAfterOnServer && reviewDone && !reviewPosted) {
        try {
          await createReview({
            bookId: book.id,
            rating,
            hashtag: selectedTags,
            comment: noteText || "",
          });
          setReviewPosted(true);
          reviewCreated = true;
        } catch (e) {
          console.error("리뷰 작성 실패:", e.response?.data || e.message);
          const msg =
            e.response?.data?.error?.message ||
            e.response?.data?.message ||
            "리뷰 저장에 실패했습니다. 네트워크 연결 또는 상태(완독) 여부를 확인해주세요.";
          Alert.alert("리뷰 저장 실패", msg);
          throw e;
        }
      }

      const updatedBook = {
        ...book,
        status,
        userRate: isAfterOnServer ? rating : book.userRate,
        totalReview:
          isAfterOnServer
            ? (book.totalReview || 0) + (reviewCreated ? 1 : 0)
            : book.totalReview || 0,
      };

      setCommittedStatus(isAfterOnServer ? "after" : status);
      navigation.navigate("Root", {
        screen: "책장",
        params: {
          refreshKey: Date.now(),
          focusTab: status,
          updatedBook,
        },
      });
    } catch (e) {
      console.error(
        "책 상태 변경/리뷰 저장 실패:",
        e.response?.status,
        e.response?.data || e.message,
      );
      const msg =
        e.response?.data?.error?.message ||
        e.response?.data?.message ||
        "변경 사항 저장에 실패했습니다.";
      Alert.alert("저장 실패", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (isNoteBack) {
              runFlip(0);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.flipContainer}>
          <Animated.View
            style={[
              styles.card,
              {
                backfaceVisibility: "hidden",
                transform: [
                  {
                    rotateY: flipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.coverWrap}>
              <Image
                source={coverUri ? { uri: coverUri } : placeholder}
                style={styles.cover}
                resizeMode="cover"
              />
            </View>

            <View style={styles.info}>
              <View style={styles.topRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{book.categoryName || "기타"}</Text>
                </View>
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    style={styles.statusPill}
                    onPress={() => setShowStatusMenu((v) => !v)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.statusText}>{statusLabel}</Text>
                    <Ionicons name="chevron-down-outline" size={14} color="#333" />
                  </TouchableOpacity>
                  {showStatusMenu && (
                    <>
                      <TouchableOpacity
                        style={styles.menuBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowStatusMenu(false)}
                      />
                      <View style={styles.statusMenu}>
                        {statusOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.statusMenuItem,
                              opt.value === status && styles.statusMenuItemActive,
                            ]}
                            onPress={() => {
                              LayoutAnimation.configureNext(
                                LayoutAnimation.Presets.easeInEaseOut,
                              );
                              setShowStatusMenu(false);
                              if (opt.value === "after") {
                                setPendingAfter(true);
                                setReviewDone(false);
                                setShowReviewModal(true);
                              } else {
                                setPendingAfter(false);
                                setReviewDone(false);
                                setStatus(opt.value);
                              }
                            }}
                            activeOpacity={0.9}
                          >
                            <Text
                              style={[
                                styles.statusMenuText,
                                opt.value === status && styles.statusMenuTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.titleWrap}>
                <Text style={styles.title}>{book.title || "제목 없음"}</Text>
                <Text style={styles.author}>
                  {book.author || book.publisher || "작가 미상"}
                </Text>
            </View>

            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const displayRating =
                    committedStatus === "after" ? book.userRate || rating : rating;
                  const full = i;
                  const half = i - 0.5;
                  const isFull = displayRating >= full;
                  const isHalf = !isFull && displayRating >= half;
                  const canRate = committedStatus !== "after";
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (!canRate) return;
                        if (rating === full) setRating(half);
                        else if (rating === half) setRating(full);
                        else setRating(full);
                      }}
                    >
                      <StarIcon
                        size={24}
                        variant={isFull ? "full" : isHalf ? "half" : "empty"}
                      />
                    </TouchableOpacity>
                  );
                })}
                <Text style={styles.voteText}>{displayTotalReview}명</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.backCard,
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backfaceVisibility: "hidden",
                transform: [
                  {
                    rotateY: flipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["180deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={isNoteBack ? "auto" : "none"}
          >
            <View style={styles.noteHeaderRow}>
              <Text style={styles.noteTitle}>나의 독서 노트</Text>
            </View>
            <Text style={styles.noteSubtitle}>
              별점을 수정하고{"\n"}직접 독서 노트를 기록할 수 있어요!
            </Text>

            <View
              style={[
                styles.reviewModalStarsRow,
                { marginTop: 8, justifyContent: "center" },
              ]}
            >
              {[1, 2, 3, 4, 5].map((i) => {
                const full = i;
                const half = i - 0.5;
                const isFull = noteRating >= full;
                const isHalf = !isFull && noteRating >= half;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (noteRating === full) setNoteRating(half);
                      else if (noteRating === half) setNoteRating(full);
                      else setNoteRating(full);
                    }}
                  >
                    <StarIcon
                      size={28}
                      variant={isFull ? "full" : isHalf ? "half" : "empty"}
                      color="#426B1F"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.noteTextareaWrap}>
              <Text style={styles.noteTextareaLabel}>독서록</Text>
              <TextInput
                style={styles.noteTextarea}
                multiline
                textAlignVertical="top"
                placeholder="어떻게 이런 생각을 이렇게 멋진 스토리로 풀어낼 수 있는가..."
                value={noteText}
                onChangeText={setNoteText}
                placeholderTextColor="#888"
              />
            </View>

            {/* 뒤집기 버튼 대신 하단 CTA에서 처리 */}
          </Animated.View>
        </View>

        <View style={styles.footerBtnWrap}>
          {committedStatus === "after" ? (
            <TouchableOpacity
              style={styles.noteBtn}
              activeOpacity={0.9}
              onPress={() => {
                if (isNoteBack) {
                  if (noteText.trim().length === 0) return;
                  runFlip(0);
                } else {
                  runFlip(1);
                }
              }}
              disabled={isNoteBack && noteText.trim().length === 0}
            >
              <Text
                style={[
                  styles.noteBtnText,
                  isNoteBack && noteText.trim().length === 0 && { opacity: 0.5 },
                ]}
              >
                {isNoteBack ? "독서 노트 수정" : "독서 노트 보기"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cta, loading && { opacity: 0.7 }]}
              activeOpacity={0.9}
              onPress={submit}
              disabled={loading}
            >
              <Text style={styles.ctaText}>{loading ? "저장 중..." : "수정 완료"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 리뷰 작성 모달 (완독한 선택 시) */}
      <Modal visible={showReviewModal} animationType="fade" transparent>
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewModalCard}>
            <View style={styles.reviewModalHeader}>
              <TouchableOpacity
                style={styles.reviewModalBack}
                activeOpacity={0.85}
                onPress={() => {
                  setShowReviewModal(false);
                  setPendingAfter(false);
                }}
              >
                <Ionicons name="chevron-back" size={22} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.reviewModalContent}>
              <Text style={styles.reviewModalTitle}>리뷰 작성</Text>
              <Text style={styles.reviewModalSubtitle}>
                완독한 책의 별점을 남기고{"\n"}해시태그를 작성해주세요
              </Text>

              <View style={styles.reviewModalStarsRow}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const full = i;
                  const half = i - 0.5;
                  const isFull = rating >= full;
                  const isHalf = !isFull && rating >= half;

                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.9}
                      onPress={() => {
                        // 한번 누르면 해당 별까지, 같은 별을 다시 누르면 0.5로 전환
                        if (rating === full) {
                          setRating(half);
                        } else if (rating === half) {
                          setRating(full);
                        } else {
                          setRating(full);
                        }
                      }}
                    >
                      <StarIcon
                        size={28}
                        variant={isFull ? "full" : isHalf ? "half" : "empty"}
                        color="#426B1F"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

            <View style={styles.reviewModalTags}>
              <Text style={styles.reviewModalTagTitle}>태그 선택</Text>
              <TouchableOpacity
                style={styles.reviewModalDropdown}
                activeOpacity={0.9}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowReviewTagDropdown((v) => !v);
                }}
              >
                <Text style={styles.reviewModalDropdownText}>
                  {selectedReviewTag || "키워드 카테고리"}
                </Text>
                <Ionicons
                  name={showReviewTagDropdown ? "chevron-up-outline" : "chevron-down-outline"}
                  size={20}
                  color="#191919"
                />
              </TouchableOpacity>
              {showReviewTagDropdown && (
                <View style={styles.reviewModalTagList}>
                  {reviewTagOptions.map((o) => (
                    <TouchableOpacity
                      key={o}
                      style={styles.reviewModalTagLine}
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut,
                        );
                        setSelectedReviewTag(o);
                        setShowReviewTagDropdown(false);
                        setSelectedTags([]);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.reviewModalTagLineText}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedReviewTag && (
                <View style={styles.reviewModalChipWrap}>
                  {(tagCatalog[selectedReviewTag] || []).map((tag) => {
                    const active = selectedTags.includes(tag);
                    const disabled = !active && selectedTags.length >= 3;
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.reviewModalChip,
                          active && styles.reviewModalChipActive,
                          disabled && styles.reviewModalChipDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => !disabled || active ? toggleTag(tag) : null}
                      >
                        <Text
                          style={[
                            styles.reviewModalChipText,
                            active && styles.reviewModalChipTextActive,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            </View>

            <View style={styles.reviewModalCTAWrapper}>
              <TouchableOpacity
                style={styles.reviewModalCTA}
                activeOpacity={0.9}
                onPress={() => {
                setReviewDone(true);
                  setStatus("after");
                  setPendingAfter(false);
                  setShowReviewModal(false);
                }}
              >
                <Text style={styles.reviewModalCTAText}>리뷰 작성 완료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDEDED",
  },
  content: {
    padding: 16,
    paddingBottom: 240,
  },
  card: {
    backgroundColor: "#F6F6F6",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    gap: 12,
    width: "100%",
    height: 560,
  },
  backCard: {
    alignItems: "stretch",
    padding: 16,
    height: 560,
  },
  flipContainer: {
    width: "100%",
    alignItems: "center",
    perspective: 1000,
    height: 560,
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coverWrap: {
    width: 264,
    height: 390,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  info: {
    width: "100%",
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#888",
    backgroundColor: "#FFF",
  },
  tagText: { fontSize: 12, color: "#888" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#B9D4A3",
  },
  statusText: { fontSize: 12, color: "#333" },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  statusMenu: {
    position: "absolute",
    bottom: 40,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  statusMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusMenuItemActive: {
    backgroundColor: "#F1F6EC",
  },
  statusMenuText: { fontSize: 14, color: "#333" },
  statusMenuTextActive: { fontWeight: "700", color: "#426B1F" },
  titleWrap: { gap: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#000" },
  author: { fontSize: 12, color: "#888" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  voteText: { fontSize: 12, color: "#C6C6C6", marginLeft: 6 },
  cta: {
    marginTop: 0,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  noteBtn: {
    marginTop: 0,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  noteBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  footerBtnWrap: {
    width: "100%",
    marginTop: 90,
    marginBottom: 70,
  },
  reviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  reviewModalCard: {
    width: "100%",
    maxWidth: 360,
    height: 550,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#B1B1B1",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    alignItems: "center",
    gap: 16,
  },
  reviewModalHeader: {
    width: "100%",
    alignItems: "flex-start",
  },
  reviewModalBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewModalContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 4,
  },
  reviewModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  reviewModalSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  reviewModalStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewModalCTAWrapper: {
    width: "100%",
    marginTop: "auto",
  },
  reviewModalCTA: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewModalCTAText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  noteSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  noteBookCard: {
    width: "100%",
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 10,
  },
  noteCoverWrap: {
    width: 104,
    height: 156,
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
    backgroundColor: "#E0E0E0",
  },
  noteMeta: {
    gap: 6,
  },
  noteBookTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  noteBookAuthor: {
    fontSize: 12,
    color: "#666",
  },
  noteTextareaWrap: {
    width: "100%",
    gap: 6,
  },
  noteTextareaLabel: {
    fontSize: 14,
    color: "#888",
  },
  noteTextarea: {
    minHeight: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B1B1B1",
    padding: 12,
    backgroundColor: "#FFF",
    fontSize: 14,
    color: "#000",
  },
  reviewModalTags: {
    width: "100%",
    gap: 10,
  },
  reviewModalTagTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  reviewModalDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7E9F61",
    backgroundColor: "#FAFAF5",
  },
  reviewModalDropdownText: { fontSize: 15, color: "#333", flex: 1 },
  reviewModalTagList: {
    borderWidth: 1,
    borderColor: "#C6C6C6",
    borderRadius: 10,
    overflow: "hidden",
  },
  reviewModalTagLine: {
    height: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: "#B1B1B1",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  reviewModalTagLineText: { fontSize: 14, color: "#333" },
  reviewModalChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  reviewModalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F1F6EC",
    borderWidth: 1,
    borderColor: "#7E9F61",
  },
  reviewModalChipActive: {
    backgroundColor: "#426B1F",
    borderColor: "#426B1F",
  },
  reviewModalChipDisabled: {
    opacity: 0.4,
  },
  reviewModalChipText: { fontSize: 14, color: "#426B1F" },
  reviewModalChipTextActive: { color: "#FFF", fontWeight: "700" },
});
