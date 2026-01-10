import BookIcon from "@assets/icons/book-icon.svg";
import CafeIcon from "@assets/icons/cafe-icon.svg";
import HomeIcon from "@assets/icons/home-icon.svg";
import MoveIcon from "@assets/icons/move-icon.svg";
import BookCover from "@components/BookCover";
import Button from "@components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const PLACE_OPTIONS = ["집", "카페", "이동중", "도서관"];

const PLACE_ICON_MAP = {
  집: HomeIcon,
  카페: CafeIcon,
  이동중: MoveIcon,
  도서관: BookIcon,
};

// 배열을 n개씩 끊어서 페이지로 만드는 헬퍼
function chunkBy(arr, size) {
  const out = [];
  for (let i = 0; i < (arr?.length || 0); i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function ReadingStartModal({
  visible,
  onClose,
  fetchBookcase,
  onSubmit,
  placeKeyMap,
}) {
  const [step, setStep] = useState(1); // 1: 장소 선택, 2: 책 선택
  const [place, setPlace] = useState(null);

  const [loadingBooks, setLoadingBooks] = useState(false);
  const [bookOptions, setBookOptions] = useState({ before: [], reading: [] });

  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookSearch, setBookSearch] = useState("");

  // Step2: 페이저(2개씩)용 상태
  const bookScrollRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(0); // 실제 보이는 영역 너비
  const [pageIndex, setPageIndex] = useState(0); // 현재 페이지

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setPlace(null);
    setSelectedBookId(null);
    setBookSearch("");
    setBookOptions({ before: [], reading: [] });
    setLoadingBooks(false);

    // Step2용 상태도 같이 초기화
    setPageIndex(0);
    setPageWidth(0);
  }, [visible]);

  const mergedBooks = useMemo(
    () => [...(bookOptions.before || []), ...(bookOptions.reading || [])],
    [bookOptions],
  );

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return mergedBooks;
    return mergedBooks.filter((b) => (b.title || "").toLowerCase().includes(q));
  }, [mergedBooks, bookSearch]);

  // 2개씩 페이지로 묶기
  const bookPages = useMemo(() => chunkBy(filteredBooks, 2), [filteredBooks]);
  const pageCount = bookPages.length;

  // 페이지 이동
  const scrollToPage = (nextIndex) => {
    if (!pageWidth) return;
    const clamped = Math.max(
      0,
      Math.min(nextIndex, Math.max(0, pageCount - 1)),
    );
    setPageIndex(clamped);
    bookScrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
  };

  // 검색 결과 바뀌면 페이지 인덱스가 범위를 벗어나지 않게 보정 + 첫 페이지로
  useEffect(() => {
    setPageIndex(0);
    if (pageWidth) {
      bookScrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [bookSearch, pageWidth]);

  const openStep2 = async (placeLabel) => {
    setPlace(placeLabel);
    setStep(2);
    setSelectedBookId(null);

    // Step2 들어갈 때 첫 페이지로
    setPageIndex(0);
    if (pageWidth) bookScrollRef.current?.scrollTo({ x: 0, animated: false });

    setLoadingBooks(true);
    try {
      const res = await fetchBookcase();
      setBookOptions({
        before: res.before || res.BEFORE || [],
        reading: res.reading || res.READING || [],
      });
    } catch (e) {
      console.warn("책장 불러오기 실패:", e.response?.data || e.message);
      setBookOptions({ before: [], reading: [] });
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      // Step2 -> Step1
      setStep(1);
      setSelectedBookId(null);
      setBookSearch("");
      return;
    }
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!place || !selectedBookId) return;

    const chosen =
      mergedBooks.find(
        (b) => String(b.id || b.bookId) === String(selectedBookId),
      ) || {};

    await onSubmit?.({
      placeLabel: place,
      placeCode: placeKeyMap[place] || "MOVING",
      selectedBookId,
      book: chosen,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBack}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            {/* sheet 안 터치하면 키보드 닫기 */}
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View style={[styles.sheet, step === 2 && { gap: 20 }]}>
                {/* 상단 타이틀 + (Step2면 뒤로가기) */}
                <View style={styles.titleRow}>
                  {step === 2 ? (
                    <Pressable
                      onPress={handleBack}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.mono[950]}
                      />
                    </Pressable>
                  ) : (
                    <View style={{ width: 24 }} />
                  )}

                  <Text style={styles.title}>
                    {step === 1
                      ? "독서 장소를 선택해주세요"
                      : "읽을 책을 선택해주세요"}
                  </Text>

                  <Pressable
                    onPress={onClose}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.mono[950]}
                    />
                  </Pressable>
                </View>
                {/* STEP 1 */}
                {step === 1 && (
                  <View style={styles.grid}>
                    {PLACE_OPTIONS.map((label) => (
                      <Pressable
                        key={label}
                        style={styles.option}
                        onPress={() => openStep2(label)}
                      >
                        <View style={styles.thumbPlaceholder}>
                          {(() => {
                            const Icon = PLACE_ICON_MAP[label];
                            return Icon ? (
                              <Icon
                                width={72}
                                height={64}
                              />
                            ) : null;
                          })()}
                        </View>
                        <Text style={styles.optionLabel}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {/* STEP 2 */}
                {step === 2 && (
                  <View style={styles.step2Content}>
                    <View style={styles.searchRow}>
                      <Ionicons
                        name="search-outline"
                        size={20}
                        color={colors.mono[950]}
                      />
                      <TextInput
                        placeholder="책장의 책을 검색해보세요"
                        value={bookSearch}
                        onChangeText={setBookSearch}
                        style={styles.searchInput}
                        placeholderTextColor={colors.mono[500]}
                        onPressIn={() => {}}
                      />
                    </View>

                    <View style={styles.booksArea}>
                      <TouchableOpacity
                        onPress={() => scrollToPage(pageIndex - 1)}
                        hitSlop={10}
                        disabled={pageIndex <= 0 || pageCount <= 1}
                        style={[
                          styles.arrowBtn,
                          (pageIndex <= 0 || pageCount <= 1) &&
                            styles.arrowDisabled,
                        ]}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={22}
                          color={colors.mono[950]}
                        />
                      </TouchableOpacity>

                      <View
                        style={styles.pagerViewport}
                        onLayout={(e) => {
                          const w = Math.floor(e.nativeEvent.layout.width);
                          if (w && w !== pageWidth) setPageWidth(w);
                        }}
                      >
                        {loadingBooks ? (
                          <View style={styles.centerState}>
                            <Text style={styles.centerStateText}>
                              불러오는 중...
                            </Text>
                          </View>
                        ) : filteredBooks.length === 0 ? (
                          <View style={styles.centerState}>
                            <Text style={styles.centerStateText}>
                              책이 없습니다
                            </Text>
                          </View>
                        ) : (
                          <ScrollView
                            ref={bookScrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={16}
                            style={styles.pagerScroll}
                            keyboardShouldPersistTaps="always"
                            onMomentumScrollEnd={(e) => {
                              if (!pageWidth) return;
                              const x = e.nativeEvent.contentOffset.x;
                              setPageIndex(Math.round(x / pageWidth));
                            }}
                          >
                            {bookPages.map((page, pIdx) => (
                              <View
                                key={`page-${pIdx}`}
                                style={[
                                  styles.page,
                                  { width: pageWidth || "100%" },
                                ]}
                              >
                                {page.map((b, idx) => {
                                  const id =
                                    b.id || b.bookId || b.isbn || "book";
                                  const key = `${id}-${idx}`;
                                  const bookId = b.id || b.bookId;

                                  return (
                                    <Pressable
                                      key={key}
                                      onPress={() => {
                                        Keyboard.dismiss();
                                        setSelectedBookId(bookId);
                                      }}
                                      style={[
                                        styles.coverBox,
                                        selectedBookId === bookId &&
                                          styles.coverBoxActive,
                                      ]}
                                    >
                                      <BookCover
                                        uri={b.cover}
                                        title={b.title}
                                        width={120}
                                        height={180}
                                        radius={0}
                                        backgroundColor={colors.mono[150]}
                                        textColor={colors.mono[500]}
                                        fallbackFontSize={16}
                                      />
                                    </Pressable>
                                  );
                                })}

                                {page.length === 1 && (
                                  <View style={styles.coverBoxSpacer} />
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => scrollToPage(pageIndex + 1)}
                        hitSlop={10}
                        disabled={pageIndex >= pageCount - 1 || pageCount <= 1}
                        style={[
                          styles.arrowBtn,
                          (pageIndex >= pageCount - 1 || pageCount <= 1) &&
                            styles.arrowDisabled,
                        ]}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={22}
                          color={colors.mono[950]}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dotsRow}>
                      {Array.from({ length: Math.max(1, pageCount) }).map(
                        (_, i) => (
                          <View
                            key={`dot-${i}`}
                            style={[
                              styles.dot,
                              i === pageIndex && styles.dotActive,
                            ]}
                          />
                        ),
                      )}
                    </View>

                    <Button
                      label="독서 시작"
                      onPress={handleSubmit}
                      disabled={!selectedBookId}
                      variant="primary"
                      tone="fill"
                      size="large"
                      fullWidth
                      style={styles.startButton}
                    />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 모달 뒤 배경 (반투명 딤 + 중앙 정렬)
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.m,
  },

  // 모달 본체 시트
  sheet: {
    width: "100%",
    backgroundColor: colors.background.DEFAULT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.mono[200],
    paddingVertical: 28,
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },

  // 상단 헤더 (뒤로가기 / 타이틀 / 닫기)
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // 모달 타이틀 텍스트
  title: {
    ...typography["heading-3-medium"],
    color: colors.mono[950],
    textAlign: "center",
    flex: 1,
  },

  // Step1: 장소 선택 그리드 (2열)
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  // Step1: 장소 옵션 하나 (아이콘 + 라벨)
  option: {
    width: "40%",
    height: 170,
    alignItems: "center",
    gap: 12,
  },

  // Step1: 장소 아이콘 영역 (SVG 들어가는 자리)
  thumbPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Step1: 장소 라벨 텍스트
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.mono[950],
  },

  step2Content: {
    gap: 20,
  },

  // Step2: 책 검색 바
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.s,
    borderRadius: 12,
    backgroundColor: colors.mono[0],
    borderWidth: 1,
    borderColor: colors.primary[0],
    marginHorizontal: 28,
    marginTop: spacing.s,
  },

  // Step2: 검색 input
  searchInput: {
    flex: 1,
    ...typography["body-1-regular"],
    color: colors.mono[950],
  },

  // Step2: 책 영역 높이 고정
  booksArea: {
    height: 185,
    flexDirection: "row",
    alignItems: "center",
  },

  // 좌우 화살표 버튼 영역
  arrowBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  // 비활성(페이지가 1개이거나 끝일 때)
  arrowDisabled: {
    opacity: 0.25,
  },

  // 실제 페이지가 보이는 영역
  pagerViewport: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },

  // ScrollView 자체를 가운데 영역(화살표 제외) 폭 100%로 고정
  pagerScroll: {
    width: "100%",
  },

  // 한 페이지(2개씩) 레이아웃
  page: {
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.s,
  },

  // 책 카드 하나
  coverBox: {
    width: 126,
    alignItems: "center",
  },

  // 페이지에 1권만 있을 때 오른쪽 자리 유지용
  coverBoxSpacer: {
    width: 126,
  },

  // 선택된 책 강조 상태
  coverBoxActive: {
    borderWidth: 1,
    borderColor: colors.primary[400],
    padding: 2,
  },

  // 로딩/빈 상태 중앙 안내
  centerState: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // 로딩/빈 상태 텍스트
  centerStateText: {
    ...typography["body-2-regular"],
    color: colors.mono[500],
  },

  // 페이지 점 인디케이터
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },

  // 점
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.mono[200],
  },

  // 활성 점
  dotActive: {
    width: 15,
    borderRadius: 6,
    backgroundColor: "#909090",
  },
});

export default memo(ReadingStartModal);
