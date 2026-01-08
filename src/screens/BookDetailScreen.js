import placeholder from "../../assets/icon.png";
import {
  createReview,
  fetchBookcase,
  fetchReview,
  updateBookcaseState,
  updateReview,
} from "@apis/bookcaseApi";
import StarIcon from "@components/StarIcon";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "@theme/colors";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [forceDirty, setForceDirty] = useState(false);
  const [reviewPosted, setReviewPosted] = useState(initialStatus === "after");
  const [reviewBlocked, setReviewBlocked] = useState(false);
  const [pendingAfter, setPendingAfter] = useState(false);
  const [isNoteBack, setIsNoteBack] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteRating, setNoteRating] = useState(book.userRate || 0);
  const NOTE_MAX = 1000;
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [fetchedReview, setFetchedReview] = useState(null);
  const [avgRate, setAvgRate] = useState(book.rate || 0);
  const [totalReviews, setTotalReviews] = useState(book.totalReview || 0);
  const bookKey = book.id || book.bookId;
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

  const loadReview = useCallback(async () => {
    if (!bookKey) return;
    setReviewError(null);
    setReviewLoading(true);
    try {
      const data = await fetchReview(bookKey);
      if (!data) return;
      if (typeof data.rating === "number") {
        setRating(data.rating);
        setNoteRating(data.rating);
        setAvgRate((prev) => (prev > 0 ? prev : data.rating));
      }
      if (Array.isArray(data.hashtag)) {
        setSelectedTags(data.hashtag);
      }
      if (data.comment) {
        setNoteText(data.comment);
      }
      setTotalReviews((prev) =>
        prev > 0 ? prev : data.totalReview || book.totalReview || 1,
      );
      setFetchedReview(data);
      setReviewDone(true);
      setReviewPosted(true);
      setCommittedStatus("after");
    } catch (e) {
      console.error(
        "리뷰 조회 실패:",
        e.response?.status,
        e.response?.data || e.message,
      );
      // 서버에서 review null로 500을 주는 경우 이후 저장 시도도 우회
      setReviewBlocked(true);
      setReviewError(null);
    } finally {
      setReviewLoading(false);
    }
  }, [bookKey]);

  useFocusEffect(
    useCallback(() => {
      loadReview();
    }, [loadReview]),
  );

  const handleNoteSave = useCallback(async () => {
    try {
      // note 카드 별점을 메인 rating에도 반영
      setRating(noteRating);
      await submit({
        ratingOverride: noteRating,
        commentOverride: noteText,
      });
      runFlip(0);
    } catch (e) {
      // submit already alerts on failure
    }
  }, [noteRating, noteText, submit, runFlip]);
  const tagCatalog = {
    "감정 키워드": [
      "감동적인",
      "따뜻한",
      "여운이 남는",
      "위로가 되는",
      "웃긴",
      "스릴 있는",
      "무거운",
      "희망적인",
    ],
    "경험 키워드": [
      "잘 읽히는",
      "어려운",
      "다시 읽고 싶은",
      "집중이 필요한",
      "출퇴근길에 딱",
      "잠들기 전에 딱",
      "생각하게 되는",
      "한 번에 읽은",
    ],
    "문체 키워드": [
      "서정적인",
      "직설적인",
      "속도감 있는 전개",
      "유머러스한",
      "간결한",
      "사실적인",
      "추상적인",
      "비유적인",
    ],
  };
  const allowedTagsSet = useMemo(() => {
    const set = new Set();
    Object.values(tagCatalog).forEach((arr) => {
      (arr || []).forEach((t) => set.add(t));
    });
    return set;
  }, []);
  const canSubmitReviewModal = useMemo(
    () => rating > 0 && (selectedTags?.length || 0) > 0,
    [rating, selectedTags],
  );
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

  // 원본 비교용 스냅샷
  const initialRating = useMemo(() => {
    if (typeof fetchedReview?.rating === "number") return fetchedReview.rating;
    if (typeof book.userRate === "number") return book.userRate;
    if (typeof book.rate === "number") return book.rate;
    return 0;
  }, [fetchedReview?.rating, book.userRate, book.rate]);
  const initialComment = useMemo(
    () => (fetchedReview?.comment || "").trim(),
    [fetchedReview?.comment],
  );
  const initialTags = useMemo(
    () => (Array.isArray(fetchedReview?.hashtag) ? fetchedReview.hashtag : []),
    [fetchedReview?.hashtag],
  );
  const hasChanges = useMemo(() => {
    const tagsChanged =
      initialTags.join(",") !== (selectedTags || []).join(",");
    const commentChanged = (noteText || "").trim() !== initialComment;
    const ratingChanged = noteRating !== initialRating;
    const statusChanged = status !== committedStatus;
    return (
      forceDirty ||
      tagsChanged ||
      commentChanged ||
      ratingChanged ||
      statusChanged
    );
  }, [
    forceDirty,
    initialTags,
    selectedTags,
    noteText,
    initialComment,
    noteRating,
    initialRating,
    status,
    committedStatus,
  ]);

  const averageRating = useMemo(() => {
    if (committedStatus === "after") {
      return (
        avgRate || fetchedReview?.rating || book.userRate || book.rate || rating
      );
    }
    return book.rate || avgRate || book.userRate || rating;
  }, [
    avgRate,
    fetchedReview?.rating,
    book.userRate,
    book.rate,
    rating,
    committedStatus,
  ]);

  const displayTotalReview = useMemo(() => {
    const base = totalReviews || book.totalReview || (fetchedReview ? 1 : 0);
    return base;
  }, [totalReviews, book.totalReview, fetchedReview]);

  const toggleTag = (tag) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      if (exists) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  };

  // 상태를 "완독한"으로 전환하면 즉시 리뷰 모달을 띄워 리뷰를 받는다.
  useEffect(() => {
    if (status === "after" && !reviewDone) {
      setPendingAfter(true);
      setShowReviewModal(true);
    }
  }, [status, reviewDone]);

  const submit = async ({ ratingOverride, commentOverride } = {}) => {
    const bookKey = book.id || book.bookId;
    if (!bookKey) {
      navigation.goBack();
      return;
    }
    if (reviewLoading) return;
    if (showReviewModal) return;
    if (status === "after" && !reviewDone) {
      setShowReviewModal(true);
      setPendingAfter(true);
      return;
    }
    try {
      setLoading(true);
      const sanitizedTags = (selectedTags || []).filter((t) =>
        allowedTagsSet.has(t),
      );
      let reviewCreated = false;
      const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const isTransitionToAfter =
        status === "after" && committedStatus !== "after";
      const patchDates = isTransitionToAfter
        ? { startDate: todayStr, endDate: todayStr }
        : {};

      let updateRes = null;
      const shouldUpdateState = status !== committedStatus;
      if (shouldUpdateState) {
        // 1) 먼저 상태를 서버에 반영 (서버가 전->중->후 순서를 요구할 수 있으므로 중간 상태 보강)
        if (status === "after" && committedStatus === "before") {
          try {
            await updateBookcaseState(bookKey, "READING");
          } catch (e) {
            console.warn(
              "중간 상태(READING) 반영 실패:",
              e.response?.data || e,
            );
          }
        }
        try {
          updateRes = await updateBookcaseState(
            bookKey,
            status.toUpperCase(),
            patchDates,
          );
        } catch (e) {
          // 상태 전환 제한(예: 4091) 시 한 단계씩 재시도
          const code = e.response?.data?.error?.code || e.response?.data?.code;
          if (status === "after" && code === "4091") {
            try {
              await updateBookcaseState(bookKey, "READING");
              updateRes = await updateBookcaseState(
                bookKey,
                "AFTER",
                patchDates,
              );
            } catch (err) {
              console.error("책 상태 재시도 실패", err);
              throw err;
            }
          } else {
            throw e;
          }
        }
      }

      // 1-1) 서버에서 실제 반영된 상태를 재확인 (완독 상태가 아니면 리뷰 생성 중단)
      let isAfterOnServer = false;
      let serverState =
        updateRes?.state?.toLowerCase?.() || updateRes?.status?.toLowerCase?.();
      if (!shouldUpdateState) {
        serverState = committedStatus;
      }
      if (status === "after") {
        if (!serverState) {
          const latest = await fetchBookcase();
          const found =
            latest?.after?.find?.((b) => b.bookId === bookKey) ||
            latest?.after?.find?.((b) => b.id === bookKey);
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
      if (isAfterOnServer && reviewDone && !reviewBlocked) {
        try {
          const trimmedComment = ((commentOverride ?? noteText) || "").trim();
          const finalRating = Number.isFinite(Number(ratingOverride ?? rating))
            ? Number(ratingOverride ?? rating)
            : 0;
          const hasExistingReview =
            !!fetchedReview && fetchedReview.bookId === bookKey;

          let appliedRating = finalRating;
          if (hasExistingReview) {
            // 서버 스펙: PATCH는 comment만, 별점/태그 수정 불가
            try {
              await updateReview({
                bookId: bookKey,
                comment: trimmedComment,
              });
              appliedRating =
                fetchedReview?.rating ||
                book.userRate ||
                book.rate ||
                finalRating;
              reviewCreated = false;
            } catch (err) {
              const status = err.response?.status;
              const msgText =
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message;
              if (status === 500 && /review/i.test(msgText || "")) {
                await createReview({
                  bookId: bookKey,
                  rating: finalRating,
                  hashtag: sanitizedTags,
                  comment: trimmedComment,
                });
                appliedRating = finalRating;
                reviewCreated = true;
              } else {
                throw err;
              }
            }
          } else {
            // 리뷰 생성(첫 작성)으로 별점/태그/코멘트 저장
            try {
              await createReview({
                bookId: bookKey,
                rating: finalRating,
                hashtag: sanitizedTags,
                comment: trimmedComment,
              });
              reviewCreated = true;
            } catch (err) {
              const status = err.response?.status;
              const code =
                err.response?.data?.error?.code || err.response?.data?.code;
              const msgText =
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message;
              if (code === "4039") {
                await createReview({
                  bookId: bookKey,
                  rating: finalRating,
                  hashtag: [],
                  comment: trimmedComment,
                });
                reviewCreated = true;
                setSelectedTags([]);
              } else if (
                status === 409 ||
                code === "409" ||
                code === "4093" ||
                (msgText && /already.*review/i.test(msgText))
              ) {
                // 이미 리뷰가 있으면 코멘트만 패치
                await updateReview({
                  bookId: bookKey,
                  comment: trimmedComment,
                });
                appliedRating =
                  fetchedReview?.rating ||
                  book.userRate ||
                  book.rate ||
                  finalRating;
                reviewCreated = false;
              } else {
                throw err;
              }
            }
          }
          setFetchedReview({
            bookId: bookKey,
            rating: appliedRating,
            hashtag: sanitizedTags,
            comment: trimmedComment,
          });
          setReviewPosted(true);
          // 평균/리뷰 수 갱신 (클라이언트 추정)
          const prevTotal = totalReviews || book.totalReview || 0;
          const prevAvg = avgRate || book.rate || 0;
          const prevUserRating =
            typeof fetchedReview?.rating === "number"
              ? fetchedReview.rating
              : appliedRating;
          let nextTotal = prevTotal;
          let nextAvg = prevAvg;
          if (reviewCreated) {
            nextTotal = prevTotal + 1;
            nextAvg =
              nextTotal > 0
                ? (prevAvg * prevTotal + appliedRating) / nextTotal
                : appliedRating;
          } else if (prevTotal > 0) {
            nextAvg =
              (prevAvg * prevTotal - prevUserRating + appliedRating) /
              prevTotal;
          }
          setTotalReviews(nextTotal);
          setAvgRate(nextAvg);
          // 서버에 반영된 내용을 다시 불러와 동기화
          await loadReview();
        } catch (e) {
          console.error("리뷰 작성 실패:", e.response?.data || e.message);
          const status = e.response?.status;
          const code = e.response?.data?.error?.code || e.response?.data?.code;
          const msgText =
            e.response?.data?.error?.message ||
            e.response?.data?.message ||
            e.message;
          if (
            status === 409 ||
            code === "409" ||
            code === "4093" ||
            (msgText && /already.*review/i.test(msgText))
          ) {
            // 중복이면 코멘트만 패치 스펙을 안내
            Alert.alert("리뷰 저장 실패", "이미 등록한 리뷰가 있습니다.");
            await loadReview();
            setLoading(false);
            return;
          }
          // 서버에서 review null로 500을 내려주는 경우: 리뷰 저장을 건너뛰고 상태만 반영
          setReviewBlocked(true);
          console.warn("리뷰 저장 건너뜀(서버 오류)");
        }
      }

      const updatedBook = {
        ...book,
        status,
        userRate: isAfterOnServer
          ? Number(ratingOverride ?? rating)
          : book.userRate,
        rate: isAfterOnServer ? avgRate || book.rate || 0 : book.rate,
        totalReview: isAfterOnServer
          ? totalReviews || book.totalReview || 0
          : book.totalReview || 0,
        finishedAt: isAfterOnServer
          ? book.finishedAt || book.finishedAtTime || book.endDate || todayStr
          : book.finishedAt,
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
          <Ionicons
            name="chevron-back"
            size={24}
            color="#000"
          />
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
                  <Text style={styles.tagText}>
                    {book.categoryName || "기타"}
                  </Text>
                </View>
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    style={styles.statusPill}
                    onPress={() => setShowStatusMenu((v) => !v)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.statusText}>{statusLabel}</Text>
                    <Ionicons
                      name="chevron-down-outline"
                      size={14}
                      color="#333"
                    />
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
                              opt.value === status &&
                                styles.statusMenuItemActive,
                            ]}
                            onPress={() => {
                              LayoutAnimation.configureNext(
                                LayoutAnimation.Presets.easeInEaseOut,
                              );
                              setShowStatusMenu(false);
                              if (opt.value === "after") {
                                setStatus("after");
                                setPendingAfter(true);
                                setReviewDone(false);
                                setShowReviewModal(true);
                                setForceDirty(true);
                              } else {
                                setStatus(opt.value);
                                setPendingAfter(false);
                                setReviewDone(false);
                                setForceDirty(true);
                              }
                            }}
                            activeOpacity={0.9}
                          >
                            <Text
                              style={[
                                styles.statusMenuText,
                                opt.value === status &&
                                  styles.statusMenuTextActive,
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
                <Text
                  style={styles.title}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {book.title || "제목 없음"}
                </Text>
                <View style={styles.titleSpacer} />
                <Text
                  style={styles.author}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {book.author || book.publisher || "작가 미상"}
                </Text>
              </View>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const full = i;
                  const half = i - 0.5;
                  const isFull = averageRating >= full;
                  const isHalf = !isFull && averageRating >= half;
                  const canRate = false;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (!canRate) return;
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
              <View style={styles.starsRowSpacer} />
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
            {selectedTags.length > 0 && (
              <View style={styles.noteTagRow}>
                {selectedTags.slice(0, 3).map((tag) => (
                  <View
                    key={tag}
                    style={styles.noteTagChip}
                  >
                    <Text style={styles.noteTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

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
                      if (noteRating === full) {
                        setNoteRating(half);
                        setRating(half);
                      } else if (noteRating === half) {
                        setNoteRating(full);
                        setRating(full);
                      } else {
                        setNoteRating(full);
                        setRating(full);
                      }
                    }}
                  >
                    <StarIcon
                      size={60}
                      variant={isFull ? "full" : isHalf ? "half" : "empty"}
                      color="#426B1F"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.noteTextareaWrap}>
              <View style={styles.noteHeaderRow}>
                <Text style={styles.noteTextareaLabel}>독서록</Text>
                <Text style={styles.noteCount}>{`${Math.min(
                  NOTE_MAX,
                  noteText.length,
                )}/${NOTE_MAX}`}</Text>
              </View>
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
                  handleNoteSave();
                } else {
                  runFlip(1);
                }
              }}
            >
              <Text style={[styles.noteBtnText]}>
                {isNoteBack ? "독서 노트 수정" : "독서 노트 보기"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cta, (loading || !hasChanges) && { opacity: 0.5 }]}
              activeOpacity={0.9}
              onPress={submit}
              disabled={loading || !hasChanges}
            >
              <Text style={styles.ctaText}>
                {loading ? "저장 중..." : "수정 완료"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 리뷰 작성 모달 (완독한 선택 시) */}
      <Modal
        visible={showReviewModal}
        animationType="fade"
        transparent
      >
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
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.reviewModalContent}>
              <Text style={styles.reviewModalTitle}>리뷰 작성</Text>
              <Text style={styles.reviewModalSubtitle}>
                완독한 책의 별점을 남기고{"\n"}해시태그를 작성해주세요
                {reviewLoading ? " (리뷰 불러오는 중...)" : ""}
              </Text>
              {reviewError && (
                <Text
                  style={[styles.reviewModalSubtitle, { color: "#D0312D" }]}
                >
                  {reviewError}
                </Text>
              )}

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
                        size={44}
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
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    );
                    setShowReviewTagDropdown((v) => !v);
                  }}
                >
                  <Text style={styles.reviewModalDropdownText}>
                    {selectedReviewTag || "키워드 카테고리"}
                  </Text>
                  <Ionicons
                    name={
                      showReviewTagDropdown
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
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
                        }}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.reviewModalTagLineText}>{o}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedReviewTag && !showReviewTagDropdown && (
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
                          onPress={() =>
                            !disabled || active ? toggleTag(tag) : null
                          }
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
                style={[
                  styles.reviewModalCTA,
                  !canSubmitReviewModal && styles.reviewModalCTADisabled,
                ]}
                activeOpacity={0.9}
                disabled={!canSubmitReviewModal}
                onPress={async () => {
                  if (!canSubmitReviewModal) return;
                  setReviewDone(true);
                  setStatus("after");
                  setPendingAfter(false);
                  setShowReviewModal(false);
                  // 상태 반영 + 리뷰 저장까지 바로 진행
                  setTimeout(() => {
                    submit();
                  }, 0);
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
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    gap: 12,
    width: "100%",
    minHeight: 590,
  },
  backCard: {
    alignItems: "stretch",
    padding: 16,
    minHeight: 590,
  },
  flipContainer: {
    width: "100%",
    alignItems: "center",
    perspective: 1000,
    minHeight: 590,
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
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
    gap: 14,
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
  titleWrap: {
    gap: 4,
    width: "100%",
    flexWrap: "wrap",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 24,
    width: "100%",
  },
  author: {
    fontSize: 12,
    color: "#888",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 16,
    width: "100%",
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  starsRowSpacer: { height: 8 },
  voteText: { fontSize: 12, color: "#C6C6C6", marginLeft: 6 },
  // spacing fix when title wraps
  titleSpacer: { height: 4 },
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
    marginTop: 36,
    marginBottom: 24,
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
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 18,
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
  reviewModalCTADisabled: {
    backgroundColor: "#9FB37B",
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
  noteTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  noteTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F6EC",
    borderWidth: 1,
    borderColor: "#7E9F61",
  },
  noteTagText: { fontSize: 12, color: "#426B1F" },
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
  noteCount: {
    fontSize: 13,
    color: "#666",
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
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#C6C6C6",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFF",
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
