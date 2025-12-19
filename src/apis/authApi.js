import { saveToken } from "../utils/secureStore";
import { client } from "@apis/clientApi";

// 카카오 인증코드로 JWT 발급 요청
export async function kakaoLogin(code) {
  try {
    const res = await client.post("/api/v1/auth/kakao/login", null, {
      params: { code },
      skipAuth: true,
    });

    const data = res.data;

    if (!data.success) {
      console.error("로그인 실패 응답:", data);
      throw new Error(data.error?.message);
    }

    const { accessToken, refreshToken, expiresIn } = data.responseDto;

    // 토큰 및 유저 정보 저장
    await Promise.all([
      saveToken("accessToken", accessToken),
      saveToken("refreshToken", refreshToken ?? ""),
      saveToken("expiresIn", String(expiresIn ?? "")),
    ]);

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
