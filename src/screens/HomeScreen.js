import ReportCharacterBasic from "../../assets/report/character/basic.svg";
import colors from "../theme/legacyColors";
import {
  addBookToBookcase,
  deleteBookFromBookcase,
  fetchBookcase,
  fetchRecommendedBooks,
  updateBookcaseState,
} from "@apis/bookcaseApi";
import { searchFriends } from "@apis/friendApi";
import { fetchReadingLogs, saveReadingLog } from "@apis/reportApi";
import { fetchUserProfile, updateProfile } from "@apis/userApi";
import StarIcon from "@components/StarIcon";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const green = "#608540";
const lightGreen = "#fafaf5";
const mutedGreen = "#9fb37b";
const starGray = "#c6c6c6";
const placeLabelMap = {
  HOME: "집",
  CAFE: "카페",
  LIBRARY: "도서관",
  MOVING: "이동중",
};
const placeKeyMap = {
  집: "HOME",
  카페: "CAFE",
  도서관: "LIBRARY",
  이동중: "MOVING",
};

function Rating({ value, color = green, inactiveColor = starGray }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.ratingRow}>
      {stars.map((star) => {
        const diff = value - star;
        const isFull = diff >= 0;
        const isHalf = diff >= -0.5 && diff < 0;
        return (
          <View
            key={star}
            style={styles.starBox}
          >
            <StarIcon
              size={16}
              color={color}
              emptyColor={inactiveColor}
              variant={isFull ? "full" : isHalf ? "half" : "empty"}
            />
          </View>
        );
      })}
    </View>
  );
}

function RecommendationItem({
  title,
  author,
  tags,
  rating,
  cover,
  totalReview = 0,
  onToggleHeart,
  liked,
  onPress,
  heartDisabled = false,
}) {
  return (
    <Pressable
      style={styles.recCard}
      onPress={onPress}
    >
      <View style={styles.bookCover}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.coverImg}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.coverText}>{title.slice(0, 2)}</Text>
        )}
      </View>
      <View style={styles.bookMeta}>
        <Text style={styles.bookTitle}>{title}</Text>
        <Text style={styles.bookAuthor}>{author}</Text>
        <View style={styles.ratingLine}>
          <Rating
            value={rating}
            color={starGray}
            inactiveColor={starGray}
          />
          <Text style={styles.reviewCount}>({totalReview})</Text>
        </View>
      </View>
      <Pressable
        hitSlop={8}
        onPress={onToggleHeart}
        disabled={heartDisabled}
        style={styles.heartBtn}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={28}
          color={liked ? "#426b1f" : "#c6c6c6"}
        />
      </Pressable>
    </Pressable>
  );
}

function Calendar({
  year,
  month,
  onPrev,
  onNext,
  onYearChange,
  markedDates = new Set(),
  onDayPress,
  selectedDayKey,
  getDayBubbleStyle = () => null,
}) {
  const weeks = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0).getDate();
    const startIndex = (first.getDay() + 6) % 7; // monday start
    const cells = [];
    for (let i = 0; i < startIndex; i += 1) cells.push(null);
    for (let d = 1; d <= last; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const result = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [year, month]);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={styles.yearButton}
          onPress={() => onYearChange?.("open")}
          hitSlop={8}
        >
          <Text style={styles.yearText}>{year}</Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color="#191919"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={onPrev}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back-outline"
            size={28}
            color="#000"
          />
        </TouchableOpacity>
        <Text style={styles.calTitle}>{`${month}월`}</Text>
        <TouchableOpacity
          onPress={onNext}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={28}
            color="#000"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
          <Text
            key={w}
            style={styles.weekLabel}
          >
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week, idx) => (
        <View
          key={idx}
          style={styles.dayRow}
        >
          {week.map((day, dIdx) => (
            <View
              key={dIdx}
              style={styles.dayCell}
            >
              {day ? (
                (() => {
                  const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isMarked = markedDates?.has?.(dayKey);
                  const isSelected = selectedDayKey === dayKey;
                  const bubbleStyle = getDayBubbleStyle?.(dayKey);
                  return (
                    <Pressable
                      onPress={() => {
                        if (isMarked) {
                          onDayPress?.(dayKey);
                        }
                      }}
                      style={[
                        styles.dayBubble,
                        (isMarked || isSelected) && styles.dayBubbleMarked,
                        bubbleStyle,
                        isSelected && styles.dayBubbleSelected,
                      ]}
                      hitSlop={8}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          (isMarked || isSelected) && styles.dayTextHighlighted,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })()
              ) : (
                <Text style={styles.dayTextMuted}> </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const now = new Date();
const TAB_BAR_HEIGHT = 52;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [place, setPlace] = useState(null);
  const [bookSelectOpen, setBookSelectOpen] = useState(false);
  const [bookOptions, setBookOptions] = useState({ before: [], reading: [] });
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [readingLogs, setReadingLogs] = useState({});
  const [dayModalKey, setDayModalKey] = useState(null);
  const bookScrollRef = React.useRef(null);
  const [goalCount, setGoalCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalSetModalVisible, setGoalSetModalVisible] = useState(false);
  const [goalCandidate, setGoalCandidate] = useState(1);
  const [goalBarWidth, setGoalBarWidth] = useState(0);
  const [friendList, setFriendList] = useState([]);
  const [progressWidth, setProgressWidth] = useState(0);
  const selectedMonthKey = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month],
  );
  const formatDateKey = useCallback((dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);
  const formatTime = useCallback((dateObj) => {
    const h = String(dateObj.getHours()).padStart(2, "0");
    const m = String(dateObj.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }, []);
  const parseReadAt = useCallback((raw) => {
    if (!raw) return null;
    if (typeof raw === "number") return new Date(raw);
    if (raw instanceof Date) return raw;
    if (typeof raw === "string") {
      const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
      return new Date(hasTimezone ? raw : `${raw}Z`);
    }
    return null;
  }, []);
  const allBooks = useMemo(
    () => [...(bookOptions.before || []), ...(bookOptions.reading || [])],
    [bookOptions],
  );
  const markedDates = useMemo(
    () => new Set(Object.keys(readingLogs)),
    [readingLogs],
  );
  const maxDayCount = useMemo(() => {
    const counts = Object.values(readingLogs || {}).map((v) => v?.length || 0);
    if (counts.length === 0) return 1;
    return Math.max(...counts, 1);
  }, [readingLogs]);
  const mixColor = useCallback((from, to, ratio) => {
    const clamp = (v) => Math.min(255, Math.max(0, v));
    const parse = (hex) => {
      const norm = hex.replace("#", "");
      const int = parseInt(norm, 16);
      return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
      };
    };
    const f = parse(from);
    const t = parse(to);
    const r = clamp(Math.round(f.r + (t.r - f.r) * ratio));
    const g = clamp(Math.round(f.g + (t.g - f.g) * ratio));
    const b = clamp(Math.round(f.b + (t.b - f.b) * ratio));
    return `rgb(${r},${g},${b})`;
  }, []);
  const getDayBubbleStyle = useCallback(
    (dayKey) => {
      const count = readingLogs?.[dayKey]?.length || 0;
      if (!count) return null;
      const ratio = Math.min(1, count / maxDayCount);
      return {
        backgroundColor: mixColor("#d7eec4", "#608540", ratio),
        borderColor: mixColor("#9fb37b", "#355619", ratio),
        borderWidth: 1,
      };
    },
    [readingLogs, maxDayCount, mixColor],
  );
  const activeDayLogs = dayModalKey ? readingLogs[dayModalKey] || [] : [];
  const activeDayNumber = useMemo(() => {
    if (!dayModalKey) return "";
    const [, , day] = dayModalKey.split("-");
    return Number(day || 0);
  }, [dayModalKey]);
  const goalAchieved = useMemo(
    () => goalCount > 0 && readCount >= goalCount,
    [goalCount, readCount],
  );
  const filteredBooks = useMemo(() => {
    const merged = [
      ...(bookOptions.before || []),
      ...(bookOptions.reading || []),
    ];
    const q = bookSearch.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((b) => (b.title || "").toLowerCase().includes(q));
  }, [bookOptions, bookSearch]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const yearOptions = useMemo(() => {
    const start = Math.max(currentYear, year);
    return Array.from({ length: 4 }, (_, idx) => start - idx);
  }, [currentYear, year]);

  const prev = () =>
    setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1));
  const next = () =>
    setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1));

  const friends =
    friendList.length > 0
      ? friendList.map((f) => ({
          name: f.nickname || "닉네임",
          avatar: f.profileImageUrl || f.profileUrl || null,
        }))
      : [
          { name: "닉네임", color: "#f4d7d9" },
          { name: "닉네임", color: "#d7eec4" },
          { name: "닉네임", color: "#d7eec4" },
          { name: "닉네임", color: "#d7eec4" },
          { name: "닉네임", color: "#d7eec4" },
        ];

  const [recs, setRecs] = useState([]);
  const [nickname, setNickname] = useState("");
  const isFocused = useIsFocused();
  const [recoLoading, setRecoLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [heartBusyIds, setHeartBusyIds] = useState(new Set());
  const recoOpacity = useRef(new Animated.Value(1)).current;
  const [recoDetail, setRecoDetail] = useState(null);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const [bannerText, setBannerText] = useState("");
  const bannerTimer = useRef(null);
  const getCompletionKey = useCallback((book) => {
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
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    return { key: `${y}-${m}`, year: y, month: Number(m) };
  }, []);

  const showBanner = useCallback(
    (text) => {
      if (!text) return;
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      setBannerText(text);
      bannerOpacity.setValue(0);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      bannerTimer.current = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 4000);
    },
    [bannerOpacity],
  );

  const handleToggleHeart = useCallback(
    async (book) => {
      const bookId = book?.bookId || book?.id;
      if (!bookId || heartBusyIds.has(bookId)) return;
      setHeartBusyIds((prev) => {
        const next = new Set(prev);
        next.add(bookId);
        return next;
      });
      const alreadyLiked = favoriteIds.has(bookId);
      try {
        if (alreadyLiked) {
          await deleteBookFromBookcase(bookId);
        } else {
          await addBookToBookcase(bookId, "BEFORE");
        }
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (alreadyLiked) next.delete(bookId);
          else next.add(bookId);
          return next;
        });
        showBanner(
          alreadyLiked ? "책을 책장에서 뺐어요" : "책을 책장에 담았어요",
        );
      } catch (e) {
        console.warn("책장 토글 실패:", e.response?.data || e.message);
        showBanner(
          alreadyLiked
            ? "책을 책장에서 빼는 데 실패했어요"
            : "책을 책장에 담는 데 실패했어요",
        );
      } finally {
        setHeartBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(bookId);
          return next;
        });
      }
    },
    [favoriteIds, heartBusyIds, showBanner],
  );

  const loadRecommendations = useCallback(async () => {
    setRecoLoading(true);
    Animated.timing(recoOpacity, {
      toValue: 0.2,
      duration: 150,
      useNativeDriver: true,
    }).start();
    try {
      const [reco, profile, bookcase] = await Promise.all([
        fetchRecommendedBooks(),
        fetchUserProfile().catch(() => null),
        fetchBookcase().catch(() => ({})),
      ]);

      const preferred = profile?.preferredCategories || [];
      const goalCountNumber = Number(profile?.goalScore) || 0;
      setNickname(profile?.nickname || "");
      setGoalCount(goalCountNumber);
      setGoalCandidate(goalCountNumber || 1);
      const ownedIds = new Set(
        [
          ...(bookcase?.before || []),
          ...(bookcase?.reading || []),
          ...(bookcase?.after || []),
        ]
          .map((b) => b.id || b.bookId)
          .filter(Boolean),
      );

      const filtered = (Array.isArray(reco) ? reco : []).filter((b) => {
        const inCategory =
          preferred.length === 0 || preferred.includes(b.categoryName);
        const notOwned = !ownedIds.has(b.bookId || b.id);
        return inCategory && notOwned;
      });

      // 새로고침 시에도 구성이 바뀌도록 섞어서 상위 2개만 사용
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      setRecs(shuffled.slice(0, 2));
    } catch (e) {
      console.warn("추천 불러오기 실패:", e.response?.data || e.message);
    } finally {
      setRecoLoading(false);
      Animated.timing(recoOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadRecommendations();
    }
  }, [isFocused, loadRecommendations]);

  useEffect(
    () => () => {
      if (bannerTimer.current) {
        clearTimeout(bannerTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isFocused) return;
    setReadingLogs({});
    setDayModalKey(null);
    let cancelled = false;
    const loadLogs = async () => {
      try {
        const list = await fetchReadingLogs({ year, month });
        if (cancelled) return;
        const grouped = {};
        for (const item of list) {
          const dt = parseReadAt(item?.readAt);
          if (!dt || Number.isNaN(dt.getTime())) continue;
          const key = formatDateKey(dt);
          const entry = {
            id: `${item.readAt}-${item.title || "book"}`,
            title: item.title || "제목 없음",
            cover: item.cover || null,
            place:
              placeLabelMap[item.readingPlace] || item.readingPlace || "이동중",
            time: formatTime(dt),
          };
          grouped[key] = grouped[key] ? [...grouped[key], entry] : [entry];
        }
        setReadingLogs(grouped);
      } catch (e) {
        console.warn("독서 기록 불러오기 실패:", e.response?.data || e.message);
      }
    };
    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [isFocused, year, month, formatDateKey, formatTime, parseReadAt]);

  useEffect(() => {
    if (!isFocused) return;
    setReadCount(0);
    let cancelled = false;
    const loadCompletionCount = async () => {
      try {
        const bookcase = await fetchBookcase();
        if (cancelled) return;
        const after = bookcase?.after || bookcase?.AFTER || [];
        const count = after.filter(
          (b) => getCompletionKey(b)?.key === selectedMonthKey,
        ).length;
        setReadCount(count);
      } catch (e) {
        console.warn(
          "완독 카운트 불러오기 실패:",
          e.response?.data || e.message,
        );
        setReadCount(0);
      }
    };
    loadCompletionCount();
    return () => {
      cancelled = true;
    };
  }, [isFocused, year, month, getCompletionKey, selectedMonthKey]);

  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    const loadFriends = async () => {
      try {
        const res = await searchFriends("");
        if (cancelled) return;
        const onlyFriends = (Array.isArray(res) ? res : []).filter(
          (f) => f.relationStatus === "FRIENDS",
        );
        setFriendList(onlyFriends.slice(0, 6));
      } catch (e) {
        console.warn("친구 목록 불러오기 실패:", e.response?.data || e.message);
        if (!cancelled) setFriendList([]);
      }
    };
    loadFriends();
    return () => {
      cancelled = true;
    };
  }, [isFocused]);

  const maxGoal = 30;
  const handleSize = 44;
  const handleSetGoalByX = (x) => {
    if (!goalBarWidth) return;
    const ratio = Math.min(1, Math.max(0, x / goalBarWidth));
    const val = Math.max(1, Math.round(ratio * maxGoal));
    setGoalCandidate(val);
  };

  const saveGoal = async () => {
    try {
      await updateProfile({ goalScore: goalCandidate });
      setGoalCount(goalCandidate);
      setGoalSetModalVisible(false);
      showBanner("이번 달 목표를 설정했어요");
    } catch (e) {
      console.warn("목표 설정 실패:", e.response?.data || e.message);
      showBanner("목표 설정에 실패했어요");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>modam</Text>
        </View>

        <View style={styles.friendsStrip}>
          {friends.map((f, idx) => (
            <View
              key={idx}
              style={styles.friendItem}
            >
              {f.avatar ? (
                <Image
                  source={{ uri: f.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: f.color || "#d7eec4" },
                  ]}
                >
                  <Text style={styles.avatarInitial}>
                    {f.name?.slice(0, 1) || "친"}
                  </Text>
                </View>
              )}
              <Text
                style={[styles.avatarName, idx === 0 && styles.avatarNameBold]}
              >
                {f.name}
              </Text>
            </View>
          ))}
          <Pressable
            style={styles.addCircle}
            hitSlop={6}
            onPress={() => navigation?.navigate("FriendList")}
          >
            <Text style={styles.addPlus}>＋</Text>
          </Pressable>
        </View>

        {(() => {
          const rawRatio = goalCount > 0 ? readCount / goalCount : 0;
          const percent =
            goalCount > 0 ? Math.min(100, Math.round(rawRatio * 100)) : 0;
          const fillRatio = Math.min(1, Math.max(0, rawRatio));
          const fillWidth = fillRatio * 100;
          const markerLeftPx = Math.min(
            progressWidth,
            Math.max(0, fillRatio * progressWidth),
          );
          const isCurrentMonth = year === currentYear && month === currentMonth;
          return (
            <Pressable
              onPress={() => {
                if (goalCount > 0) setGoalModalVisible(true);
              }}
              style={styles.progressCard}
            >
              <View style={styles.progressHeader}>
                <Text style={styles.progressPercent}>{`${percent}%`}</Text>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={["#e5e5e5", "#e5e5e5", "#999"]}
                    locations={[0, 0.5385, 0.8846]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                  />
                  <View
                    style={[styles.progressFill, { width: `${fillWidth}%` }]}
                  />
                  <View
                    style={[styles.progressIndicator, { left: markerLeftPx }]}
                  >
                    <ReportCharacterBasic
                      width={36}
                      height={34}
                    />
                  </View>
                  <View
                    style={styles.progressShadow}
                    pointerEvents="none"
                  />
                </View>
              </View>
              <View style={styles.goalRow}>
                <View style={styles.goalLeft}>
                  <Svg
                    width={15}
                    height={17}
                    viewBox="0 0 15 17"
                    fill="none"
                  >
                    <Path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15 12.6096C14.9989 12.6514 14.9949 12.6931 14.988 12.7343C15.0061 12.829 15.0033 12.9265 14.98 13.0199C14.9567 13.1134 14.9133 13.2004 14.853 13.2748C14.7927 13.3492 14.717 13.4091 14.6313 13.4503C14.5456 13.4914 14.4519 13.5128 14.3571 13.5128H2.35714C2.21644 13.5128 2.07712 13.541 1.94712 13.5958C1.81713 13.6505 1.69902 13.7308 1.59953 13.832C1.50004 13.9332 1.42112 14.0533 1.36727 14.1855C1.31343 14.3178 1.28571 14.4595 1.28571 14.6026C1.28571 14.7457 1.31343 14.8874 1.36727 15.0196C1.42112 15.1518 1.50004 15.2719 1.59953 15.3731C1.69902 15.4743 1.81713 15.5546 1.94712 15.6094C2.07712 15.6641 2.21644 15.6923 2.35714 15.6923H14.3571C14.5276 15.6923 14.6912 15.7612 14.8117 15.8838C14.9323 16.0064 15 16.1727 15 16.3462C15 16.5196 14.9323 16.6859 14.8117 16.8085C14.6912 16.9311 14.5276 17 14.3571 17H2.35714C1.73199 17 1.13244 16.7474 0.690391 16.2978C0.248341 15.8482 0 15.2384 0 14.6026V2.39744C0 1.7616 0.248341 1.1518 0.690391 0.702193C1.13244 0.252586 1.73199 0 2.35714 0H13.8429C14.4823 0 15 0.526564 15 1.17692V12.6096ZM4.92857 3.48718C4.75808 3.48718 4.59456 3.55607 4.474 3.67869C4.35344 3.80131 4.28571 3.96761 4.28571 4.14103C4.28571 4.31444 4.35344 4.48074 4.474 4.60336C4.59456 4.72598 4.75808 4.79487 4.92857 4.79487H10.0714C10.2419 4.79487 10.4054 4.72598 10.526 4.60336C10.6466 4.48074 10.7143 4.31444 10.7143 4.14103C10.7143 3.96761 10.6466 3.80131 10.526 3.67869C10.4054 3.55607 10.2419 3.48718 10.0714 3.48718H4.92857Z"
                      fill="black"
                    />
                  </Svg>
                  <Text
                    style={styles.goalLabel}
                  >{`${isCurrentMonth ? "이번달" : `${month}월`} ${readCount}권을 읽었어요`}</Text>
                </View>
                <Text style={styles.goalTarget}>
                  {goalCount > 0 ? `목표 ${goalCount}권` : "목표 없음"}
                </Text>
              </View>
            </Pressable>
          );
        })()}

        <Calendar
          year={year}
          month={month}
          onPrev={prev}
          onNext={next}
          markedDates={markedDates}
          selectedDayKey={dayModalKey}
          getDayBubbleStyle={getDayBubbleStyle}
          onDayPress={(key) => {
            if (!key) return;
            const logs = readingLogs[key] || [];
            if (logs.length === 0) return;
            setDayModalKey(key);
          }}
          onYearChange={(val) => {
            if (val === "open") {
              setYearPickerOpen(true);
              return;
            }
            setYear(val);
          }}
        />

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                {nickname
                  ? `${nickname}님께 추천하는 책이에요`
                  : "추천하는 책이에요"}
              </Text>
              <Text style={styles.sectionHint}>
                클릭하면 독서 노트를 볼 수 있어요
              </Text>
            </View>
            <View style={styles.sectionActions}>
              <Pressable
                style={styles.iconButton}
                hitSlop={8}
                onPress={loadRecommendations}
                disabled={recoLoading}
              >
                <Ionicons
                  name="refresh"
                  size={28}
                  color="#7a7a7a"
                />
              </Pressable>
            </View>
          </View>
          <Animated.View style={[styles.recList, { opacity: recoOpacity }]}>
            {recs.map((book, idx) => {
              const bookId = book.bookId || book.id || idx;
              const liked = favoriteIds.has(bookId);
              return (
                <RecommendationItem
                  key={bookId}
                  title={book.title}
                  author={`${book.author || ""}${book.publisher ? ` / ${book.publisher}` : ""}`}
                  rating={book.rate || 0}
                  totalReview={book.totalReview || 0}
                  tags={[book.categoryName || book.publisher || "추천"]}
                  cover={book.cover}
                  liked={liked}
                  onToggleHeart={() => handleToggleHeart(book)}
                  heartDisabled={heartBusyIds.has(bookId)}
                  onPress={() => setRecoDetail(book)}
                />
              );
            })}
          </Animated.View>
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}
        onPress={() => setAddModalOpen(true)}
        hitSlop={6}
      >
        <Ionicons
          name="add"
          size={24}
          color="#fff"
        />
      </Pressable>

      <Modal
        visible={yearPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setYearPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.yearSheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>날짜</Text>
                </View>
                <View style={styles.yearList}>
                  {yearOptions.map((y) => (
                    <Pressable
                      key={y}
                      style={styles.yearRowItem}
                      onPress={() => {
                        setYear(y);
                        setYearPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          y === year && styles.yearOptionTextActive,
                        ]}
                      >
                        {`${y}년`}
                      </Text>
                      {y === year ? (
                        <Text style={styles.yearCheck}>✓</Text>
                      ) : (
                        <View style={styles.yearCheckPlaceholder} />
                      )}
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={styles.sheetClose}
                  onPress={() => setYearPickerOpen(false)}
                >
                  <Text style={styles.sheetCloseText}>닫기</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={addModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAddModalOpen(false)}>
          <View style={styles.addBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.addSheet}>
                <Text style={styles.addTitle}>독서 장소를 선택해주세요</Text>
                <View style={styles.addGrid}>
                  {[
                    { label: "집" },
                    { label: "카페" },
                    { label: "이동중" },
                    { label: "도서관" },
                  ].map((opt) => (
                    <Pressable
                      key={opt.label}
                      style={styles.addOption}
                      onPress={() => {
                        setPlace(opt.label);
                        setAddModalOpen(false);
                        setBookSelectOpen(true);
                        setSelectedBookId(null);
                        setLoadingBooks(true);
                        fetchBookcase()
                          .then((res) => {
                            setBookOptions({
                              before: res.before || res.BEFORE || [],
                              reading: res.reading || res.READING || [],
                            });
                          })
                          .catch((e) =>
                            console.warn(
                              "책장 불러오기 실패:",
                              e.response?.data || e.message,
                            ),
                          )
                          .finally(() => setLoadingBooks(false));
                      }}
                    >
                      <View style={styles.addThumbPlaceholder} />
                      <Text style={styles.addOptionLabel}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={bookSelectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBookSelectOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBookSelectOpen(false)}>
          <View style={styles.addBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.addSheet, { gap: 20 }]}>
                <Text style={styles.addTitle}>읽을 책을 선택해주세요</Text>
                <View style={styles.bookWrap}>
                  <View style={styles.searchRow}>
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color="#8A8A8A"
                    />
                    <TextInput
                      placeholder="책장의 책을 검색해보세요"
                      value={bookSearch}
                      onChangeText={setBookSearch}
                      style={styles.bookSearchInput}
                      placeholderTextColor="#B1B1B1"
                    />
                  </View>
                  <View style={styles.carouselRow}>
                    <TouchableOpacity
                      onPress={() => {
                        bookScrollRef.current?.scrollTo({
                          x: 0,
                          animated: true,
                        });
                      }}
                      hitSlop={10}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={26}
                        color="#000"
                      />
                    </TouchableOpacity>
                    <ScrollView
                      ref={bookScrollRef}
                      horizontal
                      style={{ flex: 1 }}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.bookRow}
                    >
                      {loadingBooks && (
                        <Text style={styles.bookEmpty}>불러오는 중...</Text>
                      )}
                      {!loadingBooks && filteredBooks.length === 0 && (
                        <Text style={styles.bookEmpty}>책이 없습니다</Text>
                      )}
                      {filteredBooks.map((b, idx) => {
                        const baseId = b.id || b.bookId || b.isbn || "book";
                        const key = `${baseId}-${idx}`;
                        return (
                          <Pressable
                            key={key}
                            onPress={() => setSelectedBookId(b.id || b.bookId)}
                            style={[
                              styles.coverBox,
                              selectedBookId === (b.id || b.bookId) &&
                                styles.coverBoxActive,
                            ]}
                          >
                            <View style={styles.coverThumb}>
                              {b.cover ? (
                                <Image
                                  source={{ uri: b.cover }}
                                  style={styles.coverImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={styles.coverPlaceholder}>
                                  {b.title?.slice(0, 2) || "책"}
                                </Text>
                              )}
                            </View>
                            <Text
                              numberOfLines={1}
                              style={styles.coverLabel}
                            >
                              {b.title}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity
                      onPress={() => {
                        bookScrollRef.current?.scrollToEnd({ animated: true });
                      }}
                      hitSlop={10}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={26}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Pressable
                  disabled={!selectedBookId}
                  style={[
                    styles.startBtn,
                    !selectedBookId && { backgroundColor: "#9fb37b" },
                  ]}
                  onPress={async () => {
                    if (!selectedBookId) return;
                    const now = new Date();
                    const key = formatDateKey(now);
                    const book =
                      allBooks.find(
                        (b) =>
                          String(b.id || b.bookId) === String(selectedBookId),
                      ) || {};
                    const entry = {
                      id: `${selectedBookId}-${Date.now()}`,
                      title: book.title || "제목 없음",
                      cover: book.cover || book.coverUri || null,
                      place: place || "이동중",
                      time: formatTime(now),
                    };
                    try {
                      const placeCode = placeKeyMap[place] || "MOVING";
                      const chosen =
                        allBooks.find(
                          (b) =>
                            String(b.id || b.bookId) === String(selectedBookId),
                        ) || {};

                      // 백엔드에서 READING 상태만 허용하는 경우가 있어 상태를 먼저 맞춰줍니다.
                      const stateRaw =
                        chosen.state || chosen.status || chosen.bookStatus;
                      const isReadingState =
                        stateRaw === "READING" ||
                        stateRaw === "읽는중" ||
                        stateRaw === "읽는 중";
                      if (!isReadingState) {
                        await updateBookcaseState(
                          Number(selectedBookId),
                          "READING",
                        );
                      }

                      await saveReadingLog({
                        bookId: Number(selectedBookId),
                        readingPlace: placeCode,
                      });
                      setReadingLogs((prev) => {
                        const next = { ...prev };
                        const list = next[key] ? [...next[key]] : [];
                        list.push(entry);
                        next[key] = list;
                        return next;
                      });
                      // 서버 시간을 기준으로 보정
                      try {
                        const refreshed = await fetchReadingLogs({
                          year,
                          month,
                        });
                        const grouped = {};
                        for (const item of refreshed) {
                          const dt = parseReadAt(item?.readAt);
                          if (!dt || Number.isNaN(dt.getTime())) continue;
                          const k = formatDateKey(dt);
                          const e = {
                            id: `${item.readAt}-${item.title || "book"}`,
                            title: item.title || "제목 없음",
                            cover: item.cover || null,
                            place:
                              placeLabelMap[item.readingPlace] ||
                              item.readingPlace ||
                              "이동중",
                            time: formatTime(dt),
                          };
                          grouped[k] = grouped[k] ? [...grouped[k], e] : [e];
                        }
                        setReadingLogs(grouped);
                      } catch (err) {
                        console.warn(
                          "독서 기록 재조회 실패:",
                          err.response?.data || err.message,
                        );
                      }
                      showBanner("독서 기록을 저장했어요");
                    } catch (e) {
                      const code = e.response?.data?.error?.code;
                      console.warn(
                        "독서 기록 저장 실패:",
                        e.response?.data || e.message,
                      );
                      if (code === "4091") {
                        showBanner("책장에 담긴 책만 기록할 수 있어요");
                      } else {
                        showBanner("독서 기록 저장에 실패했어요");
                      }
                    } finally {
                      setBookSelectOpen(false);
                      setSelectedBookId(null);
                    }
                  }}
                >
                  <Text style={styles.startBtnText}>독서 시작</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!dayModalKey}
        transparent
        animationType="fade"
        onRequestClose={() => setDayModalKey(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDayModalKey(null)}>
          <View style={styles.dayModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.daySheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.daySummaryText}>
                  {activeDayNumber
                    ? `${activeDayNumber}일에는 책을 ${activeDayLogs.length}번 읽었어요!`
                    : "읽은 기록이 없어요"}
                </Text>
                <View style={styles.dayLogList}>
                  {activeDayLogs.length === 0 ? (
                    <Text style={styles.dayEmptyText}>
                      기록을 추가하려면 달력에서 날짜를 눌러주세요.
                    </Text>
                  ) : (
                    activeDayLogs.map((log) => (
                      <View
                        key={log.id}
                        style={styles.dayLogRow}
                      >
                        <View style={styles.dayLogThumb}>
                          {log.cover ? (
                            <Image
                              source={{ uri: log.cover }}
                              style={styles.dayLogThumbImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.dayLogThumbFallback}>
                              <Text style={styles.dayLogThumbText}>
                                {log.title?.slice(0, 2) || "책"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.dayLogMeta}>
                          <Text style={styles.dayLogTitle}>{log.title}</Text>
                          <View style={styles.dayLogSubRow}>
                            <Text style={styles.dayLogTime}>{log.time}</Text>
                            <View style={styles.dayLogChip}>
                              <Text style={styles.dayLogChipText}>
                                {log.place || "이동중"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGoalModalVisible(false)}>
          <View style={styles.goalModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.goalModalCard}>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>캐릭터</Text>
                </View>
                <View style={{ alignItems: "center", gap: 10 }}>
                  <Text style={styles.goalTitle}>
                    {goalAchieved ? "미션 완료" : "미션 실패"}
                  </Text>
                  <Text style={styles.goalTitle}>
                    {goalAchieved
                      ? "목표 권수를 달성했어요!"
                      : "목표 권수를 달성하지 못했어요.."}
                  </Text>
                  <Text style={styles.goalSubtitle}>
                    {goalAchieved
                      ? "다음달도 즐겁게 독서해볼까요?"
                      : "다음달은 더 즐겁게 독서해요!"}
                  </Text>
                </View>
                <Pressable
                  style={styles.goalButton}
                  onPress={() => {
                    setGoalModalVisible(false);
                    setGoalSetModalVisible(true);
                  }}
                >
                  <Text style={styles.goalButtonText}>
                    홈에서 새 목표 설정하기
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={goalSetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalSetModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGoalSetModalVisible(false)}>
          <View style={styles.goalSetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.goalSetCard}>
                <View style={styles.goalSetHeader}>
                  <Text style={styles.goalSetTitle}>
                    이번 달엔 몇권을 읽어볼까요?
                  </Text>
                </View>
                <View style={styles.goalSetSliderWrap}>
                  <Ionicons
                    name="book-outline"
                    size={26}
                    color="#355619"
                  />
                  <View
                    style={styles.goalSetBar}
                    onLayout={(e) =>
                      setGoalBarWidth(e.nativeEvent.layout.width)
                    }
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) =>
                      handleSetGoalByX(e.nativeEvent.locationX)
                    }
                    onResponderMove={(e) =>
                      handleSetGoalByX(e.nativeEvent.locationX)
                    }
                  >
                    <View style={styles.goalSetTrack} />
                    <View
                      style={[
                        styles.goalSetFill,
                        {
                          width: goalBarWidth
                            ? `${Math.min(
                                100,
                                Math.max(0, (goalCandidate / maxGoal) * 100),
                              )}%`
                            : 0,
                        },
                      ]}
                    />
                    {(() => {
                      const handleHalf = handleSize / 2;
                      const ratio = Math.min(
                        1,
                        Math.max(0, goalCandidate / maxGoal),
                      );
                      const left =
                        goalBarWidth > 0
                          ? Math.min(
                              goalBarWidth - handleSize,
                              Math.max(0, ratio * goalBarWidth - handleHalf),
                            )
                          : 0;
                      return (
                        <View
                          style={[
                            styles.goalSetHandle,
                            {
                              left,
                              width: handleSize,
                              height: handleSize,
                              borderRadius: handleHalf,
                            },
                          ]}
                        >
                          <Text style={styles.goalSetHandleText}>
                            {goalCandidate}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
                <Pressable
                  style={styles.goalSetButton}
                  onPress={saveGoal}
                >
                  <Text style={styles.goalSetButtonText}>목표 설정 완료</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!recoDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setRecoDetail(null)}
      >
        <TouchableWithoutFeedback onPress={() => setRecoDetail(null)}>
          <View style={styles.detailBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.detailCard}>
                <View style={styles.detailCloseRow}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setRecoDetail(null)}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color="#555"
                    />
                  </Pressable>
                </View>
                {recoDetail && (
                  <>
                    {(() => {
                      const detailTags = Array.isArray(recoDetail.userHashTag)
                        ? recoDetail.userHashTag
                        : Array.isArray(recoDetail.tags)
                          ? recoDetail.tags
                          : [recoDetail.categoryName || "추천"];
                      return (
                        <View style={styles.detailRow}>
                          <View style={styles.detailCover}>
                            {recoDetail.cover ? (
                              <Image
                                source={{ uri: recoDetail.cover }}
                                style={styles.detailCoverImg}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={styles.coverText}>
                                {recoDetail.title?.slice(0, 2) || "책"}
                              </Text>
                            )}
                          </View>
                          <View style={styles.detailMeta}>
                            {recoDetail.categoryName ? (
                              <View style={styles.detailChip}>
                                <Text style={styles.detailChipText}>
                                  {recoDetail.categoryName}
                                </Text>
                              </View>
                            ) : null}
                            <Text style={styles.detailTitle}>
                              {recoDetail.title}
                            </Text>
                            <Text style={styles.detailAuthor}>
                              {`${recoDetail.author || ""}${
                                recoDetail.publisher
                                  ? ` / ${recoDetail.publisher}`
                                  : ""
                              }`}
                            </Text>
                            <View style={styles.ratingLine}>
                              <Rating
                                value={recoDetail.rate || 0}
                                color={starGray}
                                inactiveColor={starGray}
                              />
                              <Text style={styles.reviewCount}>
                                ({recoDetail.totalReview || 0})
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })()}
                    <View style={styles.detailReviewSection}>
                      <Text style={styles.detailReviewTitle}>리뷰</Text>
                      {recoDetail.userComment || recoDetail.comment ? (
                        <>
                          <Text style={styles.detailReviewText}>
                            {recoDetail.userComment || recoDetail.comment}
                          </Text>
                          {Array.isArray(
                            recoDetail.userHashTag || recoDetail.tags,
                          ) && (
                            <View style={styles.tagRow}>
                              {(recoDetail.userHashTag || recoDetail.tags || [])
                                .slice(0, 3)
                                .map((tag, idx) => (
                                  <View
                                    key={`${tag}-${idx}`}
                                    style={styles.tagPill}
                                  >
                                    <Text style={styles.tagText}>{tag}</Text>
                                  </View>
                                ))}
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={styles.detailReviewEmpty}>
                          아직 리뷰가 없습니다.
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            opacity: bannerOpacity,
            transform: [
              {
                translateY: bannerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{bannerText}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  logo: { color: "#608540", fontSize: 16, fontWeight: "600" },
  friendsStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
    alignSelf: "center",
  },
  friendItem: { alignItems: "center", width: 49 },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 49, height: 49, borderRadius: 24.5 },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: colors.text },
  avatarName: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    width: 49,
  },
  avatarNameBold: { fontWeight: "700" },
  addCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3f5d2c",
  },
  addPlus: { color: "#fff", fontSize: 24, fontWeight: "700" },
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  progressHeader: { flexDirection: "column", gap: 4 },
  progressPercent: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  goalLabel: { fontSize: 14, fontWeight: "500", color: "#000" },
  goalTarget: { fontSize: 12, color: "#000" },
  progressTrack: {
    marginTop: 6,
    height: 12.04,
    width: 332,
    alignSelf: "center",
    borderRadius: 15,
    overflow: "visible",
    position: "relative",
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  progressFill: {
    height: "100%",
    backgroundColor: green,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 3, height: 0 },
  },
  progressIndicator: {
    position: "absolute",
    top: -12,
    width: 36,
    height: 34,
    transform: [{ translateX: -18 }],
    zIndex: 3,
  },
  progressShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 3, height: 0 },
    zIndex: 1,
    pointerEvents: "none",
  },
  goalModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  goalModalCard: {
    width: "100%",
    backgroundColor: "#fafaf5",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  goalBadge: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#d7eec4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#426b1f",
  },
  goalBadgeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  goalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  goalSubtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  goalButton: {
    marginTop: 4,
    backgroundColor: "#426b1f",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  goalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  goalSetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  goalSetCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b1b1b1",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
  },
  goalSetHeader: { alignItems: "center" },
  goalSetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#426b1f",
    alignSelf: "flex-start",
  },
  goalSetSliderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  goalSetBar: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    position: "relative",
  },
  goalSetTrack: {
    height: 8,
    borderRadius: 20,
    backgroundColor: "#c6c6c6",
    position: "absolute",
    left: 0,
    right: 0,
    top: 22,
  },
  goalSetFill: {
    height: 8,
    borderRadius: 20,
    backgroundColor: "#608540",
    position: "absolute",
    left: 0,
    top: 22,
  },
  goalSetHandle: {
    position: "absolute",
    top: 8,
    backgroundColor: "#426b1f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalSetHandleText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  goalSetButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: "#426b1f",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  goalSetButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
  },
  yearText: { fontSize: 16, fontWeight: "600", color: "#000" },
  yearButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 6,
    width: 328,
    alignSelf: "center",
  },
  calTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    width: 60,
    textAlign: "center",
  },
  calNav: { fontSize: 28, color: "#000", fontWeight: "600", padding: 4 },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: 328,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekLabel: {
    width: 28,
    textAlign: "center",
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: 328,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  dayCell: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBubble: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  dayBubbleMarked: {
    backgroundColor: "#d7eec4",
    borderWidth: 1,
    borderColor: "#608540",
  },
  dayBubbleSelected: {
    backgroundColor: "#608540",
  },
  dayText: { color: colors.text, fontWeight: "700", fontSize: 16 },
  dayTextHighlighted: { color: "#070b03" },
  dayTextSelected: { color: "#fff" },
  dayTextMuted: { color: "#d1d5db" },
  yearDropdown: {
    display: "none",
  },
  yearItem: { paddingVertical: 6, paddingHorizontal: 12 },
  yearItemText: { fontSize: 14, color: colors.text },
  section: { marginTop: 14, paddingHorizontal: 16 },
  sectionHead: { gap: 4, flexDirection: "row", alignItems: "center" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  sectionHint: { fontSize: 14, color: colors.text, marginTop: 2 },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  recList: { marginTop: 12, gap: 12 },
  recCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookCover: {
    width: 110,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverText: { fontWeight: "700", fontSize: 18, color: colors.text },
  bookMeta: { flex: 1, marginLeft: 12, gap: 8 },
  bookTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  bookAuthor: { fontSize: 14, color: colors.subtext },
  ratingRow: { flexDirection: "row", gap: 4 },
  starBox: { width: 20, alignItems: "center" },
  star: { fontSize: 16 },
  coverImg: { width: "100%", height: "100%", borderRadius: 6 },
  ratingLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewCount: { color: "#c6c6c6", fontSize: 14 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: {
    backgroundColor: lightGreen,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: { fontSize: 12, color: green, fontWeight: "700" },
  heartBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  detailBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  detailCard: {
    width: "100%",
    backgroundColor: "#fafaf5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#b1b1b1",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  detailCloseRow: {
    alignItems: "flex-end",
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailCover: {
    width: 120,
    height: 170,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  detailCoverImg: { width: "100%", height: "100%" },
  detailMeta: { flex: 1, gap: 10 },
  detailChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailChipText: { fontSize: 12, color: "#888" },
  detailTitle: { fontSize: 22, fontWeight: "800", color: "#355619" },
  detailAuthor: { fontSize: 13, fontWeight: "600", color: "#355619" },
  detailReviewSection: { marginTop: 16, gap: 8 },
  detailReviewTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  detailReviewText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  detailReviewEmpty: { fontSize: 14, color: "#888" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  dayModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  daySheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
    gap: 20,
  },
  yearSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e5e5",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  daySummaryText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  dayLogList: { gap: 14 },
  dayLogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  dayLogThumb: {
    width: 44,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  dayLogThumbImg: { width: "100%", height: "100%" },
  dayLogThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e5e5",
  },
  dayLogThumbText: { fontWeight: "700", color: "#426b1f" },
  dayLogMeta: { flex: 1, gap: 4 },
  dayLogTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  dayLogSubRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayLogTime: { fontSize: 16, color: "#000" },
  dayLogChip: {
    backgroundColor: green,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: "center",
  },
  dayLogChipText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  dayEmptyText: { fontSize: 14, color: "#666" },
  sheetTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  yearList: { paddingVertical: 8, gap: 14 },
  yearRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  yearOptionText: { fontSize: 16, color: colors.text },
  yearOptionTextActive: { color: green, fontWeight: "700" },
  yearCheck: { fontSize: 18, color: green, fontWeight: "700" },
  yearCheckPlaceholder: { width: 18 },
  sheetClose: { alignSelf: "center", marginTop: 10 },
  sheetCloseText: { fontSize: 18, fontWeight: "600", color: colors.text },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#426b1f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  addBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  addSheet: {
    width: "100%",
    backgroundColor: "#fafaf5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#b1b1b1",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  addGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  addOption: {
    width: "47%",
    alignItems: "center",
    gap: 12,
  },
  addThumbPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
    borderWidth: 1,
    borderColor: "#d7d7d7",
  },
  addOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#070b03",
  },
  bookWrap: { gap: 14 },
  bookSection: { gap: 8 },
  bookSectionTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  bookRow: { gap: 8, paddingVertical: 4, paddingHorizontal: 8 },
  coverBox: { width: 130, alignItems: "center", gap: 6 },
  coverBoxActive: { borderWidth: 2, borderColor: "#426b1f", borderRadius: 10 },
  coverThumb: {
    width: 130,
    height: 180,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverImage: { width: "100%", height: "100%" },
  coverTitle: { textAlign: "center", color: "#555", fontWeight: "600" },
  coverPlaceholder: { fontSize: 16, fontWeight: "700", color: "#949494" },
  coverLabel: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    width: 130,
  },
  bookEmpty: { color: "#8a8a8a", paddingVertical: 6, paddingHorizontal: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d7eec4",
  },
  bookSearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#426b1f",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#426b1f",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: "center",
  },
  toastText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
