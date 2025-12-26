import { client } from "@apis/clientApi";

// 닉네임으로 친구 검색
export async function searchFriends(nickname) {
  const res = await client.get("/api/friend/search", {
    params: { nickname },
  });
  return res.data; // [{ userId, nickname, profileImageUrl, relationStatus }]
}

// 친구 요청 보내기
export async function sendFriendRequest(targetUserId) {
  const res = await client.post("/api/friend/request", { targetUserId });
  return res.data; // 200 OK
}

// 친구 요청 수락
export async function acceptFriendRequest(targetUserId) {
  const res = await client.post("/api/friend/request/accept", { targetUserId });
  return res.data; // 200 OK
}

// 친구 요청 거절
export async function rejectFriendRequest(targetUserId) {
  const res = await client.post("/api/friend/request/reject", { targetUserId });
  return res.data; // 200 OK
}
