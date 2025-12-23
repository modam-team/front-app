import { client } from "@apis/clientApi";

// 온보딩 완료 여부 조회
export async function fetchOnboardingStatus() {
  const res = await client.get("/api/user/onboarding/status");

  // { onboardingCompleted: true } 형태
  return res.data;
}

// 유저 프로필 조회
export async function fetchUserProfile() {
  const res = await client.get("/api/user/profile");

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
export async function completeOnboarding(payload) {
  const res = await client.post("/api/user/onboarding/complete", payload);

  // 200 OK만 응답으로 옴
  return res.data;
}

// 회원탈퇴
export async function withdrawUser() {
  const res = await client.delete("/api/user/withdraw");
  return res.data; // 200 OK
}

// 프로필 사진 업로드
export async function uploadProfileImage(asset) {
  const formData = new FormData();

  formData.append("imageFile", {
    uri: asset.uri,
    name: asset.fileName ?? "profile.jpg",
    type: asset.mimeType ?? "image/jpeg",
  });

  const res = await client.post("/api/user/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}
