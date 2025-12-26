// src/screens/AddEntryScreen.js
import placeholder from "../../assets/icon.png";
import { requestBookRegistration, searchBooks } from "@apis/bookApi";
import { addBookToBookcase, fetchReview } from "@apis/bookcaseApi";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function AddEntryScreen({ navigation }) {
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
  const [reviewPromptText, setReviewPromptText] = useState("");
  const [detailReview, setDetailReview] = useState(null);
  const [detailReviewLoading, setDetailReviewLoading] = useState(false);
  const [startDateText, setStartDateText] = useState("");
  const [endDateText, setEndDateText] = useState("");

  useEffect(() => {
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

  const renderStars = (count = 3, size = 16, color = "#426B1F") => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[...Array(5)].map((_, idx) => (
          <Ionicons
            key={idx}
            name="star-sharp"
            size={size}
            color={idx < count ? color : "#C6C6C6"}
            style={{ marginRight: 2 }}
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
    setReviewPromptText("");
    setDetailReview(null);
    setDetailReviewLoading(false);
  };

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
    setReviewPromptText("");
    setDetailReview(null);
    setDetailReviewLoading(false);
  };

  const getCoverUri = (book) =>
    book?.cover ||
    book?.image ||
    book?.coverImage ||
    book?.thumbnail ||
    book?.thumbnailUrl ||
    null;

  useEffect(() => {
    const bookId = selectedBook?.bookId || selectedBook?.id;
    if (!bookId) {
      setDetailReview(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setDetailReviewLoading(true);
        const data = await fetchReview(bookId);
        if (cancelled) return;
        setDetailReview(data || null);
      } catch (e) {
        if (cancelled) return;
        console.error(
          "리뷰 조회 실패:",
          e.response?.status,
          e.response?.data || e.message,
        );
        setDetailReview(null);
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

  const handleAddToShelf = async () => {
    if (!selectedBook) return;
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
      const parsedStart = parseDateInput(startDateText);
      const parsedEnd = parseDateInput(endDateText);
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
      newBook.startDate = startDateText.trim();
      newBook.endDate = endDateText.trim();
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
                  startDate: startDateText.trim(),
                  endDate: endDateText.trim(),
                }
              : {};
          await addBookToBookcase(bookIdNum, status.toUpperCase(), payloadDates);
        }
        closeDetail();
        navigation.navigate("Root", {
          screen: "책장",
          params: {
            addedBooks: [newBook],
            refreshKey: Date.now(),
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
  const canSubmit = status === "after" ? isDateRangeValid : true;

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
              <ScrollView
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailHeaderRow}>
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
                                      setShowReviewPrompt(opt.value === "after");
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
                          (detailReview?.rating ||
                            selectedBook.userRate ||
                            selectedBook.rate ||
                            0) ?? 0,
                          20,
                        )}
                        <Text style={styles.voteCount}>
                          {selectedBook.totalReview ||
                            (detailReview ? 1 : 0) ||
                            0}
                          명
                        </Text>
                      </View>

                      {status === "after" && (
                        <View style={styles.dateBlock}>
                          <Text style={styles.dateBlockTitle}>읽은 기간</Text>
                          <View style={styles.dateRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>시작일</Text>
                              <TextInput
                                style={styles.dateInput}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#B1B1B1"
                                value={startDateText}
                                onChangeText={setStartDateText}
                                keyboardType="numbers-and-punctuation"
                                maxLength={10}
                              />
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>완독일</Text>
                              <TextInput
                                style={styles.dateInput}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#B1B1B1"
                                value={endDateText}
                                onChangeText={setEndDateText}
                                keyboardType="numbers-and-punctuation"
                                maxLength={10}
                              />
                            </View>
                          </View>
                          {!isDateRangeValid && (
                            <Text style={styles.dateError}>
                              날짜를 YYYY-MM-DD로 입력하고 시작일이 완독일보다
                              늦지 않도록 해주세요.
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <Text style={styles.reviewSectionTitle}>리뷰</Text>
                <View style={styles.reviewList}>
                  {detailReviewLoading && (
                    <Text style={styles.helperText}>리뷰 불러오는 중...</Text>
                  )}
                  {!detailReviewLoading && detailReview && (
                    <View style={styles.reviewCard}>
                      <View style={styles.avatar} />
                      <View style={styles.reviewBody}>
                        <View style={styles.reviewTop}>
                          <Text style={styles.reviewNickname}>한줄 리뷰</Text>
                          <View style={styles.reviewStars}>
                            {renderStars(
                              detailReview.rating || 0,
                              16,
                              "#426B1F",
                            )}
                          </View>
                        </View>
                        <Text style={styles.reviewText}>
                          {detailReview.comment || "리뷰 내용이 없습니다."}
                        </Text>
                        {Array.isArray(detailReview.hashtag) &&
                          detailReview.hashtag.length > 0 && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                              {detailReview.hashtag.map((tag) => (
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
                  )}
                  {!detailReviewLoading && !detailReview && (
                    <Text style={styles.helperText}>아직 등록된 리뷰가 없습니다.</Text>
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
        </SafeAreaView>
      </Modal>

      {showReviewPrompt && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowReviewPrompt(false)}
        >
          <View style={styles.reviewPromptOverlay}>
            <View style={styles.reviewPromptBox}>
              <Text style={styles.reviewPromptTitle}>리뷰 작성</Text>
              <Text style={styles.reviewPromptDesc}>
                완독한 책의 별점과 한 줄 리뷰를 먼저 남겨주세요.
              </Text>
              <View style={styles.reviewPromptStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setReviewPromptRating(i)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={reviewPromptRating >= i ? "star" : "star-outline"}
                      size={24}
                      color="#426B1F"
                      style={{ marginHorizontal: 2 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewPromptInput}
                placeholder="어떤 점이 좋았나요?"
                placeholderTextColor="#B1B1B1"
                multiline
                value={reviewPromptText}
                onChangeText={setReviewPromptText}
              />
              <TouchableOpacity
                style={styles.reviewPromptCTA}
                activeOpacity={0.9}
                onPress={() => setShowReviewPrompt(false)}
              >
                <Text style={styles.reviewPromptCTAText}>계속하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
  detailContent: {
    padding: 16,
    paddingBottom: 170, // 아래 고정 버튼 높이만큼 여유
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    gap: 8,
  },
  dateBlockTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
    marginTop: 4,
    fontSize: 14,
    color: "#191919",
  },
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
    paddingTop: 12,
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
  reviewPromptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  reviewPromptBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  reviewPromptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191919",
  },
  reviewPromptDesc: {
    fontSize: 14,
    color: "#555",
  },
  reviewPromptStars: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  reviewPromptInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#191919",
    textAlignVertical: "top",
  },
  reviewPromptCTA: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#426B1F",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  reviewPromptCTAText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
