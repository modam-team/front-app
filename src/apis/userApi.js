import { reissueToken } from "@apis/authApi";
import { client } from "@apis/clientApi";
import { getToken } from "@utils/secureStore";

// 온보딩 완료 여부 조회
export async function fetchOnboardingStatus() {
  const res = await client.get("/api/user/onboarding/status");

  // { onboardingCompleted: true } 형태
  return res.data;
}

// 유저 프로필 조회
export async function fetchUserProfile() {
  // 토큰이 없으면 리프레시로 재발급을 시도하고, 그래도 없으면 에러
  let token = await getToken("accessToken");
  if (!token) {
    try {
      const issued = await reissueToken();
      token = issued?.accessToken;
    } catch (e) {
      // 토큰이 없다면 로그인 화면으로 분기할 수 있도록 null 반환
      const err = new Error("no access token");
      err.cause = e;
      err.code = "NO_TOKEN";
      throw err;
    }
  }

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

// 탈퇴한 회원이 돌아오면 복구
export async function activateUser() {
  const res = await client.patch("/api/user/activate");
  return res.data;
}

// 프로필 사진 업로드
export async function uploadProfileImage(asset) {
  const formData = new FormData();

  const mime = asset?.mimeType || asset?.type?.mimeType || "image/jpeg";
  const name = asset?.fileName || "profile.jpg";

  formData.append("imageFile", {
    uri: asset.uri,
    name,
    type: mime,
  });

  const res = await client.post("/api/user/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });

  return res.data; // 서버가 내려주는 profileImageUrl 등을 그대로 반환
}

// 프로필 사진 삭제
export async function deleteProfileImage() {
  await client.delete("/api/user/profile/image");
}

// 프로필 수정 (닉네임/공개여부/goalScore)
export async function updateProfile(payload) {
  // payload 예: { nickname: "모담이", isPublic: true, goalScore: 1 }
  const res = await client.patch("/api/user/profile", payload);
  return res.data; // 백엔드가 204면 undefined일 수도 있음
}
