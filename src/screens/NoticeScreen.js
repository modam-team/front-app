import AppHeader from "@components/AppHeader";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

//TODO: 서버 붙이면 실제 데이터로 교체 하겠습니당 !
const MOCK_NOTICES = [
  /*
  { id: "1", title: "공지사항은 이러이러합니다.", createdAt: "2026-01-01" },
  { id: "2", title: "공지사항은 이러이러합니다.", createdAt: "2026-01-02" },
  { id: "3", title: "공지사항은 이러이러합니다.", createdAt: "2026-01-03" },
   */
];

export default function NoticeScreen({ navigation }) {
  // 최신순 정렬 (createdAt 기준)
  const notices = useMemo(() => {
    return [...MOCK_NOTICES].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, []);

  // 공지사항이 하나도 없는지 여부
  const isEmpty = notices.length === 0;

  // 공지사항 리스트 아이템 렌더링
  const renderItem = ({ item, index }) => {
    const isLast = index === notices.length - 1;

    return (
      <Pressable
        // TODO: 상세 화면 만들면 여기서 연결 해줄 예정입니당 !!
        onPress={() => {}}
        style={({ pressed }) => [
          styles.item,
          pressed && styles.pressed,
          !isLast && styles.itemDivider,
        ]}
      >
        {/* 공지 제목 */}
        <Text style={styles.title}>{item.title}</Text>

        {/* 공지 날짜 */}
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 상단 헤더 */}
      <AppHeader
        title="공지사항"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {/* 공지 유무에 따라 Empty / List 분기 */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

// 아직 공지가 없을 때
function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyTitle}>아직 공지가 없어요</Text>
    </View>
  );
}

// 날짜 표시 포맷
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

const styles = StyleSheet.create({
  // 화면 전체 래퍼
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // FlatList 콘텐츠 패딩
  listContent: {
    paddingTop: 47,
    paddingHorizontal: spacing.m,
  },

  // 공지사항 아이템
  item: {
    paddingBottom: 12,
  },

  // 아이템 사이 구분선
  itemDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.mono[150],
    marginBottom: 12,
  },

  // 눌림 피드백
  pressed: {
    opacity: 0.6,
  },

  // 공지 제목
  title: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
    marginBottom: spacing.s,
  },

  // 공지 날짜
  date: {
    ...typography["detail-regular"],
    color: colors.mono[600],
  },

  // ===== Empty =====
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyEmoji: {
    fontSize: 28,
    marginBottom: spacing.s,
  },

  emptyTitle: {
    ...typography["body-2-bold"],
    color: colors.mono[500],
  },
});
