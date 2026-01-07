import { fetchReadingLogs } from "@apis/reportApi";
import DayLogsBottomSheet from "@components/DayLogsBottomSheet";
import MonthlyCalendar from "@components/MonthlyCalendar";
import StarIcon from "@components/StarIcon";
import YearMonthPicker from "@components/YearMonthPicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const now = new Date();
const THIS_MONTH_KEY = `${now.getFullYear()}-${String(
  now.getMonth() + 1,
).padStart(2, "0")}`;

export default function FriendCalendarScreen({
  navigation,
  route,
  friendsStrip = [],
}) {
  const navHook = useNavigation();
  const nav = navigation?.navigate ? navigation : navHook;
  const goBackNav = navigation?.goBack || navHook?.goBack;
  const friend = route.params?.friend || {};
  const friendIdRaw = friend.userId || friend.id;
  const friendId = Number(friendIdRaw);
  const isViewingFriend = !!friendId && !Number.isNaN(friendId);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [dayModalKey, setDayModalKey] = useState(null);
  const [readingLogs, setReadingLogs] = useState({});
  const activeDayLogs = dayModalKey ? readingLogs[dayModalKey] || [] : [];
  const [history, setHistory] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const prev = () =>
    setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1));
  const next = () =>
    setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1));

  const markedDates = useMemo(
    () => new Set(Object.keys(readingLogs)),
    [readingLogs],
  );
  const dateCounts = useMemo(() => {
    const map = {};
    Object.entries(readingLogs).forEach(([k, arr]) => {
      map[k] = (arr || []).length;
    });
    return map;
  }, [readingLogs]);

  useEffect(() => {
    let cancelled = false;
    setReadingLogs({});
    setHistory([]);
    if (!friendId || Number.isNaN(friendId)) return () => {};
    setLogsLoading(true);
    const load = async () => {
      try {
        const list = await fetchReadingLogs({
          year,
          month,
          userId: friendId,
        });
        if (cancelled) return;
        const grouped = {};
        list.forEach((item) => {
          const dt = new Date(item.readAt || item.createdAt || item.date);
          if (Number.isNaN(dt.getTime())) return;
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
            2,
            "0",
          )}-${String(dt.getDate()).padStart(2, "0")}`;
          const log = {
            id: `${item.readAt || item.createdAt}-${item.title || "book"}`,
            title: item.title || "제목 없음",
            author:
              item.author ||
              (Array.isArray(item.authors) ? item.authors.join(", ") : "") ||
              item.publisher ||
              "작가 미상",
            cover: item.cover || null,
            rating: item.rating || item.rate || item.userRate || item.star || 0,
            totalReview: item.totalReview || item.reviewCount || 0,
            time: `${String(dt.getHours()).padStart(2, "0")}:${String(
              dt.getMinutes(),
            ).padStart(2, "0")}`,
            place: item.readingPlace || "이동중",
          };
          grouped[key] = grouped[key] ? [...grouped[key], log] : [log];
        });
        setReadingLogs(grouped);
        // 최근 기록 카드용 플랫 리스트
        const flat = Object.entries(grouped)
          .flatMap(([k, arr]) =>
            (arr || []).map((log) => ({ ...log, dayKey: k })),
          )
          .sort(
            (a, b) =>
              new Date(b.dayKey).getTime() - new Date(a.dayKey).getTime(),
          );
        setHistory(flat);
      } catch (e) {
        console.warn("친구 독서 기록 불러오기 실패:", e.response?.data || e);
        setReadingLogs({});
        setHistory([]);
      } finally {
        setLogsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [year, month, friendId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.headerRow}>
            <Text style={styles.logo}>modam</Text>
          </View>
        </View>

        {/* 상단 친구 프로필 스트립 (홈과 동일 배치) */}
        <View style={styles.friendsStripRow}>
          {(() => {
            // strip을 한 번에 구성: 첫 번째는 내 프로필 고정, 나머지는 유니크하게
            const source =
              friendsStrip && friendsStrip.length > 0
                ? friendsStrip
                : friend
                  ? [friend]
                  : [];

            const selfEntry = friendsStrip?.[0] ||
              source.find((s) => s?.isSelf) ||
              route.params?.self || {
                isSelf: true,
                name: "나",
                nickname: "나",
              };

            const seen = new Set();
            const selfId = selfEntry.id || selfEntry.userId || "self";
            seen.add(String(selfId));

            const others = source.filter((s) => {
              const sid = s?.id || s?.userId;
              if (sid == null) return false;
              const key = String(sid);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            // 선택된 친구가 strip에 없으면 추가
            if (friend) {
              const fid = friend.id || friend.userId;
              if (fid != null && !seen.has(String(fid))) {
                others.push(friend);
                seen.add(String(fid));
              }
            }

            return [selfEntry, ...others];
          })().map((f, idx) => {
            const id = f.id || f.userId;
            const isSelf = idx === 0 || f.isSelf;
            const active =
              friendId && !Number.isNaN(friendId) ? id === friendId : isSelf;
            const name = f.name || f.nickname || "친구";
            const avatar = f.avatar || f.profileImageUrl;
            return (
              <Pressable
                key={`${isSelf ? "self" : id || name}-${idx}`}
                style={styles.friendItem}
                hitSlop={6}
                onPress={() => {
                  if (isSelf) {
                    // 내 버블 → 홈으로만 이동
                    if (goBackNav) goBackNav();
                    else nav?.navigate?.("Root", { screen: "홈" });
                    return;
                  }
                  if (id === friendId) return;
                  nav?.navigate?.("FriendCalendar", { friend: f });
                }}
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={[styles.avatarImage, active && styles.avatarActive]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: f.color || "#d7eec4" },
                      active && styles.avatarActive,
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {(name || "친").slice(0, 1)}
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.avatarName, active && styles.avatarNameBold]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.addWrapper}>
            <Pressable
              style={styles.addCircle}
              hitSlop={6}
              onPress={() => nav?.navigate?.("FriendList")}
            >
              <Text style={styles.addPlus}>＋</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          {!isViewingFriend && (
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <Text style={styles.progressPercent}>
                  {Math.round(
                    Math.min(
                      100,
                      ((history.length || 0) /
                        Math.max(1, friend.goalScore || history.length || 1)) *
                        100,
                    ),
                  )}
                  %
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          ((history.length || 0) /
                            Math.max(
                              1,
                              friend.goalScore || history.length || 1,
                            )) *
                            100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressMeta}>
                  <View style={styles.progressMetaLeft}>
                    <Ionicons
                      name="book-outline"
                      size={16}
                      color="#000"
                    />
                    <Text style={styles.progressText}>
                      {history.length}권을 읽었어요
                    </Text>
                  </View>
                  <Text style={styles.progressGoal}>
                    목표 {friend.goalScore || 1}권
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.calendarCard}>
            <View style={styles.yearRow}>
              <Text style={styles.yearText}>{year}</Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color="#191919"
              />
            </View>

            <MonthlyCalendar
              year={year}
              month={month}
              onPrev={prev}
              onNext={next}
              onYearChange={(val) => {
                if (val === "open") {
                  setYearPickerOpen(true);
                  return;
                }
                setYear(val);
              }}
              markedDates={markedDates}
              dateCounts={dateCounts}
              onDayPress={(key) => {
                if (!key) return;
                const logs = readingLogs[key] || [];
                if (logs.length === 0) return;
                setDayModalKey(key);
              }}
              selectedDayKey={dayModalKey}
            />
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              {friend?.nickname || "닉네임"}님의 독서 히스토리
            </Text>
            <Text style={styles.historySub}>
              클릭하면 독서 노트를 볼 수 있어요
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyRow}
          >
            {history.map((item) => {
              const rating =
                Number(item.rating ?? item.rate ?? item.userRate ?? 0) || 0;
              const author =
                item.author ||
                (Array.isArray(item.authors)
                  ? item.authors.join(", ")
                  : item.publisher) ||
                "작가 미상";
              return (
                <View
                  key={`${item.id}-${item.dayKey}`}
                  style={styles.bookCard}
                >
                  <View style={styles.bookCover}>
                    {item.cover ? (
                      <Image
                        source={{ uri: item.cover }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "#eee",
                          borderRadius: 12,
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.bookTextBlock}>
                    <Text
                      style={styles.bookTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={styles.bookMeta}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {author}
                    </Text>
                  </View>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const full = i;
                      const half = i - 0.5;
                      const isFull = rating >= full;
                      const isHalf = !isFull && rating >= half;
                      return (
                        <StarIcon
                          key={i}
                          size={16}
                          variant={isFull ? "full" : isHalf ? "half" : "empty"}
                          color="#C6C6C6"
                          emptyColor="#C6C6C6"
                        />
                      );
                    })}
                    <Text style={styles.starCount}>
                      ({item.totalReview || 0})
                    </Text>
                  </View>
                </View>
              );
            })}
            {history.length === 0 && (
              <View style={{ justifyContent: "center", paddingHorizontal: 12 }}>
                <Text style={styles.emptyHistory}>
                  {logsLoading ? "기록 불러오는 중..." : "아직 기록이 없습니다"}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <YearMonthPicker
        visible={yearPickerOpen}
        onClose={() => setYearPickerOpen(false)}
        mode="year"
        theme="mono"
        selectedYear={year}
        selectedMonth={month}
        onSelectYear={(y) => setYear(y)}
        onSelectMonth={(m) => setMonth(m)}
      />

      <DayLogsBottomSheet
        visible={!!dayModalKey}
        dayKey={dayModalKey}
        logs={activeDayLogs}
        onClose={() => setDayModalKey(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.DEFAULT },
  hero: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: colors.background.DEFAULT,
  },
  friendCalendarTitle: {
    ...typography.h3,
    color: "#608540",
    fontSize: 24,
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  logo: {
    ...typography.h3,
    color: "#608540",
    fontSize: 16,
    fontWeight: "600",
  },
  friendsStripRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
    width: "100%",
    justifyContent: "space-between",
  },
  friendItem: { alignItems: "center", width: 49 },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "#426B1F",
  },
  avatarImage: { width: 49, height: 49, borderRadius: 24.5, borderWidth: 0 },
  avatarActive: {
    borderWidth: 2,
    borderColor: "#426B1F",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: colors.mono[950] },
  avatarName: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: colors.mono[950],
    textAlign: "center",
    width: 49,
  },
  avatarNameBold: { fontWeight: "700", color: "#426B1F" },
  addCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: "#608540",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3f5d2c",
  },
  addWrapper: { marginLeft: "auto" },
  addPlus: { color: "#fff", fontSize: 24, fontWeight: "700" },
  body: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  progressTop: { gap: 10 },
  progressPercent: {
    textAlign: "right",
    fontSize: 12,
    color: "#000",
  },
  progressBarBg: {
    height: 12,
    borderRadius: 15,
    backgroundColor: "#e5e5e5",
    borderWidth: 0.5,
    borderColor: "#ccc",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#608540",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 3, height: 0 },
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMetaLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  progressText: { fontSize: 14, fontWeight: "500", color: "#000" },
  progressGoal: { fontSize: 12, color: "#000" },
  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  yearText: { fontSize: 16, fontWeight: "500", color: "#000" },
  historyHeader: {
    gap: 3,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  historySub: { fontSize: 14, color: "#000" },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  bookCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  bookCover: {
    width: 98,
    height: 128,
    borderRadius: 12,
    overflow: "hidden",
  },
  bookTextBlock: { alignItems: "center", gap: 2 },
  bookTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  bookMeta: { fontSize: 10, color: "#000" },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  starCount: { fontSize: 12, color: "#c6c6c6" },
  stripRow: {
    marginTop: 16,
    paddingVertical: 4,
    gap: 12,
  },
  stripItem: {
    alignItems: "center",
    marginRight: 12,
    width: 62,
  },
  stripAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#d7eec4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "#426B1F",
  },
  stripAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 0,
    borderColor: "#426B1F",
  },
  stripAvatarActive: {
    borderWidth: 2,
    borderColor: "#426B1F",
  },
  stripInitial: {
    color: "#426B1F",
    fontWeight: "700",
    fontSize: 16,
  },
  stripName: {
    marginTop: 6,
    fontSize: 12,
    color: "#000",
    textAlign: "center",
  },
  stripNameActive: {
    color: "#426B1F",
    fontWeight: "700",
  },
  emptyHistory: {
    width: "100%",
    textAlign: "center",
    color: colors.mono[700],
    paddingVertical: 20,
  },
});
