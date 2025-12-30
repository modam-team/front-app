import {
  acceptFriendRequest,
  rejectFriendRequest,
  searchFriends,
  sendFriendRequest,
} from "@apis/friendApi";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function FriendListScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("friend");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [sheetTarget, setSheetTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusLabel = useMemo(
    () => ({
      FRIENDS: "친구",
      NOT_FRIENDS: "미친구",
      REQUEST_SENT: "요청 보냄",
      REQUEST_RECEIVED: "요청 받음",
    }),
    [],
  );

  const shownList =
    activeTab === "friend"
      ? results
      : results.filter((r) => r.relationStatus === "REQUEST_RECEIVED");

  const updateStatus = (userId, relationStatus) => {
    setResults((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, relationStatus } : r)),
    );
    setSheetTarget((prev) =>
      prev && prev.userId === userId ? { ...prev, relationStatus } : prev,
    );
  };

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setErrorText("");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      const res = await searchFriends(term);
      setResults(Array.isArray(res) ? res : []);
      if (!res || res.length === 0) {
        setErrorText("검색 결과가 없습니다");
      }
    } catch (e) {
      setErrorText("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
      console.warn("친구 검색 실패:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId) => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      await sendFriendRequest(targetUserId);
      updateStatus(targetUserId, "REQUEST_SENT");
    } catch (e) {
      console.warn("친구 요청 실패:", e.response?.data || e.message);
      setErrorText("친구 요청에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (targetUserId) => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      await acceptFriendRequest(targetUserId);
      updateStatus(targetUserId, "FRIENDS");
    } catch (e) {
      console.warn("친구 요청 수락 실패:", e.response?.data || e.message);
      setErrorText("수락에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (targetUserId) => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      await rejectFriendRequest(targetUserId);
      updateStatus(targetUserId, "NOT_FRIENDS");
    } catch (e) {
      console.warn("친구 요청 거절 실패:", e.response?.data || e.message);
      setErrorText("거절에 실패했어요. 잠시 후 다시 시도해주세요.");
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
              requst
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
          {!loading &&
            shownList.map((friend, idx) => (
              <Pressable
                key={friend.userId || `${friend.nickname}-${idx}`}
                style={styles.friendRow}
                onPress={() => setSheetTarget(friend)}
              >
                <View style={styles.friendMeta}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.primary[0] },
                    ]}
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
              <View style={styles.sheetAvatar} />
              <Text style={styles.sheetName}>{sheetTarget.nickname}</Text>
            </View>

            <View style={styles.sheetButtons}>
              {sheetTarget.relationStatus === "REQUEST_RECEIVED" && (
                <>
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

              {sheetTarget.relationStatus === "REQUEST_SENT" && (
                <Text style={styles.sheetInfo}>요청을 보냈어요.</Text>
              )}
              {sheetTarget.relationStatus === "FRIENDS" && (
                <Text style={styles.sheetInfo}>이미 친구입니다.</Text>
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
