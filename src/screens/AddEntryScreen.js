// src/screens/AddEntryScreen.js
import placeholder from "../../assets/icon.png";
import { requestBookRegistration, searchBooks } from "@apis/bookApi";
import {
  addBookToBookcase,
  createReview,
  fetchOtherReview,
  fetchReview,
  fetchReviewsList,
} from "@apis/bookcaseApi";
import { fetchUserProfile } from "@apis/userApi";
import StarIcon from "@components/StarIcon";
import Avatar from "@components/common/Avatar";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bestsellers = [
  {
    id: 1,
    title: "인생의 컨닝 페이퍼",
    author: "박종경",
    category: "자기계발",
    image: placeholder,
    votes: 10,
  },
  {
    id: 2,
    title: "다정한 사람이 이긴다",
    author: "이해인",
    category: "시/에세이",
    image: placeholder,
    votes: 15,
  },
  {
    id: 3,
    title: "급류",
    author: "정대건",
    category: "소설",
    image: placeholder,
    votes: 22,
  },
  {
    id: 4,
    title: "렛뎀 이론",
    author: "멜 로빈스 · 윤효원",
    category: "자기계발",
    image: placeholder,
    votes: 45,
  },
  {
    id: 5,
    title: "공감에 관하여",
    author: "이금희",
    category: "시/에세이",
    image: placeholder,
    votes: 22,
  },
];
const DETAIL_TOP_BAR_HEIGHT = 38;

export default function AddEntryScreen({ navigation }) {
  const route = useRoute();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [status, setStatus] = useState("before");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [localAddOnly, setLocalAddOnly] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewPromptRating, setReviewPromptRating] = useState(0);
  const [reviewPromptCompleted, setReviewPromptCompleted] = useState(false);
  const [showReviewTagDropdown, setShowReviewTagDropdown] = useState(false);
  const [selectedReviewTag, setSelectedReviewTag] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [detailReview, setDetailReview] = useState(null);
  const [detailReviewLoading, setDetailReviewLoading] = useState(false);
  const [reviewList, setReviewList] = useState([]);
  const [myNickname, setMyNickname] = useState("");
  const [myProfileImage, setMyProfileImage] = useState(null);
  const [startDateText, setStartDateText] = useState("");
  const [endDateText, setEndDateText] = useState("");
  const [activeDatePicker, setActiveDatePicker] = useState(null); // "start" | "end" | null
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pendingAutoOpenTitle, setPendingAutoOpenTitle] = useState(null);
  const prevStatusRef = useRef(status);
  const reviewPromptVisible = showReviewPrompt;
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
  const reviewTagOptions = ["감정 키워드", "경험 키워드", "문체 키워드"];
  const allowedTagsSet = useMemo(() => {
    const set = new Set();
    Object.values(tagCatalog).forEach((arr) => {
      (arr || []).forEach((t) => set.add(t));
    });
    return set;
  }, []);
  const canSubmitReviewModal = useMemo(
    () => reviewPromptRating > 0 && (selectedTags?.length || 0) > 0,
    [reviewPromptRating, selectedTags],
  );

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (status === "after" && !reviewPromptCompleted && selectedBook) {
      setStartDateText((prev) => (prev?.trim() ? prev : todayStr));
      setEndDateText((prev) => (prev?.trim() ? prev : todayStr));
      if (!showReviewPrompt) setShowReviewPrompt(true);
    } else if (status !== "after" && showReviewPrompt) {
      setShowReviewPrompt(false);
    }
    if (status !== "after") {
      prevStatusRef.current = status;
    }
  }, [status, reviewPromptCompleted, selectedBook, showReviewPrompt]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        setMyNickname(profile?.nickname || "");
        setMyProfileImage(
          profile?.profileImageUrl || profile?.profileUrl || null,
        );
      } catch (e) {
        console.warn("프로필 닉네임 불러오기 실패", e?.response?.data || e);
      }
    };
    loadProfile();

    const trimmed = query.trim();
    const isKeyword = !!trimmed;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchBooks(trimmed);

        // 예상 가능한 응답 형태 대응
        const books =
          (Array.isArray(data?.books) && data.books) ||
          (Array.isArray(data?.items) && data.items) ||
          (Array.isArray(data) && data) ||
          [];

        setResults(books);
        setError(null);
      } catch (e) {
        console.error("책 검색 실패:", e.response || e.message || e);
        setError(
          e?.message?.includes("2글자")
            ? e.message
            : isKeyword
              ? "검색 중 오류가 발생했습니다."
              : "베스트셀러를 불러오지 못했습니다.",
        );
        setResults(isKeyword ? [] : bestsellers);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const prefill = route?.params?.prefillBook;
    if (!prefill) return;
    openDetail(prefill);
    if (navigation?.setParams) {
      navigation.setParams({ prefillBook: null });
    }
  }, [route?.params?.prefillBook, navigation]);

  useEffect(() => {
    const prefillQuery = route?.params?.prefillQuery;
    if (!prefillQuery) return;
    setPendingAutoOpenTitle(prefillQuery);
    setQuery(prefillQuery);
    if (navigation?.setParams) {
      navigation.setParams({ prefillQuery: null });
    }
  }, [route?.params?.prefillQuery, navigation]);

  useEffect(() => {
    if (!pendingAutoOpenTitle || results.length === 0) return;
    const q = pendingAutoOpenTitle.trim().toLowerCase();
    const match =
      results.find((item) => (item.title || "").toLowerCase() === q) ||
      results[0];
    if (match) {
      openDetail(match);
      setPendingAutoOpenTitle(null);
    }
  }, [pendingAutoOpenTitle, results]);

  const renderStars = (count = 3, size = 16, color = "#426B1F") => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[...Array(5)].map((_, idx) => (
          <StarIcon
            key={idx}
            size={size}
            color={color}
            emptyColor="#C6C6C6"
            variant={idx < count ? "full" : "empty"}
          />
        ))}
      </View>
    );
  };

  const openDetail = (book) => {
    setStatus("before");
    setShowStatusMenu(false);
    setShowCategoryMenu(false);
    setLocalAddOnly(false);
    setManualTitle("");
    setManualAuthor("");
    setManualPublisher("");
    setManualCategory("");
    setSelectedBook(book);
    setStartDateText("");
    setEndDateText("");
    setShowReviewPrompt(false);
    setReviewPromptRating(0);
    setReviewPromptCompleted(false);
    setShowReviewTagDropdown(false);
    setSelectedReviewTag(null);
    setSelectedTags([]);
    setDetailReview(null);
    setDetailReviewLoading(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        setMyNickname(profile?.nickname || "");
      } catch (e) {
        console.warn("프로필 닉네임 불러오기 실패", e?.response?.data || e);
      }
    };
    loadProfile();
  }, []);

  const openManualAdd = () => {
    const manual = {
      title: query || "직접 추가",
      author: "직접 입력",
      category: "기타",
      status: "before",
      cover: null,
      bookId: null,
    };
    setStatus("before");
    setShowStatusMenu(false);
    setShowCategoryMenu(false);
    setLocalAddOnly(true);
    setManualTitle(manual.title);
    setManualAuthor("");
    setManualPublisher("");
    setManualCategory("");
    setSelectedBook(manual);
  };

  const closeDetail = () => {
    setSelectedBook(null);
    setStartDateText("");
    setEndDateText("");
    setShowReviewPrompt(false);
    setReviewPromptRating(0);
    setReviewPromptCompleted(false);
    setDetailReview(null);
    setDetailReviewLoading(false);
  };

  const detailPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const { dx, dy } = gesture;
          return dx > 20 && Math.abs(dx) > Math.abs(dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 50) {
            closeDetail();
          }
        },
      }),
    [closeDetail],
  );

  const getCoverUri = (book) =>
    book?.cover ||
    book?.image ||
    book?.coverImage ||
    book?.thumbnail ||
    book?.thumbnailUrl ||
    null;

  const normalizeHashtags = (raw) => {
    if (Array.isArray(raw)) {
      return raw.filter((t) => typeof t === "string" && t.trim().length > 0);
    }
    if (typeof raw === "string") {
      return raw
        .split(/[#,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  const getOtherId = (item) =>
    item?.userId ??
    item?.user?.userId ??
    item?.user?.id ??
    item?.otherId ??
    item?.reviewerId ??
    item?.writerId ??
    item?.memberId ??
    item?.user?.memberId ??
    null;

  const openFriendCalendar = useCallback(
    (rev) => {
      const userId = getOtherId(rev);
      if (!userId) return;
      closeDetail();
      navigation?.navigate?.("FriendCalendar", {
        friend: {
          userId,
          nickname: rev?.nickname || rev?.userName || "닉네임",
          avatar:
            rev?.profileImageUrl ||
            rev?.profileUrl ||
            rev?.avatar ||
            rev?.image ||
            null,
        },
      });
    },
    [closeDetail, navigation],
  );

  useEffect(() => {
    const bookId = selectedBook?.bookId || selectedBook?.id;
    if (!bookId) {
      setDetailReview(null);
      setReviewList([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setDetailReviewLoading(true);
        const list = await fetchReviewsList(bookId);
        const data = await fetchReview(bookId);
        if (cancelled) return;
        setDetailReview(data || null);
        const normalizedList = Array.isArray(list)
          ? list.map((item) => ({
              ...item,
              userId: getOtherId(item),
              nickname: item.nickname || item.userName || item.userId,
              comment: item.comment ?? item.review ?? "",
              rating: item.rating ?? item.rate ?? 0,
              profileImageUrl:
                item.profileImageUrl ||
                item.profileUrl ||
                item.imageUrl ||
                item.profile ||
                item.avatar ||
                null,
              hashtag: normalizeHashtags(
                item.hashtag ||
                  item.hashTag ||
                  item.tags ||
                  item.reviewTags ||
                  item.reviewHashTag ||
                  item.hashtags,
              ),
            }))
          : data
            ? [
                {
                  ...data,
                  userId: getOtherId(data),
                  nickname: data.nickname || data.userName || data.userId,
                  comment: data.comment ?? data.review ?? "",
                  rating: data.rating ?? data.rate ?? 0,
                  profileImageUrl:
                    data.profileImageUrl ||
                    data.profileUrl ||
                    data.imageUrl ||
                    data.profile ||
                    data.avatar ||
                    null,
                  hashtag: normalizeHashtags(
                    data.hashtag ||
                      data.hashTag ||
                      data.tags ||
                      data.reviewTags ||
                      data.reviewHashTag ||
                      data.hashtags,
                  ),
                },
              ]
            : [];
        const enrichedList = await Promise.all(
          normalizedList.map(async (item) => {
            if (item.hashtag && item.hashtag.length > 0) return item;
            const otherId = getOtherId(item);
            if (!otherId) return item;
            const otherIdNum = Number(otherId);
            if (Number.isNaN(otherIdNum)) return item;
            const otherReview = await fetchOtherReview({
              bookId,
              otherId: otherIdNum,
            });
            const tags = normalizeHashtags(
              otherReview?.hashtag ||
                otherReview?.hashTag ||
                otherReview?.tags ||
                otherReview?.reviewTags ||
                otherReview?.reviewHashTag ||
                otherReview?.hashtags,
            );
            if (!tags.length) return item;
            return { ...item, hashtag: tags };
          }),
        );
        if (!cancelled) setReviewList(enrichedList);
      } catch (e) {
        if (cancelled) return;
        console.error(
          "리뷰 조회 실패:",
          e.response?.status,
          e.response?.data || e.message,
        );
        setDetailReview(null);
        setReviewList([]);
      } finally {
        if (!cancelled) setDetailReviewLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedBook?.bookId, selectedBook?.id]);

  const parseDateInput = (text) => {
    if (!text) return null;
    const match = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [_, y, m, d] = match;
    const year = Number(y);
    const month = Number(m) - 1;
    const day = Number(d);
    const dt = new Date(year, month, day);
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month ||
      dt.getDate() !== day
    ) {
      return null;
    }
    return dt;
  };
  const formatDateInput = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const openDatePicker = (type) => {
    const base =
      type === "start"
        ? parseDateInput(startDateText)
        : parseDateInput(endDateText);
    setPickerDate(base || new Date());
    setActiveDatePicker(type);
  };

  const handleAddToShelf = async () => {
    if (!selectedBook) return;
    if (status === "after" && !reviewPromptCompleted) {
      const todayStr = new Date().toISOString().slice(0, 10);
      setStartDateText((prev) => (prev?.trim() ? prev : todayStr));
      setEndDateText((prev) => (prev?.trim() ? prev : todayStr));
      setReviewPromptCompleted(false);
      setShowReviewPrompt(true);
      return;
    }
    const bookId = selectedBook.bookId || selectedBook.id || selectedBook.isbn;

    const bookIdNum = Number(bookId);
    const hasValidId = !!bookId && !Number.isNaN(bookIdNum);

    const coverUri = getCoverUri(selectedBook);
    const finalTitle = localAddOnly
      ? manualTitle.trim() || "제목 없음"
      : selectedBook.title || selectedBook.name || "제목 없음";
    const finalAuthor = localAddOnly
      ? manualAuthor.trim() || "작가 미상"
      : selectedBook.author ||
        selectedBook.authors?.join(", ") ||
        selectedBook.publisher ||
        "작가 미상";
    const finalPublisher = localAddOnly
      ? manualPublisher.trim()
      : selectedBook.publisher || "";
    const finalCategory = localAddOnly
      ? manualCategory ||
        selectedBook.category ||
        selectedBook.categoryName ||
        "기타"
      : selectedBook.categoryName || selectedBook.category || "기타";

    const newBook = {
      id: hasValidId ? bookIdNum : Date.now(),
      title: finalTitle,
      author: finalAuthor,
      publisher: finalPublisher,
      categoryName: finalCategory,
      coverUri,
      status,
    };
    if (status === "after") {
      const todayStr = new Date().toISOString().slice(0, 10);
      const startText = startDateText?.trim() || todayStr;
      const endText = endDateText?.trim() || todayStr;
      const parsedStart = parseDateInput(startText);
      const parsedEnd = parseDateInput(endText);
      if (!parsedStart || !parsedEnd) {
        Alert.alert("날짜를 확인해주세요", "YYYY-MM-DD 형식으로 입력해주세요.");
        return;
      }
      if (parsedStart.getTime() > parsedEnd.getTime()) {
        Alert.alert(
          "날짜 순서를 확인해주세요",
          "시작일이 완독일보다 늦을 수 없습니다.",
        );
        return;
      }
      newBook.readStartAt = parsedStart.getTime();
      newBook.readEndAt = parsedEnd.getTime();
      newBook.startDate = startText;
      newBook.endDate = endText;
      newBook.startedAt = startText;
      newBook.finishedAt = endText;
    }

    if (localAddOnly) {
      try {
        await requestBookRegistration({
          title: finalTitle,
          author: finalAuthor,
          publisher: finalPublisher || "",
          category: finalCategory || "기타",
        });
        Alert.alert("요청 완료", "요청되었습니다!");
        closeDetail();
      } catch (e) {
        console.error(
          "책 요청 실패:",
          e.response?.status,
          e.response?.data || e.message,
        );
        Alert.alert(
          "요청 실패",
          e.response?.data?.error?.message ||
            "책 요청에 실패했습니다. 다시 시도해주세요.",
        );
      }
      return;
    }

    const submit = async () => {
      try {
        if (hasValidId && !localAddOnly) {
          const payloadDates =
            status === "after"
              ? {
                  startDate:
                    startDateText?.trim() ||
                    new Date().toISOString().slice(0, 10),
                  endDate:
                    endDateText?.trim() ||
                    new Date().toISOString().slice(0, 10),
                }
              : {};
          await addBookToBookcase(
            bookIdNum,
            status.toUpperCase(),
            payloadDates,
          );
          if (status === "after" && reviewPromptCompleted) {
            const safeTags = Array.isArray(selectedTags)
              ? selectedTags.filter((t) => allowedTagsSet.has(t))
              : [];
            try {
              await createReview({
                bookId: bookIdNum,
                rating: reviewPromptRating,
                hashtag: safeTags,
                comment: "",
              });
            } catch (e) {
              const code =
                e.response?.data?.error?.code || e.response?.data?.code;
              if (code === "4039") {
                try {
                  await createReview({
                    bookId: bookIdNum,
                    rating: reviewPromptRating,
                    hashtag: [],
                    comment: "",
                  });
                } catch (err) {
                  console.warn(
                    "리뷰 생성 실패(태그 제거 재시도):",
                    err.response?.data || err.message,
                  );
                }
              } else {
                console.warn("리뷰 생성 실패:", e.response?.data || e.message);
              }
            }
          }
        }
        closeDetail();
        navigation.navigate("Root", {
          screen: "책장",
          params: {
            addedBooks: [newBook],
            refreshKey: Date.now(),
            forceReload: Date.now(),
            focusTab: status,
          },
        });
      } catch (e) {
        console.error(
          "책장 추가 실패:",
          e.response?.status,
          e.response?.data || e.message,
        );
        const status = e.response?.status;
        const code = e.response?.data?.error?.code || e.response?.data?.code;
        const msgText =
          e.response?.data?.error?.message ||
          e.response?.data?.message ||
          e.message;
        if (status === 409 || code === "409") {
          Alert.alert("추가 실패", "이미 담아둔 책이 있습니다.");
          return;
        }
        if (msgText && /already|존재/i.test(msgText)) {
          Alert.alert("추가 실패", "이미 담아둔 책이 있습니다.");
          return;
        }
        Alert.alert(
          "추가 실패",
          e.response?.data?.error?.message ||
            "책장에 추가하지 못했습니다. 다시 시도해주세요.",
        );
      }
    };

    submit();
  };

  const renderBookItem = (item, idx) => {
    const baseId = item.bookId || item.id || item.isbn || "item";
    const id = `${baseId}-${idx}`;
    const coverUri = getCoverUri(item);

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.9}
        onPress={() => openDetail(item)}
      >
        <View style={styles.listItem}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.cover}
            />
          ) : (
            <Image
              source={placeholder}
              style={styles.cover}
            />
          )}
          <View style={styles.itemTextWrap}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {item.categoryName || item.category || "기타"}
              </Text>
            </View>
            <View style={styles.titleBlock}>
              <Text
                style={styles.title}
                numberOfLines={1}
              >
                {item.title || item.name || "제목 없음"}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.author}>
                  {item.author ||
                    item.authors?.join(", ") ||
                    item.publisher ||
                    "작가 미상"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isKeyword = query.trim().length > 0;
  const hasResults = results.length > 0;
  const statusOptions = [
    { label: "읽기 전", value: "before" },
    { label: "읽는 중", value: "reading" },
    { label: "완독한", value: "after" },
  ];
  const categoryOptions = [
    "소설/문학",
    "에세이/전기",
    "심리/명상",
    "인문/사회/정치/법",
    "경제/경영",
    "과학/기술/공학",
    "예술/디자인/건축",
    "유아/청소년",
    "라이프스타일/취미",
    "의학/건강",
    "엔터테인먼트/문화",
    "교육/어학",
    "역사/종교",
    "여행",
    "로맨스",
    "가족/관계",
    "판타지/무협/SF",
  ];
  const statusLabel = useMemo(
    () => statusOptions.find((o) => o.value === status)?.label || "읽기 전",
    [status],
  );
  const isManualFilled =
    manualTitle.trim() &&
    manualAuthor.trim() &&
    manualPublisher.trim() &&
    manualCategory;

  const parsedStart = parseDateInput(startDateText);
  const parsedEnd = parseDateInput(endDateText);
  const isDateRangeValid =
    status !== "after" ||
    (parsedStart && parsedEnd && parsedStart.getTime() <= parsedEnd.getTime());
  // 버튼은 항상 활성화; 완독 상태에서는 누르면 리뷰 모달을 띄우고 날짜만 유효성 체크
  const canSubmit = status === "after" ? isDateRangeValid : true;

  // 상태가 "완독한"으로 전환되면 자동으로 리뷰 작성 모달을 띄워 작성하도록 유도
  useEffect(() => {
    if (status === "after") {
      const todayStr = new Date().toISOString().slice(0, 10);
      setStartDateText((prev) => (prev?.trim() ? prev : todayStr));
      setEndDateText((prev) => (prev?.trim() ? prev : todayStr));
      setReviewPromptCompleted(false);
      setShowReviewPrompt(true);
    } else {
      setShowReviewPrompt(false);
    }
  }, [status]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 검색바 */}
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={22}
              color="#000"
            />
          </TouchableOpacity>
          <View style={styles.searchField}>
            <Ionicons
              name="search-outline"
              size={22}
              color="#B1B1B1"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
              placeholderTextColor="#B1B1B1"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isKeyword ? "검색 결과" : "서점 베스트셀러"}
          </Text>
        </View>

        <View style={styles.listWrap}>
          {loading && (
            <Text style={styles.helperText}>
              {isKeyword ? "검색 중..." : "베스트셀러 불러오는 중..."}
            </Text>
          )}
          {error && <Text style={styles.helperError}>{error}</Text>}
          {!loading && !hasResults && !error && (
            <>
              <View style={styles.emptyState}>
                <Image
                  source={placeholder}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>등록된 책이 없습니다.</Text>
                <Text style={styles.emptyDesc}>
                  직접 추가해서 독서를 시작해보세요.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  activeOpacity={0.9}
                  onPress={openManualAdd}
                >
                  <Text style={styles.emptyButtonText}>직접 책 추가하기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {results.map((item, idx) => renderBookItem(item, idx))}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedBook}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <SafeAreaView
          style={localAddOnly ? styles.manualSafe : styles.detailSafe}
          {...(selectedBook ? detailPanResponder.panHandlers : {})}
        >
          {localAddOnly ? (
            <>
              <ScrollView
                contentContainerStyle={styles.manualContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.manualHeaderRow}>
                  <TouchableOpacity
                    onPress={closeDetail}
                    style={styles.manualBackBtn}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={22}
                      color="#000"
                    />
                  </TouchableOpacity>
                  <Text style={styles.manualHeaderTitle}>직접 책 요청하기</Text>
                </View>

                <View style={styles.manualField}>
                  <Text style={styles.manualLabel}>책 제목</Text>
                  <TextInput
                    style={styles.manualInput}
                    value={manualTitle}
                    onChangeText={setManualTitle}
                    placeholder="책 제목을 입력해 주세요."
                    placeholderTextColor="#B1B1B1"
                  />
                </View>

                <View style={styles.manualField}>
                  <Text style={styles.manualLabel}>작가</Text>
                  <TextInput
                    style={styles.manualInput}
                    value={manualAuthor}
                    onChangeText={setManualAuthor}
                    placeholder="작가를 입력해 주세요."
                    placeholderTextColor="#B1B1B1"
                  />
                </View>

                <View style={styles.manualField}>
                  <Text style={styles.manualLabel}>출판사</Text>
                  <TextInput
                    style={styles.manualInput}
                    value={manualPublisher}
                    onChangeText={setManualPublisher}
                    placeholder="출판사를 입력해 주세요."
                    placeholderTextColor="#B1B1B1"
                  />
                </View>

                <View style={styles.manualField}>
                  <Text style={styles.manualLabel}>장르</Text>
                  <TouchableOpacity
                    style={styles.manualSelect}
                    activeOpacity={0.9}
                    onPress={() => {
                      setShowCategoryMenu((v) => !v);
                      setShowStatusMenu(false);
                    }}
                  >
                    <Text style={styles.manualSelectText}>
                      {manualCategory || "장르 분류"}
                    </Text>
                    <Ionicons
                      name="chevron-down-outline"
                      size={14}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {showCategoryMenu && (
                    <>
                      <TouchableOpacity
                        style={styles.menuBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowCategoryMenu(false)}
                      />
                      <View style={styles.manualMenu}>
                        <ScrollView style={{ maxHeight: 180 }}>
                          {categoryOptions.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={styles.manualMenuItem}
                              onPress={() => {
                                setManualCategory(c);
                                setShowCategoryMenu(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.manualMenuText,
                                  manualCategory === c &&
                                    styles.manualMenuTextActive,
                                ]}
                              >
                                {c}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              <View style={styles.manualFooter}>
                <TouchableOpacity
                  style={[
                    styles.manualCta,
                    !isManualFilled && styles.manualCtaDisabled,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleAddToShelf}
                  disabled={!isManualFilled}
                >
                  <Text style={styles.manualCtaText}>요청하기</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailTopBar}>
                <TouchableOpacity
                  onPress={closeDetail}
                  style={styles.backBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>
              {/* spacer to keep content below fixed top bar */}
              <View style={{ height: DETAIL_TOP_BAR_HEIGHT }} />
              <ScrollView
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 책 상세 카드 */}
                {selectedBook && (
                  <View style={styles.detailCard}>
                    <View style={styles.coverLargeWrap}>
                      <Image
                        source={
                          selectedBook.cover ||
                          selectedBook.image ||
                          selectedBook.coverImage ||
                          selectedBook.thumbnail ||
                          selectedBook.thumbnailUrl
                            ? {
                                uri:
                                  selectedBook.cover ||
                                  selectedBook.image ||
                                  selectedBook.coverImage ||
                                  selectedBook.thumbnail ||
                                  selectedBook.thumbnailUrl,
                              }
                            : placeholder
                        }
                        style={styles.coverLarge}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.detailInfo}>
                      <View style={styles.detailTopRow}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>
                            {localAddOnly
                              ? manualCategory || "기타"
                              : selectedBook.categoryName ||
                                selectedBook.category ||
                                "기타"}
                          </Text>
                        </View>
                        <View style={{ position: "relative" }}>
                          <TouchableOpacity
                            style={styles.statusPill}
                            activeOpacity={0.9}
                            onPress={() => setShowStatusMenu((v) => !v)}
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
                                      setStatus(opt.value);
                                      setShowStatusMenu(false);
                                      if (opt.value === "after") {
                                        const todayStr = new Date()
                                          .toISOString()
                                          .slice(0, 10);
                                        setStartDateText((prev) =>
                                          prev?.trim() ? prev : todayStr,
                                        );
                                        setEndDateText((prev) =>
                                          prev?.trim() ? prev : todayStr,
                                        );
                                        setReviewPromptCompleted(false);
                                        setShowReviewPrompt(true);
                                      } else {
                                        setStartDateText("");
                                        setEndDateText("");
                                        setShowReviewPrompt(false);
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

                      <View style={styles.detailTitleBlock}>
                        <Text style={styles.detailBookTitle}>
                          {selectedBook.title ||
                            selectedBook.name ||
                            "제목 없음"}
                        </Text>
                        <Text style={styles.detailAuthor}>
                          {selectedBook.author ||
                            selectedBook.authors?.join(", ") ||
                            selectedBook.publisher ||
                            "작가 미상"}
                        </Text>
                      </View>

                      <View style={styles.detailStarsRow}>
                        {renderStars(
                          Number(
                            selectedBook.avgRate ??
                              selectedBook.averageRating ??
                              selectedBook.reviewAvg ??
                              selectedBook.reviewAverage ??
                              selectedBook.totalRate ??
                              selectedBook.rate ??
                              0,
                          ) || 0,
                          20,
                        )}
                        <Text style={styles.voteCount}>
                          {selectedBook.totalReview ||
                            (detailReview ? 1 : 0) ||
                            0}
                          명
                        </Text>
                      </View>

                      {status === "after" && reviewPromptCompleted && (
                        <View style={styles.dateBlock}>
                          <Text style={styles.dateBlockTitle}>읽은 기간</Text>
                          <View style={styles.dateRow}>
                            <View style={styles.dateField}>
                              <Text style={styles.dateLabel}>시작일</Text>
                              <TouchableOpacity
                                style={styles.dateInput}
                                activeOpacity={0.9}
                                onPress={() => openDatePicker("start")}
                              >
                                <Text
                                  style={[
                                    styles.dateInputText,
                                    !startDateText &&
                                      styles.datePlaceholderText,
                                  ]}
                                >
                                  {startDateText || "YYYY-MM-DD"}
                                </Text>
                                <Ionicons
                                  name="calendar-outline"
                                  size={16}
                                  color="#7E9F61"
                                />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.dateField}>
                              <Text style={styles.dateLabel}>완독일</Text>
                              <TouchableOpacity
                                style={styles.dateInput}
                                activeOpacity={0.9}
                                onPress={() => openDatePicker("end")}
                              >
                                <Text
                                  style={[
                                    styles.dateInputText,
                                    !endDateText && styles.datePlaceholderText,
                                  ]}
                                >
                                  {endDateText || "YYYY-MM-DD"}
                                </Text>
                                <Ionicons
                                  name="calendar-outline"
                                  size={16}
                                  color="#7E9F61"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {!isDateRangeValid && (
                            <Text style={styles.dateError}>
                              시작일이 완독일보다 늦을 수 없어요.
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {activeDatePicker && Platform.OS !== "ios" && (
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="default"
                    locale="ko-KR"
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setActiveDatePicker(null);
                        return;
                      }
                      if (!date) return;
                      if (activeDatePicker === "start") {
                        setStartDateText(formatDateInput(date));
                      } else {
                        setEndDateText(formatDateInput(date));
                      }
                      setActiveDatePicker(null);
                    }}
                  />
                )}
                {activeDatePicker && Platform.OS === "ios" && (
                  <Modal
                    visible
                    transparent
                    animationType="fade"
                    onRequestClose={() => setActiveDatePicker(null)}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerCard}>
                        <View style={styles.pickerHeader}>
                          <TouchableOpacity
                            onPress={() => setActiveDatePicker(null)}
                          >
                            <Text style={styles.pickerActionText}>취소</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              if (activeDatePicker === "start") {
                                setStartDateText(formatDateInput(pickerDate));
                              } else {
                                setEndDateText(formatDateInput(pickerDate));
                              }
                              setActiveDatePicker(null);
                            }}
                          >
                            <Text style={styles.pickerActionText}>완료</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={pickerDate}
                          mode="date"
                          display="spinner"
                          locale="ko-KR"
                          maximumDate={new Date()}
                          textColor="#222"
                          onChange={(event, date) => {
                            if (!date) return;
                            setPickerDate(date);
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                <Text style={styles.reviewSectionTitle}>리뷰</Text>
                <View style={styles.reviewList}>
                  {detailReviewLoading && (
                    <Text style={styles.helperText}>리뷰 불러오는 중...</Text>
                  )}
                  {!detailReviewLoading &&
                    reviewList
                      .filter((rev) => (rev?.comment || "").trim().length > 0)
                      .map((rev, idx) => (
                        <View
                          key={rev.id || rev.userId || `${rev.nickname}-${idx}`}
                          style={styles.reviewCard}
                        >
                          <Pressable
                            hitSlop={6}
                            onPress={() => openFriendCalendar(rev)}
                            disabled={!rev?.userId}
                          >
                            <Avatar
                              uri={
                                rev?.profileImageUrl ||
                                rev?.profileUrl ||
                                rev?.avatar ||
                                rev?.image ||
                                null
                              }
                              size={46}
                              style={styles.avatar}
                            />
                          </Pressable>
                          <View style={styles.reviewBody}>
                            <View style={styles.reviewTop}>
                              <Text style={styles.reviewNickname}>
                                {rev?.nickname || "닉네임"}
                              </Text>
                              <View style={styles.reviewStars}>
                                {renderStars(rev.rating || 0, 16, "#426B1F")}
                              </View>
                            </View>
                            <Text style={styles.reviewText}>{rev.comment}</Text>
                            {Array.isArray(rev.hashtag) &&
                              rev.hashtag.length > 0 && (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 6,
                                  }}
                                >
                                  {rev.hashtag.slice(0, 3).map((tag) => (
                                    <View
                                      key={tag}
                                      style={styles.reviewTagChip}
                                    >
                                      <Text style={styles.reviewTagText}>
                                        #{tag}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                          </View>
                        </View>
                      ))}
                  {!detailReviewLoading && reviewList.length === 0 && (
                    <Text style={styles.helperText}>
                      아직 등록된 리뷰가 없습니다.
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* 고정 하단 CTA */}
              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    !canSubmit && styles.ctaButtonDisabled,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleAddToShelf}
                  disabled={!canSubmit}
                >
                  <Text style={styles.ctaLabel}>추가하기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {reviewPromptVisible && (
            <View style={styles.reviewOverlay}>
              <View style={styles.reviewModalCard}>
                <View style={styles.reviewModalHeader}>
                  <TouchableOpacity
                    style={styles.reviewModalBack}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowReviewPrompt(false);
                      if (status === "after") {
                        setStatus(prevStatusRef.current || "before");
                      }
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
                  </Text>

                  <View style={styles.reviewModalStarsRow}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const full = i;
                      const half = i - 0.5;
                      const isFull = reviewPromptRating >= full;
                      const isHalf = !isFull && reviewPromptRating >= half;
                      return (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.9}
                          onPress={() => {
                            if (reviewPromptRating === full) {
                              setReviewPromptRating(half);
                            } else if (reviewPromptRating === half) {
                              setReviewPromptRating(full);
                            } else {
                              setReviewPromptRating(full);
                            }
                          }}
                        >
                          <StarIcon
                            size={44}
                            variant={
                              isFull ? "full" : isHalf ? "half" : "empty"
                            }
                            color="#426B1F"
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
                          showReviewTagDropdown ? "chevron-up" : "chevron-down"
                        }
                        size={18}
                        color="#333"
                      />
                    </TouchableOpacity>
                    {showReviewTagDropdown && (
                      <View style={styles.reviewModalTagList}>
                        {reviewTagOptions.map((o) => (
                          <TouchableOpacity
                            key={o}
                            style={styles.reviewModalTagLine}
                            onPress={() => {
                              setSelectedReviewTag(o);
                              setShowReviewTagDropdown(false);
                            }}
                          >
                            <Text style={styles.reviewModalTagLineText}>
                              {o}
                            </Text>
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
                              disabled={disabled}
                              onPress={() => {
                                if (active) {
                                  setSelectedTags((prev) =>
                                    prev.filter((t) => t !== tag),
                                  );
                                  return;
                                }
                                setSelectedTags((prev) => [...prev, tag]);
                              }}
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
                    onPress={() => {
                      const sanitizedTags = (selectedTags || []).filter((t) =>
                        allowedTagsSet.has(t),
                      );
                      setSelectedTags(sanitizedTags);
                      setReviewPromptCompleted(true);
                      setShowReviewPrompt(false);
                    }}
                  >
                    <Text style={styles.reviewModalCTAText}>
                      리뷰 작성 완료
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF5" },
  content: {
    paddingBottom: 40,
    backgroundColor: "#FAFAF5",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAF5",
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7EEC4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#191919",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FAFAF5",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#191919" },
  listWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  helperText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 10,
  },
  helperError: {
    color: "#D0312D",
    fontSize: 14,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 10,
    marginBottom: 10,
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: 3,
  },
  itemTextWrap: {
    flex: 1,
    justifyContent: "space-between",
    marginLeft: 12,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#888",
    backgroundColor: "#FFF",
  },
  tagText: { color: "#888", fontSize: 12 },
  titleBlock: { marginTop: 8 },
  title: { fontSize: 14, fontWeight: "700", color: "#000" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  author: { fontSize: 12, color: "#888" },
  votesRow: { flexDirection: "row", alignItems: "center" },
  voteCount: { fontSize: 12, color: "#C6C6C6", marginLeft: 4 },

  // Detail modal
  detailSafe: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    position: "relative",
  },
  detailTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: DETAIL_TOP_BAR_HEIGHT,
    paddingHorizontal: 16,
    paddingTop: 68,
    paddingBottom: 12,
    backgroundColor: "#F6F6F6",
    zIndex: 2,
  },
  detailContent: {
    paddingTop: DETAIL_TOP_BAR_HEIGHT + 12,
    paddingHorizontal: 16,
    paddingBottom: 170, // 아래 고정 버튼 높이만큼 여유
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDEDED",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
    color: "#000",
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
    marginBottom: 8,
  },
  reviewList: {
    gap: 8,
    marginBottom: 20,
  },
  reviewCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#D9D9D9",
  },
  reviewBody: { flex: 1, gap: 6 },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewNickname: {
    fontSize: 15,
    color: "#666",
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  reviewTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#E8F3DD",
  },
  reviewTagText: {
    fontSize: 12,
    color: "#426B1F",
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  detailFooter: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 38,
  },
  ctaButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#C9C9C9",
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  detailCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    alignSelf: "center",
    width: "85%",
    maxWidth: 300,
    marginBottom: 16,
  },
  coverLargeWrap: {
    width: 230,
    height: 340,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#E0E0E0",
  },
  coverLarge: {
    width: "100%",
    height: "100%",
  },
  detailInfo: {
    gap: 12,
  },
  detailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#B9D4A3",
  },
  statusText: {
    fontSize: 12,
    color: "#333",
  },
  manualForm: {
    marginTop: 6,
    gap: 6,
  },
  formRow: {
    gap: 2,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
  },
  formInput: {
    height: 36,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
    color: "#191919",
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyImage: { width: 120, height: 120, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4C4C4C" },
  emptyDesc: { fontSize: 14, color: "#4C4C4C", textAlign: "center" },
  emptyButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#888",
  },
  emptyButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  statusMenu: {
    position: "absolute",
    top: 36,
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
    zIndex: 10,
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
  categoryPill: {
    minWidth: 170,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    backgroundColor: "#FFF",
  },
  categoryText: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    color: "#333",
  },
  categoryMenu: {
    position: "absolute",
    top: 36,
    left: 0,
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
    zIndex: 10,
  },
  detailTitleBlock: {
    gap: 4,
  },
  detailBookTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  detailAuthor: {
    fontSize: 12,
    color: "#888",
  },
  detailStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBlock: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FAFAF5",
    borderWidth: 1,
    borderColor: "#E0E9D7",
    gap: 6,
  },
  dateBlockTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateField: { flex: 1, gap: 6 },
  dateLabel: { fontSize: 12, color: "#6B6B6B" },
  dateInput: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CFE0BE",
    borderRadius: 9,
    paddingHorizontal: 12,
    backgroundColor: "#F7FAF4",
  },
  dateInputText: { fontSize: 13, color: "#1F1F1F" },
  datePlaceholderText: { color: "#9AA28F" },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    backgroundColor: "#FAFAF5",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 10,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  pickerActionText: { fontSize: 15, color: "#426B1F", fontWeight: "600" },
  dateError: {
    fontSize: 12,
    color: "#D0312D",
    marginTop: 6,
  },
  // manual add
  manualSafe: {
    flex: 1,
    backgroundColor: "#FAFAF5",
  },
  manualContent: {
    paddingHorizontal: 16,
    paddingTop: 74,
    paddingBottom: 120,
    gap: 14,
  },
  manualHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  manualBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDEDED",
  },
  manualHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  manualField: {
    gap: 6,
  },
  manualLabel: {
    fontSize: 12,
    color: "#666",
  },
  manualInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    color: "#333",
    fontSize: 14,
  },
  manualSelect: {
    height: 46,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manualSelectText: {
    fontSize: 14,
    color: "#333",
  },
  manualMenu: {
    position: "absolute",
    top: 46 + 8,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  manualMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  manualMenuText: { fontSize: 14, color: "#333" },
  manualMenuTextActive: { fontWeight: "700", color: "#426B1F" },
  manualFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FAFAF5",
    borderTopWidth: 1,
    borderColor: "#E6E6E6",
  },
  manualCta: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    justifyContent: "center",
    alignItems: "center",
  },
  manualCtaDisabled: {
    backgroundColor: "#C9C9C9",
  },
  manualCtaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  reviewOverlay: {
    flex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
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
  reviewModalTags: {
    width: "100%",
    gap: 10,
  },
  reviewModalTagHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  reviewModalSelectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reviewModalSelectedTagText: { fontSize: 12, color: "#426B1F" },
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
    justifyContent: "center",
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
