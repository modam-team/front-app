// src/screens/AddEntryScreen.js
import { searchBooks } from "@apis/bookApi";
import React, { useEffect, useState } from "react";
import {
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
import { Ionicons } from "@expo/vector-icons";

const placeholder = require("../../assets/icon.png");
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
    setSelectedBook(book);
  };

  const closeDetail = () => setSelectedBook(null);

  const renderBookItem = (item, idx) => {
    const id = item.bookId || item.id || item.isbn || idx;
    const coverUri =
      item.cover ||
      item.image ||
      item.coverImage ||
      item.thumbnail ||
      (item.thumbnailUrl ? item.thumbnailUrl : null);

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.9}
        onPress={() => openDetail(item)}
      >
        <View style={styles.listItem}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} />
          ) : (
            <Image source={placeholder} style={styles.cover} />
          )}
          <View style={styles.itemTextWrap}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {item.categoryName || item.category || "기타"}
               </Text>
             </View>
             <View style={styles.titleBlock}>
               <Text style={styles.title} numberOfLines={1}>
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
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={22} color="#B1B1B1" />
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
            <Text style={styles.helperText}>
              {isKeyword ? "검색 결과가 없습니다." : "표시할 항목이 없습니다."}
            </Text>
          )}
          {results.map((item, idx) => renderBookItem(item, idx))}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedBook}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.detailSafe}>
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
                  name="close"
                  size={22}
                  color="#000"
                />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>리뷰</Text>
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
                        {selectedBook.categoryName ||
                          selectedBook.category ||
                          "기타"}
                      </Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>읽기 전</Text>
                      <Ionicons
                        name="chevron-down-outline"
                        size={14}
                        color="#333"
                      />
                    </View>
                  </View>

                  <View style={styles.detailTitleBlock}>
                    <Text style={styles.detailBookTitle}>
                      {selectedBook.title || selectedBook.name || "제목 없음"}
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
                </View>
              </View>
            )}

            {/* 리뷰 리스트 (예시 데이터) */}
            <View style={styles.reviewList}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.avatar} />
                  <View style={styles.reviewBody}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewNickname}>닉네임입력</Text>
                      <View style={styles.reviewStars}>{renderStars()}</View>
                    </View>
                    <Text style={styles.reviewText}>
                      어떻게 이런 생각을 이렇게 멋진 스토리로 풀어낼 수 있는가...그의
                      문체 하나 하나가 경의롭다.
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
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
  },
  detailContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  detailCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  coverLargeWrap: {
    width: 264,
    height: 390,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
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
});
