// src/screens/AddEntryScreen.js
import placeholder from "../../assets/icon.png";
import { requestBookRegistration, searchBooks } from "@apis/bookApi";
import { addBookToBookcase } from "@apis/bookcaseApi";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateTarget, setDateTarget] = useState(null); // 'start' | 'end'
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());

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
          isKeyword
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
            name="star"
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
    setStartDate(null);
    setEndDate(null);
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
    setStartDate(null);
    setEndDate(null);
    setDateTarget(null);
    setShowDateModal(false);
  };

  const getCoverUri = (book) =>
    book?.cover ||
    book?.image ||
    book?.coverImage ||
    book?.thumbnail ||
    book?.thumbnailUrl ||
    null;

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
    if (!localAddOnly && status === "after") {
      if (!startDate || !endDate) {
        Alert.alert("날짜를 확인해주세요", "시작일과 완독일을 선택해주세요.");
        return;
      }

      const parsedStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      ).getTime();
      const parsedEnd = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      ).getTime();

      if (parsedStart > parsedEnd) {
        Alert.alert(
          "날짜 순서를 확인해주세요",
          "시작일이 완독일보다 늦을 수 없습니다.",
        );
        return;
      }
      newBook.readStartAt = parsedStart;
      newBook.readEndAt = parsedEnd;
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
          await addBookToBookcase(bookIdNum, status.toUpperCase());
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
    const id = item.bookId || item.id || item.isbn || idx;
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
    "라이프스타일/ 취미",
    "경제/ 경영",
    "소설/ 문학",
    "과학/ 기술/ 공학",
    "여행",
    "교육/ 어학",
    "엔터테인먼트/ 문화",
    "인문/ 사회/ 정치/ 법",
    "에세이/ 전기",
    "역사/ 종교",
    "건강/ 의학",
    "예술/ 디자인/ 건축",
    "심리/ 명상",
    "로맨스",
    "판타지/ 무협",
    "가족/ 관계",
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

  const formatDate = (d) => {
    if (!d) return "YYYY-MM-DD";
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const start = current - 60; // 과거 60년 정도
    const arr = [];
    for (let y = current; y >= start; y -= 1) arr.push(y);
    return arr;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(tempYear, tempMonth, 0).getDate();
  }, [tempYear, tempMonth]);

  useEffect(() => {
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  }, [daysInMonth, tempDay]);

  const openDateModal = (type) => {
    const base =
      type === "start" ? startDate || new Date() : endDate || new Date();
    setDateTarget(type);
    setTempYear(base.getFullYear());
    setTempMonth(base.getMonth() + 1);
    setTempDay(base.getDate());
    setShowDateModal(true);
  };

  const handleDateConfirm = () => {
    if (!dateTarget) return;
    const chosen = new Date(tempYear, tempMonth - 1, tempDay);
    if (dateTarget === "start") {
      setStartDate(chosen);
    } else {
      setEndDate(chosen);
    }
    setShowDateModal(false);
    setDateTarget(null);
  };

  const handleDateCancel = () => {
    setShowDateModal(false);
    setDateTarget(null);
  };

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
                        {renderStars(4, 20)}
                        <Text style={styles.voteCount}>10명</Text>
                      </View>

                      {status === "after" && (
                        <View style={styles.dateBlock}>
                          <Text style={styles.dateBlockTitle}>읽은 기간</Text>
                          <View style={styles.dateRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>시작일</Text>
                              <TouchableOpacity
                                style={styles.datePickerInput}
                                activeOpacity={0.8}
                                onPress={() => openDateModal("start")}
                              >
                                <Text
                                  style={[
                                    styles.dateValueText,
                                    !startDate && styles.datePlaceholder,
                                  ]}
                                >
                                  {formatDate(startDate)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>완독일</Text>
                              <TouchableOpacity
                                style={styles.datePickerInput}
                                activeOpacity={0.8}
                                onPress={() => openDateModal("end")}
                              >
                                <Text
                                  style={[
                                    styles.dateValueText,
                                    !endDate && styles.datePlaceholder,
                                  ]}
                                >
                                  {formatDate(endDate)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <Text style={styles.reviewSectionTitle}>리뷰</Text>

                <View style={styles.reviewList}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={styles.reviewCard}
                    >
                      <View style={styles.avatar} />
                      <View style={styles.reviewBody}>
                        <View style={styles.reviewTop}>
                          <Text style={styles.reviewNickname}>닉네임입력</Text>
                          <View style={styles.reviewStars}>
                            {renderStars()}
                          </View>
                        </View>
                        <Text style={styles.reviewText}>
                          어떻게 이런 생각을 이렇게 멋진 스토리로 풀어낼 수
                          있는가...그의 문체 하나 하나가 경의롭다.
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* 고정 하단 CTA */}
              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={styles.ctaButton}
                  activeOpacity={0.9}
                  onPress={handleAddToShelf}
                >
                  <Text style={styles.ctaLabel}>추가하기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {showDateModal && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={handleDateCancel}
        >
          <View style={styles.dateModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleDateCancel}
            />
            <View style={styles.dateModalBox}>
              <Text style={styles.dateModalTitle}>
                {dateTarget === "start" ? "시작일 선택" : "완독일 선택"}
              </Text>
              <View style={styles.dateColumns}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.dateColumn}
                >
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.dateOption,
                        tempYear === y && styles.dateOptionActive,
                      ]}
                      onPress={() => setTempYear(y)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          tempYear === y && styles.dateOptionTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.dateColumn}
                >
                  {[...Array(12)].map((_, idx) => {
                    const m = idx + 1;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.dateOption,
                          tempMonth === m && styles.dateOptionActive,
                        ]}
                        onPress={() => setTempMonth(m)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            tempMonth === m && styles.dateOptionTextActive,
                          ]}
                        >
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.dateColumn}
                >
                  {[...Array(daysInMonth)].map((_, idx) => {
                    const d = idx + 1;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dateOption,
                          tempDay === d && styles.dateOptionActive,
                        ]}
                        onPress={() => setTempDay(d)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            tempDay === d && styles.dateOptionTextActive,
                          ]}
                        >
                          {d.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.dateActionRow}>
                <TouchableOpacity
                  style={styles.dateActionBtn}
                  onPress={handleDateCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateActionText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateActionBtn, styles.dateActionBtnConfirm]}
                  onPress={handleDateConfirm}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.dateActionText, { color: "#426B1F" }]}>
                    선택
                  </Text>
                </TouchableOpacity>
              </View>
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
  datePickerInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    marginTop: 4,
  },
  dateValueText: {
    fontSize: 14,
    color: "#191919",
  },
  datePlaceholder: {
    color: "#B1B1B1",
  },
  dateHelper: {
    fontSize: 12,
    color: "#666",
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
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dateModalBox: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 16,
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dateModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191919",
    marginBottom: 12,
    textAlign: "center",
  },
  dateColumns: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dateColumn: {
    flex: 1,
    maxHeight: 220,
  },
  dateOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#F6F6F6",
  },
  dateOptionActive: {
    backgroundColor: "#D7EEC4",
  },
  dateOptionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  dateOptionTextActive: {
    fontWeight: "700",
    color: "#426B1F",
  },
  dateActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dateActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  dateActionBtnConfirm: {
    borderColor: "#426B1F",
    backgroundColor: "#E8F3DD",
  },
  dateActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
});
