import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Modal,
} from 'react-native';
import { useBooks } from '../context/BooksContext';
import { searchBooks } from '../api/search';
import colors from '../theme/colors';
import { useRoute } from '@react-navigation/native';

const RECOMMENDED_TAGS = ['여운이 남는', '간결한', '힐링', '몰입감'];
const TAG_CATEGORIES = [
  { key: 'emotion', label: '감정 키워드', tags: ['감동적인', '따뜻한', '여운이 남는', '웃긴', '위로가 되는', '스릴 있는', '무거운', '희망적인'] },
  { key: 'experience', label: '경험 키워드', tags: ['배울 점', '재밌는 팩트', '실생활 도움', '상상력'] },
  { key: 'problem', label: '문제 키워드', tags: ['의문점', '반전', '어려운', '챕터별 차이'] },
];

export default function BookSelectScreen({ navigation, route }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [status, setStatus] = useState('before'); // before, reading, after
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reviewRating, setReviewRating] = useState(3);
  const [reviewCategory, setReviewCategory] = useState(null);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviews = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `review-${i}`,
        name: '닉네임입력',
        text: '어떻게 이런 생각을 이렇게 멋진 스토리로 풀어낼 수 있는가...그의 문제 하나 하나가 경의롭다.',
        score: 3,
      })),
    []
  );
  const tagCategories = [
    { key: 'emotion', label: '감정 키워드', tags: ['감동적인', '따뜻한', '여운이 남는', '웃긴', '위로가 되는', '스릴 있는', '무거운', '희망적인'] },
    { key: 'experience', label: '경험 키워드', tags: ['배울 점', '재밌는 팩트', '실생활 도움', '상상력'] },
    { key: 'problem', label: '문제 키워드', tags: ['의문점', '반전', '어려운', '챕터별 차이'] },
  ];
  const debounceRef = useRef(null);
  const { addBook, setLastShelf } = useBooks();
  const preselect = route?.params?.preselect;
  const preselectShelf = route?.params?.shelf;
  const selectedPlace = route?.params?.selectedPlace;
  const externalPick = route?.params?.onPick;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 20 && Math.abs(g.dy) < 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) handleBack();
      },
    })
  ).current;

  const trimmed = query.trim();
  useEffect(() => {
    setIsEditMode(false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedBook) {
      if (!isEditMode) setStatus('before');
      setShowHint(true);
      setShowStatusMenu(false);
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedBook, isEditMode]);

  useEffect(() => {
    if (preselect) {
      setSelectedBook(preselect);
      setStatus(preselectShelf || 'before');
      setIsEditMode(true);
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 5000);
      navigation.setParams({ preselect: undefined, shelf: undefined });
      return () => clearTimeout(timer);
    }
  }, [preselect, preselectShelf, navigation]);

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setErr(null);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setErr(null);
        const { items } = await searchBooks(trimmed);
        setResults(items);
      } catch (e) {
        const status = e?.status;
        if (status === 401) setErr('로그인이 필요해요.');
        else setErr(e?.message || '검색 중 오류가 발생했어요.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [trimmed]);

  const dataForSections = useMemo(() => {
    const fallback = Array.from({ length: 6 }, (_, i) => ({
      id: `placeholder-${i}`,
      title: '디자인의 디자인',
      author: '하라 켄야 / 안그래픽스',
      cover: null,
      category: '경제/경영',
      _placeholder: true,
    }));
    const base = results.length ? results : fallback;
    return {
      carousel: base.slice(0, 5),
      best: base.slice(0, 8),
    };
  }, [results]);

  const handleChoose = (book) => {
    setSelectedBook(book);
    setIsEditMode(false);
  };

  const handleApply = () => {
    if (!selectedBook) return;
    setLastShelf(status);
    addBook(selectedBook, {
      shelf: status,
      place: selectedPlace,
      replace: isEditMode,
      fromShelf: preselectShelf,
    });
    navigation.goBack();
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setShowStatusMenu(false);
    setShowReviewModal(val === 'after');
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleBack = () => {
    if (selectedBook) {
      setSelectedBook(null);
      setShowStatusMenu(false);
      return;
    }
    navigation.goBack();
  };

  const renderListItem = (item, idx) => (
    <TouchableOpacity
      key={item.id || idx}
      style={styles.listItem}
      activeOpacity={0.9}
      onPress={() => handleChoose(item)}
    >
      {item.cover ? (
        <Image source={{ uri: item.cover }} style={styles.listThumb} resizeMode="cover" />
      ) : (
        <View style={styles.listThumbPlaceholder} />
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.inlineTags}>
          {['여운이 남는', '간결한'].map((tag) => (
            <View key={tag} style={styles.tagChipSmall}>
              <Text style={styles.tagTextSmall}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text numberOfLines={1} style={styles.listTitle}>{item.title || '제목 미상'}</Text>
        <Text numberOfLines={1} style={styles.listMeta}>{item.author || '저자 정보 없음'}</Text>
        <View style={[styles.starsRow, { marginTop: 6 }]}>
          {[0,1,2,3,4].map((iStar) => (
            <View
              key={iStar}
              style={[
                styles.starDotSmall,
                iStar < 3 ? styles.starActive : styles.starInactive
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.badgeCategory}>
        <Text style={styles.badgeCategoryText}>{item?.category || item?._raw?.category || '분류'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReviewPanel = () => null;

  const DetailView = () => (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailCard}>
          <View style={styles.detailCover}>
            {selectedBook?.cover ? (
              <Image source={{ uri: selectedBook.cover }} style={styles.detailImg} resizeMode="contain" />
            ) : (
              <View style={styles.detailPlaceholder}>
                <Text style={styles.detailPlaceholderText}>표지</Text>
              </View>
            )}
          </View>
          <View style={styles.detailMeta}>
            <View style={styles.detailTagsRow}>
              <View style={styles.tagChipSmall}><Text style={styles.tagTextSmall}>책의 장르</Text></View>
              <View style={{ flex: 1 }} />
              <View>
                <TouchableOpacity
                  style={[styles.statusChip, styles.statusChipDrop]}
                  onPress={() => setShowStatusMenu((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.statusTextDrop}>
                    {status === 'before' ? '읽기 전' : status === 'reading' ? '읽는 중' : '읽은 후'} ▾
                  </Text>
                </TouchableOpacity>
                {showStatusMenu && (
                  <View style={styles.statusMenu}>
                    {[
                      { label: '읽기 전', value: 'before' },
                      { label: '읽는 중', value: 'reading' },
                      { label: '읽은 후', value: 'after' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={styles.statusMenuItem}
                        onPress={() => handleStatusChange(opt.value)}
                      >
                        <Text style={[styles.statusMenuText, status === opt.value && styles.statusMenuTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.detailTitle}>{selectedBook?.title || '제목 미상'}</Text>
            <Text style={styles.detailAuthor}>{selectedBook?.author || '저자 정보 없음'}</Text>
            <View style={[styles.starsRow, { marginTop: 14, justifyContent: 'flex-end' }]}>
              {[0,1,2,3,4].map((iStar) => (
                <View
                  key={iStar}
                  style={[
                    styles.starDot,
                    iStar < 3 ? styles.starActive : styles.starInactive
                  ]}
                />
              ))}
            </View>
            <View style={styles.tagRowBottom}>
              {/* 해시태그 영역을 표시하지 않음 (이미지 위로 이동) */}
            </View>
          </View>
          <View style={styles.hashOverImage} pointerEvents="none">
            {['여운이 남는', '재미있는', '간결한'].map((tag) => (
              <View key={tag} style={styles.tagChipSmallOverlay}>
                <Text style={styles.tagTextSmall}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {status === 'after' && showReviewModal && renderReviewPanel()}
      </ScrollView>
      <View style={styles.addBar}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.9} onPress={handleApply}>
          <Text style={styles.addButtonText}>{isEditMode ? '수정 완료' : '책 추가하기'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReviewModal && status === 'after'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewPanelOverlay}>
          <View style={styles.reviewPanel}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowReviewModal(false)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                <Text style={{ fontSize: 18, color: '#4a4a4a' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewPanelTitle}>리뷰 작성</Text>
            <Text style={styles.reviewPanelSubtitle}>완독한 책의 별점을 남기고 해시태그를 작성해주세요.</Text>

            <View style={styles.reviewStarsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setReviewRating(i)} style={{ padding: 4 }}>
                  <Text style={[styles.reviewStar, i <= reviewRating && styles.reviewStarActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.reviewLabel}>태그 선택</Text>
            <TouchableOpacity
              style={styles.categorySelect}
              activeOpacity={0.9}
              onPress={() => setShowCategoryList((v) => !v)}
            >
              <Text style={styles.categorySelectText}>
                {TAG_CATEGORIES.find((c) => c.key === reviewCategory)?.label || '키워드 카테고리'}
              </Text>
              <Text style={styles.categorySelectArrow}>{showCategoryList ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showCategoryList && (
              <View style={styles.categoryList}>
                {TAG_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={styles.categoryItem}
                    onPress={() => {
                      setReviewCategory(cat.key);
                      setSelectedTags([]);
                      setShowCategoryList(false);
                    }}
                  >
                    <Text style={styles.categoryItemText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {reviewCategory ? (
              <View style={styles.tagWrap}>
                {TAG_CATEGORIES.find((c) => c.key === reviewCategory)?.tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChipSmallOverlay,
                      selectedTags.includes(tag) && styles.tagChipSmallOverlayActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagTextSmall,
                        selectedTags.includes(tag) && styles.tagTextSmallActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.addButton, { marginTop: 18 }]}
              activeOpacity={0.9}
              onPress={() => setShowReviewModal(false)}
            >
              <Text style={styles.addButtonText}>리뷰 작성 완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  const ListView = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={{ paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {trimmed ? (
        <>
          {loading && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 14 }} size="small" />
          )}
          {err ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{err}</Text>
            </View>
          ) : (
            dataForSections.best.map(renderListItem)
          )}
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 해시태그</Text>
          </View>
          <View style={styles.tagRow}>
            {RECOMMENDED_TAGS.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => setQuery(tag)}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.carouselRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 18 }}
            >
              {dataForSections.carousel.map((item, idx) => (
                <TouchableOpacity
                  key={item.id || idx}
                  style={styles.cardLarge}
                  activeOpacity={0.85}
                  onPress={() => handleChoose(item)}
                >
                  <View style={styles.cardLargeCover}>
                    {item.cover ? (
                      <Image source={{ uri: item.cover }} style={styles.cardLargeImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.coverPlaceholderLarge} />
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.cardLargeTitle}>{item.title || '제목 미상'}</Text>
                  <Text numberOfLines={1} style={styles.cardLargeMeta}>{item.author || '저자 정보 없음'}</Text>
                  <View style={styles.starsRow}>
                    {[0,1,2,3,4].map((iStar) => (
                      <View
                        key={iStar}
                        style={[
                          styles.starDot,
                          iStar < 3 ? styles.starActive : styles.starInactive
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dividerBar} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>서점 베스트셀러</Text>
          </View>

          {loading && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 14 }} size="small" />
          )}

          {err ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{err}</Text>
            </View>
          ) : (
            dataForSections.best.map(renderListItem)
          )}
        </>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} {...panResponder.panHandlers}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, selectedBook && { paddingBottom: 12 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          {!selectedBook && (
            <View style={styles.searchBarTop}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInputTop}
                placeholder="검색어를 입력하세요"
                placeholderTextColor="#c1c1c1"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                returnKeyType="search"
                autoFocus
              />
            </View>
          )}
        </View>

        {selectedPlace ? (
          <Text style={styles.placeLabel}>선택된 장소: {selectedPlace}</Text>
        ) : null}

        {selectedBook ? <DetailView /> : <ListView />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.shade,
  },
  backBtn: { padding: 8 },
  backArrow: { fontSize: 28, color: '#111', fontWeight: '800' },
  searchBarTop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d8d8d8',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginLeft: 6,
  },
  searchIcon: { fontSize: 18, color: '#8c8c8c' },
  searchInputTop: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.text },
  placeLabel: {
    paddingHorizontal: 18,
    paddingTop: 6,
    color: colors.subtext,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.shade,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  tagChip: {
    backgroundColor: '#d7e5c1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: { color: '#4b6e2d', fontWeight: '700' },
  inlineTags: { flexDirection: 'row', marginBottom: 6 },
  tagChipSmall: {
    backgroundColor: '#d7e5c1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagChipSmallAlt: { backgroundColor: '#e0e0e0' },
  tagRowBottom: { flexDirection: 'row', marginTop: 10 },
  tagChipBottom: { marginRight: 10 },
  hashOverImage: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
  },
  tagChipSmallOverlay: {
    backgroundColor: '#d7e5c1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagChipSmallOverlayActive: { backgroundColor: '#4b6e2d' },
  tagTextSmallActive: { color: '#fff' },
  reviewPanelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  reviewPanel: {
    width: '70%',
    maxWidth: 320,
    backgroundColor: '#e5e5e5',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
    minHeight: 260,
  },
  reviewPanelTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  reviewPanelSubtitle: { fontSize: 13, color: colors.subtext, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  reviewStarsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  reviewStar: { fontSize: 26, color: '#d1d5db' },
  reviewStarActive: { color: '#4b6e2d' },
  reviewLabel: { marginBottom: 8, color: colors.text, fontWeight: '700' },
  categorySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  categorySelectText: { color: colors.text },
  categorySelectArrow: { color: '#4b6e2d', fontWeight: '700' },
  categoryList: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryItem: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  categoryItemText: { color: colors.text },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  reviewSubmitBtn: {
    marginTop: 16,
    backgroundColor: '#4b6e2d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#c6c6c6',
    minWidth: 86,
    alignItems: 'center',
  },
  statusChipDrop: { backgroundColor: '#c6c6c6' },
  statusTextDrop: { fontSize: 13, fontWeight: '700', color: '#4a4a4a' },
  statusMenu: {
    position: 'absolute',
    bottom: 38,
    right: 0,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 110,
  },
  statusMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusMenuText: { fontSize: 13, color: '#4a4a4a', fontWeight: '700' },
  statusMenuTextActive: { color: '#4b6e2d' },
  tagTextSmall: { color: '#4b6e2d', fontWeight: '700', fontSize: 11 },
  hintBubble: {
    position: 'absolute',
    top: -30,
    right: 0,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hintText: { color: '#fff', fontSize: 11 },
  hintCaret: {
    position: 'absolute',
    bottom: -6,
    right: 14,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#2a2a2a',
  },
  carouselRow: { paddingVertical: 12, backgroundColor: '#fff' },
  cardLarge: {
    width: 180,
    marginRight: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  cardLargeCover: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 10,
    backgroundColor: '#ededed',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardLargeImg: { width: '100%', height: '100%' },
  coverPlaceholderLarge: { flex: 1, backgroundColor: '#ededed' },
  cardLargeTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardLargeMeta: { fontSize: 12, color: colors.subtext, marginTop: 4 },
  starsRow: { flexDirection: 'row', marginTop: 6 },
  starDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  starDotSmall: { width: 9, height: 9, borderRadius: 4.5, marginRight: 4 },
  starActive: { backgroundColor: '#4b6e2d' },
  starInactive: { backgroundColor: '#d1d5db' },
  reviewBlock: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 18, marginHorizontal: -18 },
  reviewHeader: {
    backgroundColor: colors.shade,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 6,
    marginLeft: -18,
    marginRight: -18,
  },
  reviewItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dedede',
    marginRight: 12,
  },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewText: { marginTop: 6, color: colors.text, fontSize: 13, lineHeight: 18 },
  reviewMoreBtn: { paddingVertical: 12, alignItems: 'center' },
  reviewMoreText: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  dividerBar: { height: 10, backgroundColor: colors.shade, marginTop: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  listThumb: {
    width: 64,
    height: 80,
    borderRadius: 6,
    backgroundColor: colors.muted,
    marginRight: 14,
  },
  listThumbPlaceholder: {
    width: 64,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#ededed',
    marginRight: 14,
  },
  listTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  listMeta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  badgeCategory: {
    marginLeft: 10,
    borderRadius: 16,
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeCategoryText: { fontSize: 12, color: '#4a4a4a' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyText: { color: colors.subtext },
  detailCard: {
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  detailCover: {
    width: '70%',
    aspectRatio: 0.7,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailImg: { width: '100%', height: undefined, aspectRatio: 0.7, resizeMode: 'contain' },
  detailPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detailPlaceholderText: { fontSize: 22, color: colors.subtext },
  detailOverlayNote: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#000000',
    opacity: 0.75,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailOverlayText: { color: '#fff', fontSize: 11, textAlign: 'center' },
  detailMeta: { marginTop: 4, paddingHorizontal: 6, position: 'relative' },
  detailTagsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 6,
  },
  detailTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  detailAuthor: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  addButton: {
    marginTop: 0,
    backgroundColor: '#4b6e2d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
