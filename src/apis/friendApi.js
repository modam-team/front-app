import { client } from "@apis/clientApi";
import { getToken } from "@utils/secureStore";

// 닉네임으로 친구 검색
export async function searchFriends(nickname) {
  const token = await getToken("accessToken");
  if (!token) return [];

  const res = await client.get("/api/friend/search", {
    params: { nickname },
  });
  return res.data; // [{ userId, nickname, profileImageUrl, relationStatus }]
}

// 전체 친구 목록 조회
export async function fetchFriends() {
  const token = await getToken("accessToken");
  if (!token) return [];
  const res = await client.get("/api/friend");
  return res.data?.responseDto ?? res.data ?? [];
}

// 받은 요청 목록 조회
export async function fetchReceivedRequests() {
  const token = await getToken("accessToken");
  if (!token) return [];
  const res = await client.get("/api/friend/requests/received");
  return res.data?.responseDto ?? res.data ?? [];
}

// 보낸 요청 목록 조회 (엔드포인트가 없을 경우 searchFriends("")로 대체)
export async function fetchSentRequests() {
  const token = await getToken("accessToken");
  if (!token) return [];
  try {
    const res = await client.get("/api/friend/requests/sent");
    return res.data?.responseDto ?? res.data ?? [];
  } catch (e) {
    try {
      const res = await client.get("/api/friend/search", {
        params: { nickname: "" },
      });
      const list = res.data?.responseDto ?? res.data ?? [];
      return Array.isArray(list)
        ? list.filter((r) =>
            ["REQUEST_SENT", "REQUEST", "PENDING"].includes(r.relationStatus),
          )
        : [];
    } catch (err) {
      return [];
    }
  }
}

// 친구 삭제
export async function unfriend(targetUserId) {
  const token = await getToken("accessToken");
  if (!token) throw new Error("no access token");
  const res = await client.delete("/api/friend/unfriend", {
    data: { targetUserId },
  });
  return res.data;
}

// 친구 요청 보내기
export async function sendFriendRequest(targetUserId) {
  const token = await getToken("accessToken");
  if (!token) throw new Error("no access token");

  const res = await client.post("/api/friend/request", { targetUserId });
  return res.data; // 200 OK
}

// 친구 요청 취소 (문서화 안 되어 있을 수 있으나 /api/friend/request/cancel 시도)
export async function cancelFriendRequest(targetUserId) {
  const token = await getToken("accessToken");
  if (!token) throw new Error("no access token");
  const payload = { targetUserId };
  try {
    const res = await client.post("/api/friend/request/cancel", payload);
    return res.data;
  } catch (e) {
    // 405/500 등 메서드 문제일 때 DELETE로 재시도
    try {
      const res = await client.delete("/api/friend/request/cancel", {
        data: payload,
      });
      return res.data;
    } catch (e2) {
      // 마지막 폴백: DELETE /api/friend/request
      const res = await client.delete("/api/friend/request", { data: payload });
      return res.data;
    }
  }
}

// 친구 요청 수락
export async function acceptFriendRequest(targetUserId) {
  const token = await getToken("accessToken");
  if (!token) throw new Error("no access token");

  const res = await client.post("/api/friend/accept", { targetUserId });
  return res.data; // 200 OK
}

// 친구 요청 거절 (문서에 없을 수 있어 구버전 폴백 포함)
export async function rejectFriendRequest(targetUserId) {
  const token = await getToken("accessToken");
  if (!token) throw new Error("no access token");
  try {
    // 문서: DELETE /api/friend/request/reject
    const res = await client.delete("/api/friend/request/reject", {
      data: { targetUserId },
    });
    return res.data;
  } catch (e) {
    // 폴백: 기존 POST 엔드포인트들
    try {
      const res = await client.post("/api/friend/reject", { targetUserId });
      return res.data;
    } catch (e2) {
      const res = await client.post("/api/friend/request/reject", {
        targetUserId,
      });
      return res.data;
    }
  }
}
