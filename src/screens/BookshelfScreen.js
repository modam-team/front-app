import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, SafeAreaView, FlatList, useWindowDimensions } from "react-native";
import TabSegment from "../components/TabSegment";
import colors from "../theme/colors";
import { useBooks } from "../context/BooksContext";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";

const shelfTabs = [
  { label: "읽고 싶은", value: "before" },
  { label: "읽는 중인", value: "reading" },
  { label: "완독한", value: "after" },
];

// 개별 카드 (Hook 사용 가능하도록 컴포넌트로 분리)
const BookCard = React.memo(function BookCard({ item, index, onPress }) {
  const [ok, setOk] = useState(true);

  const title = item?.title ?? `책 ${index + 1}`;
  const author = item?.author ?? (Array.isArray(item?.authors) ? item.authors[0] : undefined);
  const coverUri =
    item?.cover ||
    item?.thumbnailUrl || item?.thumbnail || item?.imageUrl || item?.image ||
    item?.coverUrl || item?.bookImage || item?.img || item?.poster || null;

  return (
    <TouchableOpacity style={styles.bookCard} activeOpacity={0.8} onPress={onPress}>
      {coverUri && ok ? (
        <Image
          source={{ uri: coverUri }}
          style={styles.coverImg}
          resizeMode="cover"
          onError={(e) => {
            console.log("IMAGE ERROR:", coverUri, e?.nativeEvent);
            setOk(false); // 실패 시 플레이스홀더 표시
          }}
        />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}
      <Text numberOfLines={2} style={styles.bookTitle}>{title}</Text>
    </TouchableOpacity>
  );
});

export default function BookshelfScreen() {
  const [tab, setTab] = useState("before");
  const { shelves, lastShelf, setLastShelf } = useBooks();
  const { width } = useWindowDimensions();
  const route = useRoute();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const isFocused = useIsFocused();

  const trimmed = query.trim();
  const tabIndex = shelfTabs.findIndex((t) => t.value === tab);

  const filterBooks = (list) => {
    if (!trimmed) return list;
    const lower = trimmed.toLowerCase();
    return list.filter((book) => {
      const title = book?.title?.toLowerCase() ?? "";
      const author = book?.author?.toLowerCase() ?? "";
      return title.includes(lower) || author.includes(lower);
    });
  };

  const buildRows = (source) => {
    if (!source.length) return [];

    const minRows = 3; // 최소 3줄(선반 2개 노출)
    const items = [...source];
    const needed = Math.max(items.length, minRows * 3);
    while (items.length < needed) {
      items.push({ id: `placeholder-${items.length}`, placeholder: true });
    }

    const chunked = [];
    for (let i = 0; i < items.length; i += 3) {
      chunked.push(items.slice(i, i + 3));
    }
    return chunked;
  };

  const pagerRef = useRef(null);

  const goToTab = (target) => {
    const idx =
      typeof target === "number"
        ? target
        : shelfTabs.findIndex((t) => t.value === target);
    const clamped = Math.max(0, Math.min(idx, shelfTabs.length - 1));
    if (clamped === tabIndex || clamped < 0) return;
    setTab(shelfTabs[clamped].value);
    pagerRef.current?.scrollToIndex({ index: clamped, animated: true });
  };

  const handleMomentumEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    const nextTab = shelfTabs[page]?.value;
    if (nextTab && nextTab !== tab) setTab(nextTab);
  };

  useEffect(() => {
    const focusShelf = route.params?.focusShelf;
    const clearSearch = route.params?.clearSearch;
    if (focusShelf) setTab(focusShelf);
    if (clearSearch) setQuery("");
  }, [route.params?.focusShelf, route.params?.clearSearch]);

  useEffect(() => {
    if (isFocused && lastShelf) {
      setTab(lastShelf);
      setQuery("");
      setLastShelf(null);
    }
  }, [isFocused, lastShelf, setLastShelf]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.frame}>
          <View style={styles.titleBar}>
            <Text style={styles.title}>책장</Text>
          </View>

          <View style={styles.contentPanel}>
            <View style={styles.tabsArea}>
              <TabSegment tabs={shelfTabs} value={tab} onChange={goToTab} />
            </View>

            <View style={styles.searchArea}>
              <View style={styles.searchBox}>
                <View style={styles.searchIconWrap}>
                  <Text style={styles.searchIcon}>🔍</Text>
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="책장 속 책을 검색해보세요"
                  placeholderTextColor="#c1c1c1"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
            </View>

            <View style={styles.sortRow}>
              <TouchableOpacity activeOpacity={0.7} style={styles.sortBtn}>
                <Text style={styles.sortIcon}>⇅</Text>
                <Text style={styles.sortText}>최신순</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              ref={pagerRef}
              data={shelfTabs}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.value}
              onMomentumScrollEnd={handleMomentumEnd}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              renderItem={({ item: pageTab }) => {
                const books = shelves[pageTab.value] ?? [];
                const filtered = filterBooks(books);
                const hasBooksPage = books.length > 0;
                const noResultsPage = trimmed && books.length > 0 && filtered.length === 0;

                const placeholders = Array.from({ length: 9 }, (_, i) => ({
                  id: `placeholder-${pageTab.value}-${i}`,
                  placeholder: true,
                }));
                const displayRows = buildRows(hasBooksPage ? filtered : placeholders);

                return (
                  <ScrollView
                    style={{ width }}
                    contentContainerStyle={hasBooksPage ? styles.listContent : styles.listContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {displayRows.map((row, rowIndex) => {
                      const isLast = rowIndex === displayRows.length - 1;
                      return (
                        <View key={`row-${rowIndex}`}>
                          <View style={styles.row}>
                            {row.map((item, idx) =>
                              item.placeholder ? (
                                <View key={item.id || idx} style={styles.bookCard}>
                                  <View style={styles.coverPlaceholder} />
                                </View>
                              ) : (
                                <BookCard
                                  key={item.id || idx}
                                  item={item}
                                  index={rowIndex * 3 + idx}
                                  onPress={() =>
                                    navigation.navigate("BookSelect", {
                                      preselect: item,
                                      shelf: pageTab.value,
                                    })
                                  }
                                />
                              )
                            )}
                          </View>
                          {!isLast && <View style={styles.shelfBar} />}
                        </View>
                      );
                    })}
                    {!hasBooksPage && (
                      <View style={styles.emptyTextBox}>
                        <Text style={styles.emptyTitle}>추가된 책이 없습니다.</Text>
                        <Text style={styles.emptySubtitle}>책을 추가한 후 독서를 시작해보세요.</Text>
                      </View>
                    )}
                    {noResultsPage ? <Text style={styles.emptySearch}>검색 결과가 없어요.</Text> : null}
                    <View style={{ height: 140 }} />
                  </ScrollView>
                );
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  root: { flex: 1, paddingHorizontal: 0, paddingBottom: 0, backgroundColor: "#ffffff" },
  frame: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 0,
  },
  titleBar: {
    backgroundColor: colors.shade,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  contentPanel: { flex: 1, backgroundColor: "#ffffff" },
  tabsArea: { backgroundColor: "#ffffff", paddingHorizontal: 0, paddingTop: 4, paddingBottom: 6 },
  searchArea: { paddingHorizontal: 14, paddingTop: 6, backgroundColor: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d3d3d3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  searchIcon: { fontSize: 16, color: "#8c8c8c" },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  sortRow: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4, alignItems: "flex-end" },
  sortBtn: { flexDirection: "row", alignItems: "center" },
  sortIcon: { fontSize: 16, marginRight: 6, color: "#111" },
  sortText: { fontSize: 14, fontWeight: "700", color: "#111" },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 160,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  // 카드(그리드)
  bookCard: { flex: 1, maxWidth: "31%" },
  coverImg: {
    width: "100%",
    aspectRatio: 0.68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d7d7d7",
    marginBottom: 0,
    backgroundColor: "#f1f1f1",
  },
  coverPlaceholder: {
    width: "100%",
    aspectRatio: 0.68,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 0,
    marginBottom: 0,
  },
  bookTitle: { marginTop: 4, fontSize: 13, fontWeight: "700", color: colors.text },
  shelfBar: {
    height: 16,
    backgroundColor: colors.shade,
    marginHorizontal: -18, // 리스트 패딩을 상쇄해 전체 폭으로 보이도록
    marginTop: 1,
    marginBottom: 40,
  },
  emptySearch: { color: colors.subtext, paddingHorizontal: 4, paddingVertical: 6 },
  emptyContainer: { paddingTop: 70, paddingHorizontal: 18, paddingBottom: 120 },
  emptyBar: {
    height: 16,
    backgroundColor: colors.shade,
    marginTop: 80,
    marginBottom: 80,
    marginHorizontal: -18, // 빈 상태에서도 전체 폭
  },
  emptyTextBox: { alignItems: "center", paddingHorizontal: 12, marginBottom: 32, justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#4a4a4a", textAlign: "center" },
  emptySubtitle: { marginTop: 6, color: "#4a4a4a", textAlign: "center" },
});
