import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchFriends,
  fetchReceivedRequests,
  fetchSentRequests,
  rejectFriendRequest,
  searchFriends,
  sendFriendRequest,
  unfriend,
} from "@apis/friendApi";
import Avatar from "@components/common/Avatar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "@theme/colors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

const LOCAL_SENT_KEY = "LOCAL_SENT_REQUESTS";
const FRIEND_ORDER_KEY = "friendOrder";

export default function FriendListScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState("friend");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [localSent, setLocalSent] = useState([]); // 서버가 안 주는 보낸 요청을 로컬로 유지
  const [results, setResults] = useState([]); // 검색 결과
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [sheetTarget, setSheetTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [friendOrder, setFriendOrder] = useState([]);
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const { dx } = gesture;
        if (dx > 50) {
          setActiveTab("friend");
        } else if (dx < -50) {
          setActiveTab("request");
        }
      },
    }),
  ).current;

  const dedupByUser = (list = []) => {
    const map = new Map();
    list.forEach((item) => {
      const key =
        item?.userId ||
        item?.id ||
        (item?.nickname ? `nick-${item.nickname}` : null);
      if (!key) return;
      const k = String(key);
      if (!map.has(k)) map.set(k, item);
    });
    return Array.from(map.values());
  };

  const loadLocalSentFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_SENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalSent(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const saveLocalSent = async (list) => {
    try {
      await AsyncStorage.setItem(LOCAL_SENT_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  const statusLabel = useMemo(
    () => ({
      FRIENDS: "친구",
      NOT_FRIENDS: "미친구",
      REQUEST_SENT: "요청 보냄",
      REQUEST: "요청 보냄",
      PENDING: "요청 보냄",
      REQUEST_RECEIVED: "요청 받음",
    }),
    [],
  );

  const applyFriendOrder = useCallback((list, order) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    if (!Array.isArray(order) || order.length === 0) return list;
    const orderMap = new Map(order.map((id, idx) => [String(id), idx]));
    const toKey = (item) => {
      const raw = item?.userId ?? item?.id ?? item?.nickname ?? null;
      return raw != null ? String(raw) : "";
    };
    return [...list].sort((a, b) => {
      const aKey = toKey(a);
      const bKey = toKey(b);
      const aIdx = orderMap.has(aKey) ? orderMap.get(aKey) : 1e9;
      const bIdx = orderMap.has(bKey) ? orderMap.get(bKey) : 1e9;
      return aIdx - bIdx;
    });
  }, []);

  const orderedFriends = useMemo(
    () => applyFriendOrder(friends, friendOrder),
    [friends, friendOrder, applyFriendOrder],
  );

  const shownList =
    results.length > 0
      ? activeTab === "friend"
        ? results // 검색 시에는 관계 상태와 무관하게 모두 노출
        : results.filter((r) =>
            ["REQUEST_RECEIVED", "REQUEST_SENT", "REQUEST", "PENDING"].includes(
              r.relationStatus,
            ),
          )
      : activeTab === "friend"
        ? orderedFriends
        : dedupByUser([...received, ...sent, ...localSent]);

  const updateStatus = (userId, relationStatus) => {
    setResults((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, relationStatus } : r)),
    );
    setFriends((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, relationStatus } : r)),
    );
    setReceived((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, relationStatus } : r)),
    );
    setSent((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, relationStatus } : r)),
    );
    setSheetTarget((prev) =>
      prev && prev.userId === userId ? { ...prev, relationStatus } : prev,
    );
  };

  const loadAllFriends = async () => {
    setLoading(true);
    setErrorText("");
    try {
      const storedOrder = await AsyncStorage.getItem(FRIEND_ORDER_KEY);
      const order = storedOrder ? JSON.parse(storedOrder) : [];
      const [friendsRes, receivedRes, sentRes, searchRes] = await Promise.all([
        fetchFriends(),
        fetchReceivedRequests(),
        fetchSentRequests(),
        searchFriends("").catch(() => []),
      ]);
      const fr = Array.isArray(friendsRes) ? friendsRes : [];
      const recv = Array.isArray(receivedRes) ? receivedRes : [];
      const sentDirect = Array.isArray(sentRes) ? sentRes : [];
      const searchList = Array.isArray(searchRes) ? searchRes : [];
      const sentList =
        sentDirect.length > 0
          ? sentDirect
          : searchList.filter((r) =>
              ["REQUEST_SENT", "REQUEST", "PENDING"].includes(r.relationStatus),
            );
      // 로컬 보낸 목록과 병합 후 중복 제거
      const mergedSent = dedupByUser([...sentList, ...localSent]);
      setFriendOrder(Array.isArray(order) ? order : []);
      setFriends(applyFriendOrder(fr, Array.isArray(order) ? order : []));
      setReceived(recv);
      setSent(mergedSent);
      saveLocalSent(mergedSent);

      // 요청 탭에서 검색어가 비어 있으면 검색 결과를 그대로 결과 목록으로 사용해 표시
      if (activeTab === "request" && query.trim() === "") {
        setResults(searchList);
      } else {
        setResults([]); // 기본은 검색 결과 비우고 전체 노출
      }

      if (
        fr.length === 0 &&
        recv.length === 0 &&
        mergedSent.length === 0 &&
        (activeTab !== "request" || searchList.length === 0)
      ) {
        setErrorText("친구/요청 목록이 없습니다");
      }
    } catch (e) {
      setErrorText("목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      console.warn("친구 목록 로드 실패:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const term = query.trim();
    // 빈 검색어: 전체 목록 재조회 (특히 요청 탭 초기 표시)
    if (!term) {
      await loadAllFriends();
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      const res = await searchFriends(term);
      const list = Array.isArray(res) ? res : [];
      setResults(list);
      if (!list || list.length === 0) {
        setErrorText("검색 결과가 없습니다");
      }
    } catch (e) {
      setErrorText("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
      console.warn("친구 검색 실패:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadLocalSentFromStorage().finally(loadAllFriends);
    }
  }, [isFocused]);

  const saveFriendOrder = useCallback(async (list) => {
    const order = Array.isArray(list)
      ? list.map((f) => f?.userId ?? f?.id ?? null).filter((id) => id != null)
      : [];
    setFriendOrder(order);
    setFriends(list);
    await AsyncStorage.setItem(FRIEND_ORDER_KEY, JSON.stringify(order));
    DeviceEventEmitter.emit("friendOrderChanged", order);
  }, []);

  useEffect(() => {
    // 탭 전환 시에도 최신 목록을 갱신해 반영
    loadAllFriends();
  }, [activeTab]);

  const resolveUserId = (id) => {
    const n = Number(id || sheetTarget?.id || sheetTarget?.userId);
    return Number.isNaN(n) ? null : n;
  };

  const addLocalSent = (user) => {
    if (!user?.userId) return;
    setLocalSent((prev) => {
      if (prev.find((p) => p.userId === user.userId)) return prev;
      const next = [
        ...prev,
        {
          ...user,
          relationStatus: "REQUEST_SENT",
        },
      ];
      saveLocalSent(next);
      return next;
    });
  };

  const removeLocalSent = (userId) => {
    setLocalSent((prev) => {
      const next = prev.filter((p) => p.userId !== userId);
      saveLocalSent(next);
      return next;
    });
  };

  const handleCancelRequest = async (targetUserId) => {
    const uid = resolveUserId(targetUserId);
    if (!uid) return;
    setActionLoading(true);
    try {
      await cancelFriendRequest(uid);
      updateStatus(uid, "NOT_FRIENDS");
      removeLocalSent(uid);
      await loadAllFriends();
      setSheetTarget(null);
    } catch (e) {
      console.warn("친구 요청 취소 실패:", e.response?.data || e.message);
      setErrorText(
        e?.response?.data?.error?.message ||
          "요청 취소에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId) => {
    const uid = resolveUserId(targetUserId);
    if (!uid) return;
    setActionLoading(true);
    try {
      await sendFriendRequest(uid);
      updateStatus(uid, "REQUEST_SENT");
      addLocalSent(
        sheetTarget?.userId === uid
          ? sheetTarget
          : results.find((r) => r.userId === uid) ||
              friends.find((f) => f.userId === uid) || { userId: uid },
      );
      await loadAllFriends();
    } catch (e) {
      console.warn("친구 요청 실패:", e.response?.data || e.message);
      setErrorText("친구 요청에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (targetUserId) => {
    const uid = resolveUserId(targetUserId);
    if (!uid) return;
    setActionLoading(true);
    try {
      await acceptFriendRequest(uid);
      updateStatus(uid, "FRIENDS");
      removeLocalSent(uid);
      await loadAllFriends();
      setSheetTarget(null);
      DeviceEventEmitter.emit("friendAccepted");
    } catch (e) {
      console.warn("친구 요청 수락 실패:", e.response?.data || e.message);
      setErrorText(
        e?.response?.data?.error?.message ||
          "수락에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (targetUserId) => {
    const uid = resolveUserId(targetUserId);
    if (!uid) return;
    setActionLoading(true);
    try {
      await rejectFriendRequest(uid);
      updateStatus(uid, "NOT_FRIENDS");
      removeLocalSent(uid);
      await loadAllFriends();
      setSheetTarget(null);
    } catch (e) {
      console.warn("친구 요청 거절 실패:", e.response?.data || e.message);
      setErrorText(
        e?.response?.data?.error?.message ||
          "거절에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async (targetUserId) => {
    const uid = resolveUserId(targetUserId);
    if (!uid) return;
    setActionLoading(true);
    try {
      await unfriend(uid);
      updateStatus(uid, "NOT_FRIENDS");
      removeLocalSent(uid);
      await loadAllFriends();
      DeviceEventEmitter.emit("friendAccepted"); // 홈 상단 동기화용
      setSheetTarget(null);
    } catch (e) {
      console.warn("친구 삭제 실패:", e.response?.data || e.message);
      setErrorText(
        e?.response?.data?.error?.message ||
          "친구 삭제에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.titleRow}>
          <Pressable
            hitSlop={10}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#000"
            />
          </Pressable>
          <Text style={styles.title}>친구 목록</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab("friend")}
            hitSlop={6}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "friend"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              friend
            </Text>
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab("request")}
            hitSlop={6}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "request"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              request
            </Text>
          </Pressable>
          <View
            style={[
              styles.tabIndicator,
              activeTab === "friend" ? { left: 0 } : { left: "50%" },
            ]}
          />
        </View>

        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#8a8a8a"
          />
          <TextInput
            placeholder="검색어를 입력하세요"
            placeholderTextColor="#b1b1b1"
            style={styles.searchInput}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setErrorText("");
            }}
            onSubmitEditing={handleSearch}
          />
          <Pressable
            onPress={handleSearch}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.primary[500]}
            />
          </Pressable>
        </View>

        <View style={styles.listArea}>
          {loading && <Text style={styles.emptyText}>불러오는 중...</Text>}
          {!loading && activeTab === "friend" && (
            <DraggableFlatList
              data={orderedFriends}
              keyExtractor={(item, index) =>
                String(item?.userId ?? item?.id ?? item?.nickname ?? index)
              }
              onDragBegin={() => {}}
              onDragEnd={({ data }) => saveFriendOrder(data)}
              renderItem={({ item, drag, isActive }) => (
                <Pressable
                  style={[
                    styles.friendRow,
                    isActive && styles.friendRowActive,
                    isActive && { opacity: 0.9 },
                  ]}
                  onPress={() => setSheetTarget(item)}
                  onLongPress={drag}
                >
                  <View style={styles.friendMeta}>
                    <Avatar
                      uri={
                        item.profileImageUrl ||
                        item.profileUrl ||
                        item.avatar ||
                        item.image ||
                        null
                      }
                      size={44}
                      style={styles.avatar}
                    />
                    <Text style={styles.friendName}>{item.nickname}</Text>
                  </View>
                  {item.relationStatus && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {statusLabel[item.relationStatus] ||
                          item.relationStatus}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 10 }}
            />
          )}
          {!loading &&
            activeTab !== "friend" &&
            shownList.map((friend, idx) => (
              <Pressable
                key={`${friend.userId || friend.nickname || "friend"}-${idx}`}
                style={styles.friendRow}
                onPress={() => setSheetTarget(friend)}
              >
                <View style={styles.friendMeta}>
                  <Avatar
                    uri={
                      friend.profileImageUrl ||
                      friend.profileUrl ||
                      friend.avatar ||
                      friend.image ||
                      null
                    }
                    size={44}
                    style={styles.avatar}
                  />
                  <Text style={styles.friendName}>{friend.nickname}</Text>
                </View>
                {friend.relationStatus && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {statusLabel[friend.relationStatus] ||
                        friend.relationStatus}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}

          {!loading && shownList.length === 0 && (
            <Text style={styles.emptyText}>
              {errorText || "닉네임으로 친구를 검색해보세요"}
            </Text>
          )}
        </View>
      </ScrollView>

      {sheetTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetOverlayBg}
            onPress={() => setSheetTarget(null)}
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Avatar
                uri={
                  sheetTarget.profileImageUrl ||
                  sheetTarget.profileUrl ||
                  sheetTarget.avatar ||
                  sheetTarget.image ||
                  null
                }
                size={49}
                style={styles.sheetAvatar}
              />
              <Text style={styles.sheetName}>{sheetTarget.nickname}</Text>
            </View>

            <View style={styles.sheetButtons}>
              {sheetTarget.relationStatus === "REQUEST_RECEIVED" && (
                <>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    disabled={actionLoading}
                    onPress={() => handleAccept(sheetTarget.userId)}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnText}>요청 수락</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnGhost]}
                    disabled={actionLoading}
                    onPress={() => handleReject(sheetTarget.userId)}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnGhostText}>요청 거절</Text>
                  </Pressable>
                </>
              )}

              {sheetTarget.relationStatus === "NOT_FRIENDS" && (
                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.actionBtnPrimary,
                    { width: "100%" },
                  ]}
                  disabled={actionLoading}
                  onPress={() => handleSendRequest(sheetTarget.userId)}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.actionBtnText}>친구 요청하기</Text>
                </Pressable>
              )}

              {sheetTarget.relationStatus === "FRIENDS" && (
                <View style={{ gap: 10 }}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.actionBtnPrimary,
                      { width: "100%" },
                    ]}
                    disabled={actionLoading}
                    onPress={() => {
                      setSheetTarget(null);
                      navigation.navigate("FriendCalendar", {
                        singleFriendOnly: true,
                        friend: {
                          userId: sheetTarget.userId,
                          nickname: sheetTarget.nickname,
                          avatar: sheetTarget.profileImageUrl,
                          themeColor: sheetTarget.themeColor,
                          goalScore:
                            sheetTarget.goalScore ||
                            sheetTarget.goal ||
                            sheetTarget.goalCount ||
                            1,
                        },
                      });
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnText}>친구 피드 보기</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.actionBtnGhost,
                      { width: "100%", backgroundColor: colors.mono[700] },
                    ]}
                    disabled={actionLoading}
                    onPress={() =>
                      Alert.alert("친구 삭제", "정말 친구를 삭제할까요?", [
                        { text: "취소", style: "cancel" },
                        {
                          text: "삭제",
                          style: "destructive",
                          onPress: () => handleUnfriend(sheetTarget.userId),
                        },
                      ])
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnGhostText}>친구 삭제</Text>
                  </Pressable>
                </View>
              )}

              {sheetTarget.relationStatus === "REQUEST_SENT" && (
                <View style={{ gap: 10 }}>
                  <Text style={styles.sheetInfo}>요청을 보냈어요.</Text>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.actionBtnGhost,
                      { width: "100%", backgroundColor: colors.mono[700] },
                    ]}
                    disabled={actionLoading}
                    onPress={() =>
                      Alert.alert("요청 취소", "보낸 요청을 취소할까요?", [
                        { text: "닫기", style: "cancel" },
                        {
                          text: "취소하기",
                          style: "destructive",
                          onPress: () =>
                            handleCancelRequest(sheetTarget.userId),
                        },
                      ])
                    }
                  >
                    <Ionicons
                      name="close-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnGhostText}>요청 취소</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    paddingTop: 6,
  },
  titleRow: {
    marginTop: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "600", color: "#000" },
  tabRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: colors.background.DEFAULT,
    borderBottomWidth: 1,
    borderColor: colors.primary[100],
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: { fontSize: 14, fontWeight: "700" },
  tabTextActive: { color: colors.primary[400] },
  tabTextInactive: { color: colors.mono[500] },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    width: "50%",
    height: 2,
    backgroundColor: colors.primary[500],
  },
  searchRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.mono[0],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  listArea: {
    marginTop: 30,
    gap: 16,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  friendRowActive: {
    borderWidth: 2,
    borderColor: "#608540",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  friendMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[0],
  },
  friendName: { fontSize: 14, color: "#000" },
  emptyText: {
    fontSize: 14,
    color: colors.mono[600],
    textAlign: "center",
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.primary[0],
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary[500],
  },
  sheetOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  sheetOverlayBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheetCard: {
    backgroundColor: colors.mono[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
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
    marginBottom: 16,
  },
  sheetHeader: {
    alignItems: "center",
    gap: 10,
  },
  sheetAvatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: colors.primary[0],
  },
  sheetName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  sheetButtons: {
    marginTop: 18,
    gap: 12,
  },
  actionBtn: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary[400],
  },
  actionBtnGhost: {
    backgroundColor: colors.primary[400],
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  actionBtnGhostText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  sheetInfo: {
    textAlign: "center",
    color: colors.mono[700],
    fontSize: 14,
  },
});
