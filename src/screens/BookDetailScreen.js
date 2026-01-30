import placeholder from "../../assets/icon.png";
import {
  createReview,
  fetchBookcase,
  fetchReview,
  updateBookcaseState,
  updateReview,
} from "@apis/bookcaseApi";
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
import Svg, { Path } from "react-native-svg";
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

const FlowerStar = ({ size = 24, color = "#355619" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 38 38"
    fill="none"
  >
    <Path
      d="M31.7802 24.3023C34.7362 29.7674 34.4818 33.6772 30.6793 36.4151C29.3458 37.3754 27.4348 37.8155 25.7636 37.8861C22.8173 38.0103 20.7414 36.1316 19.134 33.6978C15.8439 38.0915 11.5788 39.1767 7.85231 36.6911C4.02236 34.1368 3.52026 29.7886 6.43061 24.3698C1.14001 21.9934 -0.908558 18.8353 0.368295 14.4111C0.818663 12.8501 1.85999 11.2786 3.04007 10.1691C5.4678 7.88828 8.44631 8.0731 11.4005 9.24629C11.8466 3.17804 14.3108 0.0961572 18.6015 0.00312618C23.7059 -0.107387 26.3496 2.70852 27.0763 9.03088C32.8599 7.90701 36.7081 9.52475 37.7634 13.9153C38.184 15.6648 38.013 17.7608 37.4938 19.5059C36.688 22.2163 34.3625 23.5406 31.7802 24.3023Z"
      fill={color}
    />
  </Svg>
);
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
      await submit({
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
    { label: "읽기전", value: "before" },
    { label: "읽는중", value: "reading" },
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

  const formatDate = useCallback((value) => {
    if (!value) return null;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }, []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayText = useMemo(() => formatDate(todayStr), [formatDate, todayStr]);
  const startDateRaw = book.startedAt || book.startDate || book.enrollAt;
  const startDateText = useMemo(
    () => formatDate(startDateRaw),
    [startDateRaw, formatDate],
  );
  const endDateText = useMemo(
    () => formatDate(book.finishedAt || book.finishedAtTime || book.endDate),
    [book.finishedAt, book.finishedAtTime, book.endDate, formatDate],
  );
  const dateRangeText = useMemo(() => {
    const startText = startDateText || (status === "reading" ? todayText : null);
    if (startText && endDateText) return `${startText} ~ ${endDateText}`;
    if (startText) return `${startText} ~`;
    if (endDateText) return endDateText;
    return null;
  }, [startDateText, endDateText, status, todayText]);
  const userRating = useMemo(() => {
    if (typeof fetchedReview?.rating === "number") return fetchedReview.rating;
    if (typeof rating === "number") return rating;
    return 0;
  }, [fetchedReview?.rating, rating]);
  const displayTags = useMemo(() => {
    const tags = Array.isArray(fetchedReview?.hashtag)
      ? fetchedReview.hashtag
      : selectedTags || [];
    return tags.filter((t) => typeof t === "string" && t.trim().length > 0);
  }, [fetchedReview?.hashtag, selectedTags]);

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

  const submit = async ({
    ratingOverride,
    commentOverride,
    statusOverride,
    bypassReviewModalCheck = false,
    focusTabOverride,
  } = {}) => {
    const bookKey = book.id || book.bookId;
    if (!bookKey) {
      navigation.goBack();
      return;
    }
    if (reviewLoading) return;
    if (showReviewModal && !bypassReviewModalCheck) return;
    const nextStatus = statusOverride || status;
    if (nextStatus === "after" && !reviewDone && !bypassReviewModalCheck) {
      setShowReviewModal(true);
      setPendingAfter(true);
      return;
    }
    try {
      setLoading(true);
      const sanitizedTags = (selectedTags || []).filter((t) =>
        allowedTagsSet.has(t),
      );
      console.log("[review-flow] start", {
        bookKey,
        committedStatus,
        nextStatus,
        reviewDone,
        reviewBlocked,
      });
      let reviewCreated = false;
      const isTransitionToAfter =
        nextStatus === "after" && committedStatus !== "after";
      const patchDates = isTransitionToAfter
        ? { startDate: startDateRaw || todayStr, endDate: todayStr }
        : nextStatus === "reading" && !startDateRaw
          ? { startDate: todayStr }
          : {};

      let updateRes = null;
      const shouldUpdateState = nextStatus !== committedStatus;
      if (shouldUpdateState) {
        // 1) 먼저 상태를 서버에 반영 (서버가 전->중->후 순서를 요구할 수 있으므로 중간 상태 보강)
        if (nextStatus === "after" && committedStatus === "before") {
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
            nextStatus.toUpperCase(),
            patchDates,
          );
          console.log("[review-flow] updateBookcaseState ok", {
            nextStatus,
            patchDates,
            updateRes,
          });
        } catch (e) {
          console.log("[review-flow] updateBookcaseState fail", {
            nextStatus,
            patchDates,
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
          });
          // 상태 전환 제한(예: 4091) 시 한 단계씩 재시도
          const code = e.response?.data?.error?.code || e.response?.data?.code;
          if (nextStatus === "after" && code === "4091") {
            try {
              await updateBookcaseState(bookKey, "READING");
              updateRes = await updateBookcaseState(
                bookKey,
                "AFTER",
                patchDates,
              );
              console.log("[review-flow] retry updateBookcaseState ok", {
                patchDates,
                updateRes,
              });
            } catch (err) {
              console.log("[review-flow] retry updateBookcaseState fail", {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message,
              });
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
      if (nextStatus === "after") {
        if (!serverState) {
          const latest = await fetchBookcase();
          const found =
            latest?.after?.find?.((b) => b.bookId === bookKey) ||
            latest?.after?.find?.((b) => b.id === bookKey);
          serverState = found ? "after" : null;
        }
        isAfterOnServer = (serverState || "").toLowerCase() === "after";
        if (!isAfterOnServer) {
          console.log("[review-flow] after-state not reflected", {
            serverState,
            updateRes,
          });
          Alert.alert(
            "완독 상태 반영 실패",
            "서버에 완독 상태가 반영되지 않아 리뷰를 저장할 수 없습니다. 다시 시도해 주세요.",
          );
          setLoading(false);
          return;
        }
      } else {
        isAfterOnServer = (serverState || nextStatus).toLowerCase() === "after";
      }

      // 2) 리뷰 생성 (완독 + 리뷰 완료 시, 서버 상태 AFTER 일 때만)
      if (isAfterOnServer && reviewDone && !reviewBlocked) {
        console.log("[review-flow] create/update review start", {
          bookKey,
          ratingOverride,
          rating,
          selectedTags: sanitizedTags,
          noteTextLen: (noteText || "").length,
        });
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
              console.log("[review-flow] updateReview ok (comment only)");
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
                console.log("[review-flow] createReview ok (fallback)");
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
              console.log("[review-flow] createReview ok");
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
                console.log("[review-flow] createReview ok (tags cleared)");
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
                console.log("[review-flow] updateReview ok (already review)");
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
          if (code === "4039") {
            // 태그가 서버에서 허용되지 않으면 태그 없이라도 리뷰 저장 시도
            try {
              const fallbackComment = ((commentOverride ?? noteText) || "").trim();
              const fallbackRating = Number.isFinite(
                Number(ratingOverride ?? rating),
              )
                ? Number(ratingOverride ?? rating)
                : 0;
              await createReview({
                bookId: bookKey,
                rating: fallbackRating,
                hashtag: [],
                comment: fallbackComment,
              });
              setSelectedTags([]);
              setReviewPosted(true);
              await loadReview();
              return;
            } catch (retryErr) {
              console.error(
                "리뷰 재시도 실패(태그 제거):",
                retryErr.response?.data || retryErr.message,
              );
            }
          }
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
        status: nextStatus,
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

      setCommittedStatus(isAfterOnServer ? "after" : nextStatus);
      navigation.navigate("Root", {
        screen: "책장",
        params: {
          refreshKey: Date.now(),
          focusTab: focusTabOverride || nextStatus,
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
                    <Text
                      style={styles.statusText}
                      numberOfLines={1}
                    >
                      {statusLabel}
                    </Text>
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
                              numberOfLines={1}
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
                  const color = isFull
                    ? "#355619"
                    : isHalf
                      ? "#9FB37B"
                      : "#C6C6C6";
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (!canRate) return;
                      }}
                    >
                      <FlowerStar
                        size={20}
                        color={color}
                      />
                    </TouchableOpacity>
                  );
                })}
                <Text style={styles.voteText}>{displayTotalReview}명</Text>
              </View>
              <View style={styles.starsRowSpacer} />
              {(dateRangeText || status === "after") && (
                <View style={styles.reviewMetaCard}>
                  {dateRangeText && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>{dateRangeText}</Text>
                      <View style={styles.dateDivider} />
                    </View>
                  )}
                  {displayTags.length > 0 && (
                    <View style={styles.reviewTagRow}>
                      {displayTags.slice(0, 3).map((t, idx) => (
                        <View
                          key={`${t}-${idx}`}
                          style={styles.reviewTagChip}
                        >
                          <Text style={styles.reviewTagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.backCard,
              {
                position: "absolute",
                top: 0,
                alignSelf: "center",
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
            <View style={styles.noteTitleRow}>
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
                const isFull = noteRating >= full;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={1}
                    disabled
                  >
                    <View style={styles.noteStarBox}>
                      <Svg
                        width={38}
                        height={38}
                        viewBox="0 0 38 38"
                        fill="none"
                      >
                        <Path
                          d="M31.7802 24.3023C34.7362 29.7674 34.4818 33.6772 30.6793 36.4151C29.3458 37.3754 27.4348 37.8155 25.7636 37.8861C22.8173 38.0103 20.7414 36.1316 19.134 33.6978C15.8439 38.0915 11.5788 39.1767 7.85231 36.6911C4.02236 34.1368 3.52026 29.7886 6.43061 24.3698C1.14001 21.9934 -0.908558 18.8353 0.368295 14.4111C0.818663 12.8501 1.85999 11.2786 3.04007 10.1691C5.4678 7.88828 8.44631 8.0731 11.4005 9.24629C11.8466 3.17804 14.3108 0.0961572 18.6015 0.00312618C23.7059 -0.107387 26.3496 2.70852 27.0763 9.03088C32.8599 7.90701 36.7081 9.52475 37.7634 13.9153C38.184 15.6648 38.013 17.7608 37.4938 19.5059C36.688 22.2163 34.3625 23.5406 31.7802 24.3023Z"
                          fill={isFull ? "#355619" : "#C6C6C6"}
                        />
                      </Svg>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.noteTextareaWrap}>
              <View style={styles.noteHeaderRow}>
                <Text style={styles.noteTextareaLabel}>독서노트</Text>
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
            <ScrollView
              style={styles.reviewModalContent}
              contentContainerStyle={styles.reviewModalContentInner}
              showsVerticalScrollIndicator={false}
            >
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
                  const color = isFull
                    ? "#355619"
                    : isHalf
                      ? "#9FB37B"
                      : "#C6C6C6";

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
                      <FlowerStar
                        size={44}
                        color={color}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.reviewModalTags}>
                <View style={styles.reviewModalTagHeader}>
                  <Text style={styles.reviewModalTagTitle}>태그 선택</Text>
                  {selectedTags.length > 0 && (
                    <View style={styles.reviewModalSelectedTags}>
                      {selectedTags.map((tag) => (
                        <Text
                          key={tag}
                          style={styles.reviewModalSelectedTagText}
                        >
                          #{tag}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
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
            </ScrollView>

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
                  submit({
                    statusOverride: "after",
                    bypassReviewModalCheck: true,
                    focusTabOverride: "after",
                  });
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 0,
    alignItems: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "#F6F6F6",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    gap: 16,
    width: 326,
    minHeight: 604,
    alignSelf: "center",
  },
  backCard: {
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 36,
    backgroundColor: "#FFF",
  },
  flipContainer: {
    width: "100%",
    alignItems: "center",
    perspective: 1000,
  },
  noteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
    width: "100%",
  },
  coverWrap: {
    width: 264,
    height: 390,
    maxWidth: "100%",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    padding: 8,
  },
  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 7,
  },
  info: {
    width: "100%",
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#888",
    backgroundColor: "#FFF",
  },
  tagText: { fontSize: 12, color: "#888" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    height: 18,
    borderRadius: 12,
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
    minWidth: 70,
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
    paddingVertical: 8,
  },
  statusMenuItemActive: {
    backgroundColor: "#F1F6EC",
  },
  statusMenuText: { fontSize: 14, color: "#333", textAlign: "left" },
  statusMenuTextActive: { fontWeight: "700", color: "#426B1F" },
  titleWrap: {
    gap: 4,
    width: "100%",
    maxWidth: 190,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 20,
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
  starsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  starsRowSpacer: { height: 0 },
  voteText: { fontSize: 14, color: "#C6C6C6", marginLeft: 6 },
  // spacing fix when title wraps
  titleSpacer: { height: 4 },
  reviewMetaCard: {
    width: "100%",
    marginTop: 0,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#C6C6C6",
    gap: 8,
  },
  dateRow: {
    width: "100%",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#426B1F",
    fontWeight: "700",
    textAlign: "left",
  },
  reviewMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 8,
  },
  reviewTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewTagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "#7E9F61",
  },
  reviewTagText: {
    fontSize: 12,
    color: "#FFF",
  },
  reviewMetaBlock: {
    flex: 1,
    gap: 4,
  },
  dateDivider: {
    marginTop: 8,
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  reviewMetaLabel: {
    fontSize: 12,
    color: "#888",
  },
  reviewMetaValue: {
    fontSize: 14,
    color: "#191919",
    fontWeight: "700",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagItem: {
    fontSize: 14,
    color: "#191919",
    fontWeight: "700",
  },
  cta: {
    marginTop: 0,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    alignItems: "center",
    justifyContent: "center",
    width: 326,
    alignSelf: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  noteBtn: {
    marginTop: 0,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    alignItems: "center",
    justifyContent: "center",
    width: 326,
    alignSelf: "center",
  },
  noteBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  footerBtnWrap: {
    width: 326,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
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
  },
  reviewModalContentInner: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 4,
    paddingBottom: 8,
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
    width: 300,
    fontSize: 22,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
    alignSelf: "center",
  },
  noteSubtitle: {
    width: 300,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    alignSelf: "center",
  },
  noteTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
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
    gap: 4,
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
    minHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    padding: 12,
    backgroundColor: "#FFF",
    fontSize: 14,
    color: "#000",
  },
  noteStarBox: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
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
  reviewModalTagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },
  reviewModalSelectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reviewModalSelectedTagText: { fontSize: 12, color: "#426B1F" },
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
