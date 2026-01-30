import placeholder from "../../assets/icon.png";
import SortLatestIcon from "../../assets/icons/sort-latest.svg";
import {
  deleteBookFromBookcase,
  fetchBookcase,
  searchBookcase,
  updateBookcaseState,
} from "@apis/bookcaseApi";
import BookShelfTabs from "@components/BookshelfTabs";
import TutorialOverlay from "@components/TutorialOverlay";
import StarIcon from "@components/StarIcon";
import ModamLogoText from "@components/common/ModamLogoText";
import { TUTORIAL_STEP_KEY } from "@constants/tutorial";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { spacing } from "@theme/spacing";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { label: "읽고 싶은", value: "before" },
  { label: "읽는 중인", value: "reading" },
  { label: "완독한", value: "after" },
];

// 간단 캐시: 화면 재마운트 시에도 이전에 추가한 책 유지
let bookshelfCache = {
  before: [],
  reading: [],
  after: [],
};

// 상태별 목록을 단일화: 동일 id는 마지막 상태 기준으로 하나만 유지
const normalizeBooks = (sources = []) => {
  const byId = new Map();
  sources.flat().forEach((book) => {
    if (!book?.id) return;
    const status = (book.status || "before").toLowerCase();
    byId.set(book.id, { ...book, status });
  });

  const score = (b) => {
    const t =
      b.enrollAt ||
      b.startedAt ||
      b.finishedAt ||
      b.createdAt ||
      b.updatedAt ||
      b.createdDate ||
      null;
    const ts = t ? new Date(t).getTime() : 0;
    return isNaN(ts) ? 0 : ts;
  };

  const result = { before: [], reading: [], after: [] };
  byId.forEach((book) => {
    const key =
      book.status === "reading"
        ? "reading"
        : book.status === "after"
          ? "after"
          : "before";
    result[key].push(book);
  });

  // 최신순: 날짜 내림차순, 없으면 id desc
  Object.keys(result).forEach((k) => {
    result[k].sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sb - sa;
      return (b.id || 0) - (a.id || 0);
    });
  });
  return result;
};

const sortByLatest = (list = []) => {
  const score = (b) => {
    const t =
      b.enrollAt ||
      b.startedAt ||
      b.finishedAt ||
      b.createdAt ||
      b.updatedAt ||
      b.createdDate ||
      null;
    const ts = t ? new Date(t).getTime() : 0;
    return isNaN(ts) ? 0 : ts;
  };
  return [...list].sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    if (sa !== sb) return sb - sa;
    return (b.id || 0) - (a.id || 0);
  });
};

const getCompletionDate = (book) => {
  const raw =
    book?.endDate ||
    book?.finishedAt ||
    book?.finishedAtTime ||
    book?.updatedAt ||
    book?.createdAt ||
    book?.enrollAt ||
    null;
  if (!raw) return null;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const getCompletionKey = (book) => {
  const dt = getCompletionDate(book);
  if (!dt) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return { key: `${y}-${m}`, label: `${y}.${m}`, sortVal: dt.getTime() };
};

export default function BookshelfScreen({ route, navigation: navProp }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const tabBarHeight = 52;
  const [tab, setTab] = useState("before");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // latest | rating
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const wiggle = useRef(new Animated.Value(0)).current;
  const wiggleLoop = useRef(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [books, setBooks] = useState({
    before: [],
    reading: [],
    after: [],
  });
  const [searchResults, setSearchResults] = useState({
    before: null,
    reading: null,
    after: null,
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [afterMonthKey, setAfterMonthKey] = useState(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const translateX = useRef(new Animated.Value(0)).current;
  const [tutorialStep, setTutorialStep] = useState(null);
  const [shelfHighlightRect, setShelfHighlightRect] = useState(null);
  const searchRef = useRef(null);
  const addButtonRef = useRef(null);
  const tabsRef = useRef(null);
  const bookRef = useRef(null);
  const shelfAreaRef = useRef(null);

  const tabOrder = useMemo(() => tabs.map((t) => t.value), []);
  const currentIndex = tabOrder.indexOf(tab);
  const afterMonthOptions = useMemo(() => {
    const list = books.after || [];
    const map = new Map();
    list.forEach((b) => {
      const info = getCompletionKey(b);
      if (!info) return;
      if (!map.has(info.key)) {
        map.set(info.key, info);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.sortVal - a.sortVal);
  }, [books.after]);

  useEffect(() => {
    if (afterMonthOptions.length === 0) {
      setAfterMonthKey(null);
      return;
    }
    // 기본값/업데이트: 가장 최신 달로 맞추되, 선택값이 사라졌을 때만 갱신
    const latestKey = afterMonthOptions[0]?.key;
    setAfterMonthKey((prev) => {
      const exists = prev && afterMonthOptions.some((o) => o.key === prev);
      if (!exists) return latestKey;
      return prev;
    });
  }, [afterMonthOptions]);

  useEffect(() => {
    if (tab !== "after") {
      setMonthDropdownOpen(false);
    }
  }, [tab]);

  const monthLabel = useMemo(() => {
    if (afterMonthOptions.length === 0) {
      const now = new Date();
      return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    const opt =
      afterMonthOptions.find((o) => o.key === afterMonthKey) ||
      afterMonthOptions[0];
    return opt?.label || "";
  }, [afterMonthOptions, afterMonthKey]);
  const tabBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const baseList = books[tab] ?? [];
    let filtered = q
      ? baseList.filter((b) => (b.title || "").toLowerCase().includes(q))
      : baseList;

    if (tab === "after" && afterMonthKey) {
      filtered = filtered.filter((b) => {
        const info = getCompletionKey(b);
        return info?.key === afterMonthKey;
      });
    }
    if (sortBy === "rating") {
      return [...filtered].sort((a, b) => (b.rate || 0) - (a.rate || 0));
    }
    return sortByLatest(filtered);
  }, [books, tab, search, sortBy, afterMonthKey]);
  const navigationFromHook = useNavigation();
  const navigation = navProp ?? navigationFromHook;

  useEffect(() => {
    if (!isFocused) return;
    let alive = true;
    AsyncStorage.getItem(TUTORIAL_STEP_KEY).then((step) => {
      if (alive) setTutorialStep(step);
    });
    return () => {
      alive = false;
    };
  }, [isFocused]);

  const shelfSteps = useMemo(
    () => [
      {
        key: "search",
        title: "검색 / 추가",
        description: "책장을 검색하거나 책을 추가할 수 있어요.",
        type: "combined",
      },
      {
        key: "tabs",
        title: "탭",
        description: "상태별로 책장을 나눠서 볼 수 있어요.",
        type: "single",
      },
      {
        key: "book",
        title: "책 카드",
        description: "책을 눌러 상세 정보를 볼 수 있어요.",
        type: "book",
      },
    ],
    [],
  );

  const shelfStepIndex = useMemo(() => {
    if (!tutorialStep) return null;
    if (tutorialStep === "bookshelf") return 0;
    if (tutorialStep.startsWith("bookshelf:")) {
      const idx = Number(tutorialStep.split(":")[1]);
      return Number.isFinite(idx) ? idx : null;
    }
    return null;
  }, [tutorialStep]);

  useEffect(() => {
    if (shelfStepIndex == null) {
      setShelfHighlightRect(null);
      return;
    }
    const step = shelfSteps[shelfStepIndex];
    if (!step) return;
    const measureCombined = () => {
      const addBtn = addButtonRef.current;
      if (!addBtn?.measureInWindow) return;
      addBtn.measureInWindow((ax, ay, aw, ah) => {
        setShelfHighlightRect({
          x: ax,
          y: ay,
          width: aw,
          height: ah,
        });
      });
    };
    const measureSingle = (ref) => {
      if (!ref?.measureInWindow) return;
      ref.measureInWindow((x, y, width, height) => {
        if (width && height) {
          setShelfHighlightRect({ x, y, width, height });
        }
      });
    };
    const runMeasure = () => {
      if (step.type === "combined") {
        measureCombined();
        return;
      }
      if (step.type === "book") {
        if (bookRef.current?.measureInWindow) {
          measureSingle(bookRef.current);
        } else if (shelfAreaRef.current?.measureInWindow) {
          measureSingle(shelfAreaRef.current);
        }
        return;
      }
      if (step.type === "single") {
        measureSingle(tabsRef.current);
      }
    };
    const t1 = setTimeout(runMeasure, 50);
    const t2 = setTimeout(runMeasure, 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [shelfStepIndex, shelfSteps]);


  const setBooksAndCache = (updater) => {
    setBooks((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      bookshelfCache = next;
      return next;
    });
  };

  // 캐시된 책 불러오기
  useEffect(() => {
    setBooks(bookshelfCache);
  }, []);

  // 제목 검색은 현재 탭의 로컬 목록만 사용
  useEffect(() => {
    setSearchResults({ before: null, reading: null, after: null });
    setSearchLoading(false);
  }, [search, tab]);

  // 단일 업데이트 반영 (상태 이동)
  useEffect(() => {
    const updated = route?.params?.updatedBook;
    if (!updated?.id) return;
    const status = (updated.status || "before").toLowerCase();
    setBooksAndCache((prev) => {
      const cleaned = {
        before: (prev.before || []).filter((b) => b.id !== updated.id),
        reading: (prev.reading || []).filter((b) => b.id !== updated.id),
        after: (prev.after || []).filter((b) => b.id !== updated.id),
      };
      const targetKey =
        status === "reading"
          ? "reading"
          : status === "after"
            ? "after"
            : "before";
      cleaned[targetKey] = [
        { ...updated, status: targetKey },
        ...cleaned[targetKey],
      ];
      return cleaned;
    });
    if (status === "after") {
      const info = getCompletionKey(updated);
      const now = new Date();
      const fallbackKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}`;
      setAfterMonthKey(info?.key || fallbackKey);
      setTab("after");
    }
  }, [route?.params?.updatedBook]);

  const loadBookcase = useCallback(async () => {
    try {
      const data = await fetchBookcase();
      if (!data) return;
      const mapBook = (b, fallbackStatus = "before") => {
        const status = (b.status || fallbackStatus || "before").toLowerCase();
        return {
          id: b.bookId,
          title: b.title,
          author: b.author || b.publisher || "",
          coverUri: b.cover || null,
          status,
          rate: typeof b.userRate === "number" ? b.userRate : b.rate || 0,
          categoryName:
            b.categoryName || b.category || b.genre || b.genreName || "기타",
          enrollAt: b.enrollAt,
          startedAt: b.startDate || b.startedAt,
          finishedAt: b.endDate || b.finishedAt || b.finishedAtTime,
        };
      };
      const serverState = {
        before: (data.before || []).map((b) => mapBook(b, "before")),
        reading: (data.reading || []).map((b) => mapBook(b, "reading")),
        after: (data.after || []).map((b) => mapBook(b, "after")),
      };

      // 서버 + 로컬 캐시를 통합하고 상태별로 단일화
      const normalized = normalizeBooks([
        serverState.before,
        serverState.reading,
        serverState.after,
        bookshelfCache.before,
        bookshelfCache.reading,
        bookshelfCache.after,
      ]);

      setBooksAndCache(normalized);
    } catch (e) {
      console.error(
        "책장 불러오기 실패:",
        e.response?.status,
        e.response?.data || e.message,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookcase();
      if (route?.params?.focusTab) {
        const nextTab = route.params.focusTab;
        if (tabs.find((t) => t.value === nextTab)) {
          setTab(nextTab);
        }
      }
    }, [
      loadBookcase,
      route?.params?.refreshKey,
      route?.params?.focusTab,
      route?.params?.forceReload,
    ]),
  );

  // 새로 추가된 책을 책장에 반영
  useEffect(() => {
    const addedList =
      route?.params?.addedBooks ||
      (route?.params?.addedBook ? [route?.params?.addedBook] : []);

    if (!addedList.length) return;

    setBooksAndCache((prev) => {
      const next = { ...prev };
      addedList.forEach((added) => {
        const status = added.status || "before";
        const list = next[status] || [];
        const exists = list.some((b) => b.id === added.id);
        if (!exists) {
          next[status] = [added, ...list];
        }
      });
      return next;
    });

    // 새로 추가된 완독 도서는 해당 월로 바로 필터링
    const afterAdded = addedList.find(
      (b) => (b.status || "").toLowerCase() === "after",
    );
    if (afterAdded) {
      const info = getCompletionKey(afterAdded);
      if (info?.key) {
        setAfterMonthKey(info.key);
      }
      setTab("after");
    }
  }, [route?.params?.addedBook, route?.params?.addedBooks]);

  const switchTab = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= tabOrder.length) return;
    if (nextIndex === currentIndex) return;

    const nextTab = tabOrder[nextIndex];
    setTab(nextTab);
    Animated.spring(translateX, {
      toValue: -nextIndex * screenWidth,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();
  };

  // 좌우 스와이프로 탭 전환
  const panResponder = useMemo(() => {
    const SWIPE_THRESHOLD = 30;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;

        if (dx < 0) {
          switchTab(currentIndex + 1);
        } else if (dx > 0) {
          switchTab(currentIndex - 1);
        }
      },
    });
  }, [currentIndex, switchTab]);

  const chunkBooks = (arr, size) => {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  useEffect(() => {
    if (deleteTargetId) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggle, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(wiggle, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(wiggle, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      );
      wiggleLoop.current = loop;
      loop.start();
    } else {
      if (wiggleLoop.current) {
        wiggleLoop.current.stop();
      }
      wiggle.setValue(0);
    }
  }, [deleteTargetId, wiggle]);

  const handleDeleteBook = async (book) => {
    if (!book?.id) return;
    try {
      await deleteBookFromBookcase(book.id);
      setBooksAndCache((prev) => ({
        before: (prev.before || []).filter((b) => b.id !== book.id),
        reading: (prev.reading || []).filter((b) => b.id !== book.id),
        after: (prev.after || []).filter((b) => b.id !== book.id),
      }));
    } catch (e) {
      const code = e.response?.data?.error?.code || e.response?.data?.code;
      if (code === "4091") {
        try {
          const status = (book.status || "").toLowerCase();
          if (status === "after") {
            try {
              await updateBookcaseState(book.id, "READING");
            } catch (err) {
              // ignore intermediate failure
            }
          }
          if (status !== "before") {
            await updateBookcaseState(book.id, "BEFORE");
          }
          await deleteBookFromBookcase(book.id);
          setBooksAndCache((prev) => ({
            before: (prev.before || []).filter((b) => b.id !== book.id),
            reading: (prev.reading || []).filter((b) => b.id !== book.id),
            after: (prev.after || []).filter((b) => b.id !== book.id),
          }));
          return;
        } catch (retryErr) {
          console.error(
            "책 삭제 재시도 실패:",
            retryErr.response?.status,
            retryErr.response?.data || retryErr.message,
          );
        }
      } else {
        console.error(
          "책 삭제 실패:",
          e.response?.status,
          e.response?.data || e.message,
        );
      }
    } finally {
      setDeleteTargetId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]} // 하단에 배경색 깔리는거 지웠어요
      style={styles.safe}
      {...panResponder.panHandlers}
    >
      {/* 상단 영역 */}
      <View style={styles.header}>
        <ModamLogoText
          textStyle={styles.headerTitle}
          to="홈"
        />
        <TouchableOpacity
          ref={addButtonRef}
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("AddEntry")}
        >
          <Ionicons
            name="add"
            size={20}
            color="#426B1F"
          />
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View ref={tabsRef}>
        <BookShelfTabs
          tabs={tabs}
          activeTab={tab}
          onPressTab={(value) => switchTab(tabOrder.indexOf(value))}
        />
      </View>

      {/* 검색 */}
      <View
        ref={searchRef}
        style={styles.searchWrap}
      >
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#8A8A8A"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="책장 속 책을 검색해보세요"
            placeholderTextColor="#B1B1B1"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* 필터 / 정렬 */}
      <View style={styles.filterWrap}>
        {tab === "after" ? (
          <View style={styles.monthDropdownContainer}>
            <Pressable
              style={styles.monthLabelWrap}
              hitSlop={6}
              onPress={() => setMonthDropdownOpen((v) => !v)}
            >
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Ionicons
                name={monthDropdownOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color="#426B1F"
              />
            </Pressable>
            {monthDropdownOpen && (
              <View style={styles.monthDropdownList}>
                {afterMonthOptions.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={styles.monthDropdownItem}
                    onPress={() => {
                      setAfterMonthKey(opt.key);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.monthDropdownItemText}>
                      {opt.label}
                    </Text>
                    {afterMonthKey === opt.key && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#426B1F"
                      />
                    )}
                  </Pressable>
                ))}
                {afterMonthOptions.length === 0 && (
                  <Text style={styles.monthDropdownEmpty}>
                    완독 기록이 없어요
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View />
        )}
        <Pressable
          style={styles.sortRow}
          onPress={() => setShowSortSheet(true)}
          hitSlop={8}
        >
          <SortLatestIcon
            width={12}
            height={12}
          />
          <Text style={styles.sortText}>
            {sortBy === "rating" ? "별점 높은순" : "최신순"}
            {searchLoading ? " · 검색중" : ""}
          </Text>
        </Pressable>
      </View>

      <View
        style={styles.bodyArea}
        onStartShouldSetResponder={() => {
          if (deleteTargetId) {
            setDeleteTargetId(null);
            return true;
          }
          return false;
        }}
      >
        <View style={styles.swipeContainer}>
          <Animated.View
            style={[
              styles.pagesContainer,
              {
                width: screenWidth * tabs.length,
                transform: [{ translateX }],
              },
            ]}
          >
            {tabs.map((t) => (
              <ScrollView
                key={t.value}
                style={[styles.page, { width: screenWidth }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 선반 + 책 배치 */}
                {Array.from({
                  length: Math.max(
                    3,
                    Math.ceil(Math.max(tabBooks.length, 1) / 3),
                  ),
                }).map((_, rowIdx) => {
                  const chunked = chunkBooks(tabBooks, 3);
                  const row = chunked[rowIdx] || [];
                  return (
                    <View
                      key={`${tab}-${rowIdx}`}
                      style={styles.shelfArea}
                      ref={rowIdx === 0 ? shelfAreaRef : undefined}
                    >
                      <View style={[styles.shelfGroup, styles.shelfSpacing]}>
                        <View style={styles.bookRow}>
                          {Array.from({ length: 3 }).map((_, i) => {
                            const book = row[i];
                            return (
                              <View
                                key={book ? book.id : `placeholder-${i}`}
                                style={styles.bookSlot}
                              >
                                {book ? (
                                  <View style={styles.bookWrap}>
                                    <TouchableOpacity
                                      activeOpacity={0.9}
                                      ref={
                                        rowIdx === 0 && i === 0
                                          ? bookRef
                                          : undefined
                                      }
                                      onLongPress={() => {
                                        if (tab === "after") return;
                                        Vibration.vibrate(5);
                                        setDeleteTargetId(book.id);
                                      }}
                                      onPress={() => {
                                        if (deleteTargetId) {
                                          if (deleteTargetId === book.id) {
                                            setDeleteTargetId(null);
                                          } else {
                                            setDeleteTargetId(null);
                                          }
                                          return;
                                        }
                                        navigation.navigate("BookDetail", {
                                          book,
                                        });
                                      }}
                                    >
                                      <Animated.View
                                        style={[
                                          styles.bookWrap,
                                          deleteTargetId === book.id && {
                                            transform: [
                                              {
                                                rotate: wiggle.interpolate({
                                                  inputRange: [-1, 0, 1],
                                                  outputRange: [
                                                    "-2deg",
                                                    "0deg",
                                                    "2deg",
                                                  ],
                                                }),
                                              },
                                            ],
                                          },
                                        ]}
                                      >
                                        <Image
                                          source={
                                            book.coverUri
                                              ? { uri: book.coverUri }
                                              : placeholder
                                          }
                                          style={styles.bookCover}
                                          resizeMode="cover"
                                        />
                                        {deleteTargetId === book.id && (
                                          <TouchableOpacity
                                            style={styles.deleteBadge}
                                            onPress={() =>
                                              setConfirmTarget(book)
                                            }
                                          >
                                            <Ionicons
                                              name="close"
                                              size={16}
                                              color="#fff"
                                            />
                                          </TouchableOpacity>
                                        )}
                                      </Animated.View>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <View style={styles.bookPlaceholder} />
                                )}
                              </View>
                            );
                          })}
                        </View>
                        <View style={styles.shelfBar}>
                          <LinearGradient
                            colors={["#FFFFFF", "#878787"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.hole, styles.holeLeft]}
                          />
                          <LinearGradient
                            colors={["#FFFFFF", "#878787"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.hole, styles.holeRight]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ))}
          </Animated.View>
        </View>
      </View>

      {/* 정렬 모달 */}
      {showSortSheet && (
        <View style={styles.sortOverlay}>
          <TouchableOpacity
            style={styles.sortDim}
            activeOpacity={1}
            onPress={() => setShowSortSheet(false)}
          />
          <View
            style={[styles.sortSheet, { paddingBottom: 24 + insets.bottom }]}
          >
            <View style={styles.sortHandleWrap}>
              <View style={styles.sortHandle} />
            </View>
            <Text style={styles.sortSheetTitle}>정렬</Text>
            <TouchableOpacity
              style={styles.sortOptionRow}
              activeOpacity={0.85}
              onPress={() => {
                setSortBy("latest");
                setShowSortSheet(false);
              }}
            >
              <View style={styles.sortOptionLeft}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#191919"
                />
                <Text style={styles.sortOptionLabel}>최신순</Text>
              </View>
              {sortBy === "latest" && (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#426B1F"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOptionRow}
              activeOpacity={0.85}
              onPress={() => {
                setSortBy("rating");
                setShowSortSheet(false);
              }}
            >
              <View style={styles.sortOptionLeft}>
                <StarIcon
                  size={18}
                  color="#191919"
                  emptyColor="#191919"
                  variant="empty"
                />
                <Text style={styles.sortOptionLabel}>별점 높은순</Text>
              </View>
              {sortBy === "rating" && (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#426B1F"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortCloseRow}
              onPress={() => setShowSortSheet(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.sortCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        visible={!!confirmTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmTarget(null)}
      >
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmDim}
            onPress={() => setConfirmTarget(null)}
          />
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>삭제하시겠어요?</Text>
            <Text style={styles.confirmDesc}>책장에서 이 책을 삭제합니다.</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancel]}
                onPress={() => setConfirmTarget(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDelete]}
                onPress={() => handleDeleteBook(confirmTarget)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmDeleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TutorialOverlay
        visible={shelfStepIndex != null}
        highlightRect={shelfHighlightRect}
        title={shelfSteps[shelfStepIndex]?.title}
        description={shelfSteps[shelfStepIndex]?.description}
        nextLabel={
          shelfStepIndex != null &&
          shelfStepIndex === shelfSteps.length - 1
            ? "리포트로"
            : "다음"
        }
        onNext={async () => {
          if (shelfStepIndex == null) return;
          const nextIndex = shelfStepIndex + 1;
          if (nextIndex < shelfSteps.length) {
            await AsyncStorage.setItem(
              TUTORIAL_STEP_KEY,
              `bookshelf:${nextIndex}`,
            );
            setTutorialStep(`bookshelf:${nextIndex}`);
            return;
          }
          await AsyncStorage.setItem(TUTORIAL_STEP_KEY, "report");
          setTutorialStep("report");
          navigation.navigate("리포트");
        }}
        onSkip={async () => {
          await AsyncStorage.setItem(TUTORIAL_STEP_KEY, "done");
          setTutorialStep("done");
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAF5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAF5",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#608540",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: {
    backgroundColor: "#FAFAF5",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 10,
    backgroundColor: "#FAFAF5",
  },
  monthLabelWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#426B1F",
  },
  monthDropdownContainer: {
    position: "relative",
  },
  monthDropdownList: {
    position: "absolute",
    top: 28,
    left: 0,
    minWidth: 110,
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 10,
  },
  monthDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthDropdownItemText: { fontSize: 14, color: "#191919", fontWeight: "600" },
  monthDropdownEmpty: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#666",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7EEC4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#191919",
    marginLeft: 8,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  sortText: {
    fontSize: 12,
    color: "#191919",
    fontWeight: "500",
  },
  scrollContent: {
    backgroundColor: "#E9E9E9",
    paddingTop: 8,
    gap: 8,
  },
  shelfArea: {
    backgroundColor: "#E9E9E9",
    paddingTop: 12,
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  shelfGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  shelfSpacing: {
    marginTop: 6,
  },
  bottomShelfArea: {
    paddingTop: 0,
    marginTop: 12,
  },
  shelfBar: {
    position: "absolute",
    bottom: -6,
    left: 0,
    right: 0,
    height: 45,
    borderRadius: 6,
    backgroundColor: "rgba(66, 107, 31, 0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
    alignSelf: "center",
    zIndex: 3,
  },
  hole: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  holeLeft: { left: 4, top: 28 },
  holeRight: { right: 4, top: 28 },
  bookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
    zIndex: 2,
    width: "100%",
    paddingHorizontal: 10,
  },
  bookSlot: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 0,
  },
  bookWrap: { position: "relative" },
  bookCover: {
    width: 104,
    height: 156,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
    transform: [{ translateY: 6 }],
  },
  bookPlaceholder: {
    width: 108,
    height: 162,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  deleteBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#d9534f",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  emptyWrap: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    color: "#888888",
    lineHeight: 26,
  },
  swipeContainer: {
    flex: 1,
    overflow: "hidden",
  },
  pagesContainer: {
    flexDirection: "row",
  },
  page: {
    flex: 1,
  },
  bodyArea: {
    flex: 1,
    backgroundColor: "#E9E9E9",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  confirmDim: {
    ...StyleSheet.absoluteFillObject,
  },
  confirmBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191919",
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 14,
    color: "#5c5c5c",
    marginTop: 8,
    textAlign: "center",
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancel: {
    backgroundColor: "#f1f1f1",
  },
  confirmDelete: {
    backgroundColor: "#d9534f",
  },
  confirmCancelText: { color: "#191919", fontWeight: "600", fontSize: 15 },
  confirmDeleteText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sortOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  sortDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sortSheet: {
    backgroundColor: "#F8F8F8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sortHandleWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  sortHandle: {
    width: 42,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCCCCC",
  },
  sortSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191919",
    marginBottom: 12,
  },
  sortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDDDDD",
  },
  sortOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortOptionLabel: {
    fontSize: 16,
    color: "#191919",
    fontWeight: "500",
  },
  sortCloseRow: {
    paddingVertical: 14,
    alignItems: "center",
  },
  sortCloseText: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "600",
  },
});
