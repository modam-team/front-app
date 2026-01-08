import { fetchReviewListByBookId } from "@apis/bookcaseApi";
import { fetchFriends } from "@apis/friendApi";
import { fetchReadingLogs } from "@apis/reportApi";
import { fetchUserProfile } from "@apis/userApi";
import Avatar from "@components/Avatar";
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
  Alert,
  Image,
  Modal,
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
const DEFAULT_THEME_COLOR = "#608540";
const placeLabelMap = {
  HOME: "집",
  CAFE: "카페",
  LIBRARY: "도서관",
  MOVING: "이동중",
};

const normalizeHexColor = (value) => {
  if (!value || typeof value !== "string") return null;
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  return null;
};

const darkenHex = (hex, amount = 0.2) => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const factor = Math.max(0, Math.min(1, 1 - amount));
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v * factor)))
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

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
  const [fallbackStrip, setFallbackStrip] = useState([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    if (friendsStrip && friendsStrip.length > 0) {
      setFallbackStrip(friendsStrip);
      return;
    }
    let active = true;
    const loadStrip = async () => {
      try {
        const [friendsRes, profile] = await Promise.all([
          fetchFriends().catch(() => []),
          fetchUserProfile().catch(() => null),
        ]);
        const fr = Array.isArray(friendsRes) ? friendsRes : [];
        const mappedFriends = fr
          .filter(
            (f) =>
              f.relationStatus === "FRIENDS" && !!f.userId && !!f.nickname,
          )
          .map((f) => ({
            id: f.userId,
            name: f.nickname,
            avatar: f.profileImageUrl || f.profileUrl || null,
            themeColor: f.themeColor || null,
            color: f.color,
            goalScore: f.goalScore,
          }));
        const goalCountNumber = Number(profile?.goalScore) || 0;
        const selfProfile = profile
          ? {
              id: profile?.userId,
              name: profile?.nickname || "",
              avatar: profile?.profileImageUrl || profile?.profileUrl || null,
              themeColor: profile?.themeColor || null,
              color: "#d7eec4",
              goalScore: goalCountNumber || 1,
              isSelf: true,
            }
          : { isSelf: true, name: "나", nickname: "나" };
        const list = [];
        const pushIf = (item) => {
          if (
            !item ||
            (!item.id && !item.userId && !item.name && !item.nickname)
          ) {
            return;
          }
          const id =
            item.id || item.userId || item.nickname || item.name || item.avatar;
          const exists = list.some(
            (f) =>
              f.id === id ||
              f.userId === id ||
              (id && (f.name === id || f.nickname === id)),
          );
          if (!exists) list.push(item);
        };
        pushIf(selfProfile);
        mappedFriends.forEach(pushIf);
        if (active) setFallbackStrip(list);
      } catch (e) {
        if (active) setFallbackStrip([]);
      }
    };
    loadStrip();
    return () => {
      active = false;
    };
  }, [friendsStrip]);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [dayModalKey, setDayModalKey] = useState(null);
  const [readingLogs, setReadingLogs] = useState({});
  const activeDayLogs = dayModalKey ? readingLogs[dayModalKey] || [] : [];
  const [history, setHistory] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const stripThemeColor = useMemo(() => {
    const source = (friendsStrip && friendsStrip.length > 0
      ? friendsStrip
      : fallbackStrip) || [];
    const match = source.find((s) => {
      const sid = s?.id || s?.userId;
      return sid != null && Number(sid) === friendId;
    });
    return match?.themeColor || match?.theme || null;
  }, [friendsStrip, fallbackStrip, friendId]);
  const themeColor =
    normalizeHexColor(friend?.themeColor || friend?.theme || stripThemeColor) ||
    DEFAULT_THEME_COLOR;
  const themeColorDark = darkenHex(themeColor, 0.25) || "#3f5d2c";

  const prev = () =>
    setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1));
  const next = () =>
    setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1));
  const parseReadAt = (raw) => {
    if (!raw) return null;
    if (typeof raw === "number") return new Date(raw);
    if (raw instanceof Date) return raw;
    if (typeof raw === "string") {
      const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
      return new Date(hasTimezone ? raw : `${raw}Z`);
    }
    return null;
  };
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
  const completionValue = (item) =>
    item?.status ||
    item?.state ||
    item?.readStatus ||
    item?.readingStatus ||
    item?.bookStatus;
  const isCompletedItem = (item) => {
    const raw = completionValue(item);
    if (raw) {
      const val = String(raw).toUpperCase();
      return ["AFTER", "FINISHED", "COMPLETED", "DONE", "READ_DONE"].includes(
        val,
      );
    }
    return !!(
      item?.endDate ||
      item?.finishedAt ||
      item?.finishedAtTime ||
      item?.readEndAt
    );
  };

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
        const hasCompletionHint = (list || []).some((item) => {
          return (
            completionValue(item) ||
            item?.endDate ||
            item?.finishedAt ||
            item?.finishedAtTime ||
            item?.readEndAt
          );
        });
        const filteredList = hasCompletionHint
          ? (list || []).filter(isCompletedItem)
          : list;
        const grouped = {};
        const uniqMap = new Map();
        (filteredList || []).forEach((item) => {
          const dt = parseReadAt(item.readAt || item.createdAt || item.date);
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
            avgRate:
              item.avgRate ||
              item.avgRating ||
              item.averageRating ||
              item.reviewAvg ||
              item.reviewAverage ||
              null,
            totalReview: item.totalReview || item.reviewCount || 0,
            time: `${String(dt.getHours()).padStart(2, "0")}:${String(
              dt.getMinutes(),
            ).padStart(2, "0")}`,
            place:
              placeLabelMap[item.readingPlace] ||
              item.readingPlace ||
              "이동중",
            bookId:
              item.bookId ||
              item.bookID ||
              item.book?.id ||
              item.id ||
              null,
          };
          grouped[key] = grouped[key] ? [...grouped[key], log] : [log];
          const uniqKey = String(
            log.bookId || item.isbn || item.isbn13 || log.title || log.id,
          );
          if (!uniqMap.has(uniqKey)) {
            uniqMap.set(uniqKey, {
              ...log,
              dayKey: key,
              sortDate: dt.getTime(),
            });
          }
        });
        setReadingLogs(grouped);
        // 최근 기록 카드용 플랫 리스트
        const uniqueHistory = Array.from(uniqMap.values()).sort(
          (a, b) => b.sortDate - a.sortDate,
        );
        setHistory(uniqueHistory);
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

  const openFriendNote = async (log) => {
    const bookIdRaw = log?.bookId;
    const bookId = Number(bookIdRaw);
    if (!bookId || Number.isNaN(bookId)) {
      Alert.alert("독서록을 찾을 수 없어요", "책 정보를 확인할 수 없습니다.");
      return;
    }
    setNoteLoading(true);
    setNoteVisible(true);
    try {
      const reviews = await fetchReviewListByBookId(bookId);
      const match = (reviews || []).find((r) => {
        const uid = r.userId || r.user?.userId || r.user?.id;
        return Number(uid) === friendId;
      });
      if (!match) {
        setNoteData({
          title: log?.title,
          cover: log?.cover,
          rating: 0,
          comment: "",
          hashtag: [],
        });
        return;
      }
      setNoteData({
        title: log?.title,
        cover: log?.cover,
        rating: match.rating ?? match.rate ?? 0,
        comment: match.comment ?? match.content ?? match.review ?? "",
        hashtag: normalizeHashtags(
          match.hashtag ||
            match.hashTag ||
            match.tags ||
            match.reviewTags ||
            match.reviewHashTag ||
            match.hashtags,
        ),
      });
    } catch (e) {
      console.warn("친구 독서록 조회 실패:", e.response?.data || e.message);
      setNoteData(null);
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.headerRow}>
            <Text style={[styles.logo, { color: themeColor }]}>modam</Text>
          </View>
        </View>

        {/* 상단 친구 프로필 스트립 (홈과 동일 배치) */}
        <View style={styles.friendsStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsStripRow}
          >
            {(() => {
            // strip을 한 번에 구성: 첫 번째는 내 프로필 고정, 나머지는 유니크하게
            const sourceBase =
              friendsStrip && friendsStrip.length > 0
                ? friendsStrip
                : fallbackStrip;
            const source =
              sourceBase && sourceBase.length > 0
                ? sourceBase
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
            const avatar =
              f.avatar ||
              f.profileImageUrl ||
              f.profileUrl ||
              f.image ||
              null;
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
                <Avatar
                  uri={avatar}
                  size={49}
                  style={[
                    styles.avatarImage,
                    active && { borderWidth: 2, borderColor: themeColor },
                  ]}
                />
                <Text
                  style={[
                    styles.avatarName,
                    active && { fontWeight: "700", color: themeColor },
                  ]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
          </ScrollView>
          <View style={styles.addWrapper}>
            <Pressable
              style={[
                styles.addCircle,
                { backgroundColor: themeColor, borderColor: themeColorDark },
              ]}
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
                      { backgroundColor: themeColor },
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
              themeColor={themeColor}
            />
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              {friend?.nickname || "닉네임"}님의 독서 히스토리
            </Text>
            <Text style={styles.historySub}>친구가 읽는 도서</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyRow}
          >
            {history.map((item) => {
              const rating =
                Number(item.avgRate ?? item.avgRating ?? item.rate ?? 0) || 0;
              const author =
                item.author ||
                (Array.isArray(item.authors)
                  ? item.authors.join(", ")
                  : item.publisher) ||
                "작가 미상";
              return (
                <Pressable
                  key={`${item.id}-${item.dayKey}`}
                  style={styles.bookCard}
                  onPress={() => {
                    if (!item.bookId) {
                      nav?.navigate?.("AddEntry", {
                        prefillQuery: item.title || "",
                      });
                      return;
                    }
                    nav?.navigate?.("AddEntry", {
                      prefillBook: {
                        bookId: item.bookId,
                        id: item.bookId,
                        title: item.title,
                        author: author,
                        cover: item.cover,
                        coverImage: item.cover,
                        thumbnail: item.cover,
                        categoryName: item.categoryName || item.category || null,
                      },
                    });
                  }}
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
                </Pressable>
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

      <Modal
        visible={noteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteVisible(false)}
      >
        <Pressable
          style={styles.noteOverlay}
          onPress={() => setNoteVisible(false)}
        >
          <Pressable
            style={styles.noteCard}
            onPress={() => {}}
          >
            <Text style={styles.noteTitle}>독서록</Text>
            {noteLoading && <Text style={styles.noteMeta}>불러오는 중...</Text>}
            {!noteLoading && noteData && (
              <>
                <Text style={styles.noteBookTitle}>{noteData.title}</Text>
                {noteData.comment ? (
                  <Text style={styles.noteComment}>{noteData.comment}</Text>
                ) : (
                  <Text style={styles.noteMeta}>
                    아직 공개된 독서록이 없어요.
                  </Text>
                )}
                {Array.isArray(noteData.hashtag) &&
                  noteData.hashtag.length > 0 && (
                    <View style={styles.noteTagRow}>
                      {noteData.hashtag.slice(0, 3).map((tag) => (
                        <View
                          key={tag}
                          style={styles.noteTagChip}
                        >
                          <Text style={styles.noteTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
              </>
            )}
            {!noteLoading && !noteData && (
              <Text style={styles.noteMeta}>독서록을 불러오지 못했어요.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
  friendsStripWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  friendsStripRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingRight: 12,
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
  noteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noteCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  noteTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  noteBookTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  noteComment: { fontSize: 14, color: "#333", lineHeight: 20 },
  noteMeta: { fontSize: 13, color: "#777" },
  noteTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  noteTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F6EC",
    borderWidth: 1,
    borderColor: "#7E9F61",
  },
  noteTagText: { fontSize: 12, color: "#426B1F" },
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
