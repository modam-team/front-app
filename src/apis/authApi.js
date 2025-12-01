import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 카카오 인증코드로 JWT 발급 요청
export async function kakaoLogin(code) {
  try {
    const res = await client.post("/api/v1/auth/kakao/login", null, {
      params: { code },
    });

    const data = res.data;

    if (!data.success) {
      console.error("로그인 실패 응답:", data);
      throw new Error(data.error?.message);
    }

    return data.responseDto;
  } catch (e) {
    if (e.response) {
      console.error(
        "카카오 로그인 API 오류: ",
        e.response.status,
        e.response.data,
      );
    } else {
      console.error("카카오 로그인 네트워크 / 기타 오류:", e.message);
    }
    throw e;
  }
}
