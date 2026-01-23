import { client } from "@apis/clientApi";
import { getToken, saveToken } from "@utils/secureStore";

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

// 애플 인증코드로 JWT 발급 요청
export async function appleLogin(code) {
  try {
    const res = await client.post("/api/v1/auth/apple/login", null, {
      params: { code },
      skipAuth: true,
    });

    const data = res.data;

    if (!data.success) {
      console.error("로그인 실패 응답:", data);
      throw new Error(data.error?.message);
    }

    const { accessToken, refreshToken, expiresIn } = data.responseDto;

    await Promise.all([
      saveToken("accessToken", accessToken),
      saveToken("refreshToken", refreshToken ?? ""),
      saveToken("expiresIn", String(expiresIn ?? "")),
    ]);

    return data.responseDto;
  } catch (e) {
    if (e.response) {
      console.error(
        "애플 로그인 API 오류: ",
        e.response.status,
        e.response.data,
      );
    } else {
      console.error("애플 로그인 네트워크 / 기타 오류:", e.message);
    }
    throw e;
  }
}

// 리프레시 토큰으로 액세스 토큰 재발급
export async function reissueToken(refreshTokenParam) {
  const refreshToken = refreshTokenParam || (await getToken("refreshToken"));
  if (!refreshToken) {
    throw new Error("refresh token not found");
  }

  const res = await client.post("/api/v1/auth/reissue", null, {
    params: { refreshToken },
    skipAuth: true,
    headers: { Accept: "application/json" },
  });

  const data = res.data;
  if (!data?.success) {
    const err = new Error(data?.error?.message || "토큰 재발급 실패");
    err.response = data;
    throw err;
  }

  const { accessToken, refreshToken: newRefresh, expiresIn } = data.responseDto;
  await Promise.all([
    accessToken ? saveToken("accessToken", accessToken) : Promise.resolve(),
    newRefresh ? saveToken("refreshToken", newRefresh) : Promise.resolve(),
    expiresIn ? saveToken("expiresIn", String(expiresIn)) : Promise.resolve(),
  ]);

  return data.responseDto;
}
