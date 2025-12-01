import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 온보딩 완료 여부 조회
export async function fetchOnboardingStatus(userId) {
  const res = await client.get("/api/user/onboarding/status", {
    headers: {
      "X-User-Id": userId,
    },
  });

  // { onboardingCompleted: true } 형태
  return res.data;
}

// 유저 프로필 조회
export async function fetchUserProfile(userId) {
  const res = await client.get("/api/user/profile", {
    headers: {
      "X-User-Id": userId,
    },
  });

  // { userId, name, nickname, goalScore, preferredCategories, onboardingCompleted } 형태
  return res.data;
}

// 닉네임 사용 가능 여부 조회
export async function checkNicknameAvailable(nickname) {
  const res = await client.get("/api/user/nickname/check", {
    params: { nickname },
  });

  // { message, available } 형태
  return res.data;
}

// 온보딩 완료 저장
export async function completeOnboarding(userId, payload) {
  const res = await client.post("/api/user/onboarding/complete", payload, {
    headers: {
      "X-User-Id": userId,
    },
  });

  // 200 OK만 응답으로 옴
  return res.data;
}
