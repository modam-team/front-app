import {
  addBookToBookcase,
  deleteBookFromBookcase,
  fetchBookcase,
  fetchRecommendedBooks,
  fetchReviewListByBookId,
  updateBookcaseState,
} from "@apis/bookcaseApi";
import { searchFriends } from "@apis/friendApi";
import {
  fetchMonthlyReport,
  fetchReadingLogs,
  saveReadingLog,
} from "@apis/reportApi";
import { fetchUserProfile, updateProfile } from "@apis/userApi";
import ProgressBarCharacter from "@assets/progress-bar-img.png";
import Button from "@components/Button";
import DayLogsBottomSheet from "@components/DayLogsBottomSheet";
import GoalCountSlider from "@components/GoalCountSlider";
import MonthlyCalendar from "@components/MonthlyCalendar";
import ReadingProgressBar from "@components/ReadingProgressBar";
import ReadingStartModal from "@components/ReadingStartModal";
import RecommendationDetailModal from "@components/RecommendationDetailModal";
import RecommendationSectionCard from "@components/RecommendationSectionCard";
import YearMonthPicker from "@components/YearMonthPicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const PENDING_GOAL_EDIT_KEY = "pendingGoalEdit"; // 이번 달 목표 설정 했는지 체크하는 용

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

const now = new Date();
const TAB_BAR_HEIGHT = 52;

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const [readingLogs, setReadingLogs] = useState({});
  const [dayModalKey, setDayModalKey] = useState(null);
  const [goalCount, setGoalCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [goalCandidate, setGoalCandidate] = useState(1);
  const [friendList, setFriendList] = useState([]);

  const [readingStartOpen, setReadingStartOpen] = useState(false);

  const [themeColor, setThemeColor] = useState(null);

  const openedGoalEditorRef = useRef(false);

  // 토스트 관련
  const [toast, setToast] = useState({
    visible: false,
    text: "",
    tone: "primary",
  });

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  const showToast = useCallback(
    (text, tone = "primary") => {
      if (!text) return;
      if (toastTimer.current) clearTimeout(toastTimer.current);

      setToast({ visible: true, text, tone });

      toastOpacity.stopAnimation();
      toastOpacity.setValue(0);

      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setToast((prev) => ({ ...prev, visible: false }));
        });
      }, 1800);
    },
    [toastOpacity],
  );

  // 테스트용 이번 달 방문 여부 초기화
  const DEV = __DEV__;

  const resetGoalModalDebug = async () => {
    await AsyncStorage.multiRemove([
      "lastSeenMonthKey",
      "shownResultForMonthKey",
      "pendingResultForMonthKey",
    ]);

    // 리셋 후 바로 지난달 결과 화면 다시 열기 (테스트 편하게)
    const prevMonthKey = getPrevMonthKey();
    const [py, pm] = prevMonthKey.split("-");

    const report = await fetchMonthlyReport({
      year: Number(py),
      month: Number(pm),
    }).catch(() => null);

    const profile = await fetchUserProfile().catch(() => null);
    const prevGoal = Number(profile?.goalScore) || 0;

    const bookcase = await fetchBookcase().catch(() => ({}));
    const after = bookcase?.after || bookcase?.AFTER || [];
    const prevRead = after.filter(
      (b) => getCompletionKey(b)?.key === prevMonthKey,
    ).length;

    const achieved = prevGoal > 0 && prevRead >= prevGoal;

    navigation.navigate("GoalResult", {
      achieved,
      summary: report?.summary ?? null,
      monthKey: prevMonthKey,
      prevGoal,
      prevRead,
      forceSetGoal: true,
    });
  };

  const getMonthKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const THIS_MONTH_KEY = useMemo(() => getMonthKey(new Date()), []); // 이번달 독서 현황을 보여주는 용도

  const getPrevMonthKey = (date = new Date()) => {
    const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return getMonthKey(d);
  };

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

  const activeDayLogs = dayModalKey ? readingLogs[dayModalKey] || [] : [];
  const activeDayNumber = useMemo(() => {
    if (!dayModalKey) return "";
    const [, , day] = dayModalKey.split("-");
    return Number(day || 0);
  }, [dayModalKey]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const prev = () =>
    setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1));
  const next = () =>
    setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1));

  // 독서 현황 바 애니메이션 관련
  const didAnimateOnceRef = useRef(false);
  const [progressAnimateKey, setProgressAnimateKey] = useState(0);

  useEffect(() => {
    if (!isFocused) return;

    // 앱 켜고 홈 첫 진입만
    if (!didAnimateOnceRef.current) {
      didAnimateOnceRef.current = true;
      setProgressAnimateKey((k) => k + 1);
    }
  }, [isFocused]);

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

      setHeartBusyIds((prev) => new Set(prev).add(bookId));

      const alreadyLiked = favoriteIds.has(bookId);

      try {
        if (alreadyLiked) {
          await deleteBookFromBookcase(bookId);

          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(bookId);
            return next;
          });

          showToast("책을 책장에서 뺐어요", "primary");
        } else {
          await addBookToBookcase(bookId, "BEFORE");

          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.add(bookId);
            return next;
          });

          showToast("책을 책장에 담았어요", "primary");
        }
      } catch (e) {
        showToast("더이상 새로고침 할 수 없어요", "error");
      } finally {
        setHeartBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(bookId);
          return next;
        });
      }
    },
    [favoriteIds, heartBusyIds, showToast, loadRecommendations],
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
      setThemeColor(profile?.themeColor ?? null);
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
      // setRecs(shuffled.slice(0, 2));

      // !!임시!! 더미 키워드 정의
      const DUMMY_KEYWORDS = ["힐링", "현실공감", "몰입감", "문장력", "감동"];

      // !!임시!! 상위 2권에 더미 키워드 주입
      const withDummy = shuffled.slice(0, 2).map((b) => ({
        ...b,
        topKeywords: DUMMY_KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3),
      }));

      // !!임시!! 최종 세팅
      setRecs(withDummy);
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

  // 포커스 될 때 목표 에디터 자동 오픈
  useEffect(() => {
    if (!isFocused) return;

    const shouldOpen = route?.params?.openGoalEditor;
    if (!shouldOpen) return;

    openedGoalEditorRef.current = true; // 이번 포커스는 GoalResult 체크 스킵용
    AsyncStorage.setItem(PENDING_GOAL_EDIT_KEY, "1");
    setIsEditingGoal(true);

    // 한번 열었으면 파라미터 제거(재진입/리렌더 때 계속 열리는 거 방지)
    navigation.setParams({ openGoalEditor: undefined });
  }, [isFocused, route?.params?.openGoalEditor, navigation]);

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

  // 날짜별 카운트
  const dateCounts = useMemo(() => {
    const out = {};
    for (const [dayKey, logs] of Object.entries(readingLogs || {})) {
      out[dayKey] = Array.isArray(logs) ? logs.length : 0;
    }
    return out;
  }, [readingLogs]);

  useEffect(() => {
    if (!isFocused) return;

    // setReadCount(0);
    let cancelled = false;
    const loadCompletionCount = async () => {
      try {
        const bookcase = await fetchBookcase();
        if (cancelled) return;
        const after = bookcase?.after || bookcase?.AFTER || [];
        const count = after.filter(
          (b) => getCompletionKey(b)?.key === THIS_MONTH_KEY,
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
  }, [isFocused, getCompletionKey, THIS_MONTH_KEY]);

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

  // 이번 달 첫 방문 체크 및 지난 달 결과 모달
  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    const checkAndOpenPrevMonthResult = async () => {
      const thisMonthKey = getMonthKey();
      const prevMonthKey = getPrevMonthKey();

      // 이번 진입에서 GoalEditor를 연 상태면 GoalResult로 되돌리지 말기
      if (openedGoalEditorRef.current || isEditingGoal) {
        await AsyncStorage.setItem("lastSeenMonthKey", thisMonthKey);
        return;
      }

      const lastSeenMonthKey = await AsyncStorage.getItem("lastSeenMonthKey");
      const shownResultForMonthKey = await AsyncStorage.getItem(
        "shownResultForMonthKey",
      );
      const pendingResultForMonthKey = await AsyncStorage.getItem(
        "pendingResultForMonthKey",
      );

      const pendingGoalEdit = await AsyncStorage.getItem(PENDING_GOAL_EDIT_KEY);

      // pending이 남아있으면 (=아직 목표 설정 완료로 확정 안 된 상태)
      // 첫 방문 여부 상관없이 GoalResult 다시 띄우기
      if (
        (pendingResultForMonthKey === prevMonthKey ||
          pendingGoalEdit === "1") &&
        shownResultForMonthKey !== prevMonthKey
      ) {
        const [py, pm] = prevMonthKey.split("-");

        const report = await fetchMonthlyReport({
          year: Number(py),
          month: Number(pm),
        }).catch(() => null);

        const profile = await fetchUserProfile().catch(() => null);
        const prevGoal = Number(profile?.goalScore) || 0;

        const bookcase = await fetchBookcase().catch(() => ({}));
        const after = bookcase?.after || bookcase?.AFTER || [];
        const prevRead = after.filter(
          (b) => getCompletionKey(b)?.key === prevMonthKey,
        ).length;

        const achieved = prevGoal > 0 && prevRead >= prevGoal;

        if (cancelled) return;

        navigation.navigate("GoalResult", {
          achieved,
          summary: report?.summary ?? null,
          monthKey: prevMonthKey,
          prevGoal,
          prevRead,
          forceSetGoal: true,
        });

        // lastSeenMonthKey는 갱신해도 됨 (pending이 우선이니까)
        await AsyncStorage.setItem("lastSeenMonthKey", thisMonthKey);
        return;
      }

      const isFirstVisitThisMonth = lastSeenMonthKey !== thisMonthKey;
      const alreadyShownPrev = shownResultForMonthKey === prevMonthKey;

      // 이번달 첫 방문이 아니거나, 이미 지난달 결과 보여줬으면 패스
      if (!isFirstVisitThisMonth || alreadyShownPrev) {
        await AsyncStorage.setItem("lastSeenMonthKey", thisMonthKey);
        return;
      }

      try {
        // 지난달 리포트 summary 가져오기
        const [py, pm] = prevMonthKey.split("-"); // "2025-12" -> ["2025","12"]
        const report = await fetchMonthlyReport({
          year: Number(py),
          month: Number(pm),
        }).catch(() => null);

        // 지난달 목표 (goalScore)
        const profile = await fetchUserProfile().catch(() => null);
        const prevGoal = Number(profile?.goalScore) || 0;

        // 지난달 완독 수 (after 중에서 완료월이 prevMonthKey인 것)
        const bookcase = await fetchBookcase().catch(() => ({}));
        const after = bookcase?.after || bookcase?.AFTER || [];
        const prevRead = after.filter(
          (b) => getCompletionKey(b)?.key === prevMonthKey,
        ).length;

        const achieved = prevGoal > 0 && prevRead >= prevGoal;

        if (cancelled) return;

        navigation.navigate("GoalResult", {
          achieved,
          summary: report?.summary ?? null,
          monthKey: prevMonthKey,
          prevGoal,
          prevRead,
          forceSetGoal: true,
        });

        await AsyncStorage.setItem("pendingResultForMonthKey", prevMonthKey);
      } finally {
        await AsyncStorage.setItem("lastSeenMonthKey", thisMonthKey);
      }
    };

    checkAndOpenPrevMonthResult();

    return () => {
      cancelled = true;
    };
  }, [isFocused, getCompletionKey, navigation, isEditingGoal]);

  const maxGoal = 30;

  const saveGoal = async () => {
    try {
      await updateProfile({ goalScore: goalCandidate });
      setGoalCount(goalCandidate);

      const pending = await AsyncStorage.getItem("pendingResultForMonthKey");
      if (pending) {
        await AsyncStorage.setItem("shownResultForMonthKey", pending);
        await AsyncStorage.removeItem("pendingResultForMonthKey");
      }

      // 목표 확정했으니 편집 중 플래그도 제거
      await AsyncStorage.removeItem(PENDING_GOAL_EDIT_KEY);

      openedGoalEditorRef.current = false; // 다음 포커스부터는 정상 체크
    } catch (e) {
      console.warn("목표 설정 실패:", e.response?.data || e.message);
      showBanner("목표 설정에 실패했어요");
    }
  };

  // 목표 권수 설정
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/*
        <View style={styles.header}>
          <Text style={styles.logo}>modam</Text>
        </View>
        */}

        {/* 임시로 로고 버튼 길게 누르면 이번 달에 조회했어두 그 기록 초기화 하고 처음 오는 것처럼 보이게 해뒀어용 !*/}
        <Pressable
          style={styles.header}
          onLongPress={DEV ? resetGoalModalDebug : undefined}
        >
          <Text style={styles.logo}>modam</Text>
        </Pressable>

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

        {isEditingGoal ? (
          <GoalCountSlider
            value={goalCandidate}
            onChange={setGoalCandidate}
            onSave={async () => {
              await saveGoal(); // 기존 함수 그대로 사용
              setIsEditingGoal(false); // 완료하면 다시 진행바로
            }}
            max={maxGoal}
          />
        ) : (
          <ReadingProgressBar
            goalCount={goalCount}
            readCount={readCount}
            characterSource={ProgressBarCharacter}
            animateKey={progressAnimateKey}
            animate={true}
            duration={700}
          />
        )}

        <MonthlyCalendar
          year={year}
          month={month}
          onPrev={prev}
          onNext={next}
          markedDates={markedDates}
          dateCounts={dateCounts}
          themeColor={themeColor}
          selectedDayKey={dayModalKey}
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
          <Animated.View style={[styles.recList, { opacity: recoOpacity }]}>
            <RecommendationSectionCard
              nickname={nickname || ""}
              recs={recs}
              // 새로고침
              onRefresh={loadRecommendations}
              // 아이템 클릭 -> 상세 모달 열기
              onPressItem={async (book) => {
                const bookId = book?.bookId || book?.id;
                if (!bookId) return;

                try {
                  const reviewList = await fetchReviewListByBookId(bookId);

                  // 1) 리뷰 정규화
                  const normalizedReviews = (reviewList || []).map(
                    (r, idx) => ({
                      id: `${bookId}-${idx}`,
                      nickname: r.userName || "닉네임",
                      content: r.comment || "",
                      // API에 아직 avatar가 없으니 null
                      avatar: null,
                      // rating도 같이 들고가기
                      rating: typeof r.rating === "number" ? r.rating : 0,
                    }),
                  );

                  // 2) ⭐ 평균 별점 + 리뷰 개수 집계
                  const totalReview = normalizedReviews.length;
                  const avgRate =
                    totalReview === 0
                      ? 0
                      : normalizedReviews.reduce(
                          (sum, r) => sum + (r.rating || 0),
                          0,
                        ) / totalReview;

                  // 3) 🟩 키워드 3개 (임시: comment에서 단어 뽑는 버전)
                  //   - 백엔드에서 키워드 내려오기 전까진 이렇게라도 동작하게 해두면 좋아
                  const stop = new Set([
                    "진짜",
                    "너무",
                    "완전",
                    "그냥",
                    "근데",
                    "조금",
                    "정말",
                  ]);
                  const tokens = normalizedReviews.flatMap((r) =>
                    (r.content || "")
                      .replace(/[^\p{L}\p{N}\s]/gu, " ")
                      .split(/\s+/)
                      .map((w) => w.trim())
                      .filter((w) => w.length >= 2 && !stop.has(w)),
                  );

                  const countMap = {};
                  tokens.forEach((t) => (countMap[t] = (countMap[t] || 0) + 1));

                  const topKeywords = Object.entries(countMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([k]) => k);

                  setRecoDetail({
                    ...book,
                    reviews: normalizedReviews,
                    rate: avgRate, // ✅ 모달이 쓰는 book.rate 채움
                    totalReview, // ✅ 모달이 쓰는 book.totalReview 채움
                    topKeywords, // ✅ 태그 3개 바꿈
                  });
                } catch (e) {
                  console.warn(
                    "리뷰 조회 실패:",
                    e.response?.data || e.message,
                  );
                  // 실패해도 모달은 열리게(리뷰만 비움)
                  setRecoDetail({
                    ...book,
                    reviews: [],
                    rate: 0,
                    totalReview: 0,
                    topKeywords: [],
                  });
                }
              }}
              //하트 토글
              onToggleHeart={(book) => handleToggleHeart(book)}
              // liked 여부 판단 함수
              isLiked={(book) => favoriteIds.has(book?.bookId || book?.id)}
              // 하트 disabled 처리용 Set
              heartDisabledIds={heartBusyIds}
            />
          </Animated.View>
        </View>
      </ScrollView>

      <YearMonthPicker
        visible={yearPickerOpen}
        onClose={() => setYearPickerOpen(false)}
        mode="year" // 연도만 고르도록
        theme="mono" // 테마는 모노
        selectedYear={year}
        selectedMonth={month} // props 맞춰야 해서 전달
        onSelectYear={(y) => {
          setYear(y);
        }}
        onSelectMonth={(m) => {
          setMonth(m);
        }}
      />

      <Pressable
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}
        onPress={() => setReadingStartOpen(true)}
        hitSlop={6}
      >
        <Ionicons
          name="add"
          size={24}
          color="#fff"
        />
      </Pressable>

      <ReadingStartModal
        visible={readingStartOpen}
        onClose={() => setReadingStartOpen(false)}
        fetchBookcase={fetchBookcase}
        placeKeyMap={placeKeyMap}
        onSubmit={async ({ placeLabel, placeCode, selectedBookId, book }) => {
          try {
            // (1) 상태 READING 맞추기
            const stateRaw = book?.state || book?.status || book?.bookStatus;
            const isReadingState =
              stateRaw === "READING" ||
              stateRaw === "읽는중" ||
              stateRaw === "읽는 중";
            if (!isReadingState) {
              await updateBookcaseState(Number(selectedBookId), "READING");
            }

            // (2) 로그 저장
            await saveReadingLog({
              bookId: Number(selectedBookId),
              readingPlace: placeCode,
            });

            // (3) 서버 기준으로 리프레시해서 readingLogs 재세팅
            const refreshed = await fetchReadingLogs({ year, month });
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

            showBanner("독서 기록을 저장했어요");
            setReadingStartOpen(false); // 성공하면 닫기
          } catch (e) {
            const code = e.response?.data?.error?.code;
            console.warn("독서 기록 저장 실패:", e.response?.data || e.message);
            showBanner(
              code === "4091"
                ? "책장에 담긴 책만 기록할 수 있어요"
                : "독서 기록 저장에 실패했어요",
            );
            // 실패 시 닫을지 말지는 취향 (보통은 안 닫고 유지)
          }
        }}
      />

      <DayLogsBottomSheet
        visible={!!dayModalKey}
        dayKey={dayModalKey}
        logs={activeDayLogs}
        onClose={() => setDayModalKey(null)}
      />

      <RecommendationDetailModal
        visible={!!recoDetail}
        book={recoDetail}
        onClose={() => setRecoDetail(null)}
      />

      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 },
            {
              opacity: toastOpacity,
              transform: [
                {
                  translateY: toastOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Button
            label={toast.text}
            size="xlarge"
            variant={toast.tone === "error" ? "error" : "primary"}
            tone="fill"
            fullWidth
            style={styles.toastButton}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },

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
  avatarInitial: { fontSize: 16, fontWeight: "700", color: colors.mono[950] },
  avatarName: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: colors.mono[950],
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

  section: { marginTop: 14, paddingHorizontal: 16 },

  recList: { marginTop: 12 },

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

  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  toastButton: { borderRadius: 14 },
});
