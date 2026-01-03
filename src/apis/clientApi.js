import { deleteToken, getToken, saveToken } from "@utils/secureStore";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// refresh 전용 (인터셉터 없게)
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 모든 요청에 대해서 Authorization 헤더를 자동으로 추가하도록
client.interceptors.request.use(async (config) => {
  // 로그인/회원가입 등 인증이 필요 없는 요청에는 skipAuth 플래그로 건너뛴다.
  if (config.skipAuth) {
    return config;
  }

  try {
    const token = await getToken("accessToken");

    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (e) {
    console.warn("토큰 읽기 실패:", e);
  }

  return config;
});

// 401 대응: 리프레시 토큰으로 재발급 후 한 번만 재시도
let isRefreshing = false;
let pendingQueue = [];

// 로그아웃이나 nav 이동 훅
let onAuthFail = null;
export function setOnAuthFail(handler) {
  onAuthFail = handler;
}

async function reissueToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) =>
      pendingQueue.push({ resolve, reject }),
    );
  }

  isRefreshing = true;
  try {
    const refreshToken = await getToken("refreshToken");
    if (!refreshToken) throw new Error("no refresh token");

    const res = await refreshClient.post("/api/v1/auth/reissue", null, {
      params: { refreshToken },
      headers: { Accept: "application/json" },
    });

    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error?.message || "reissue failed");
    }

    const {
      accessToken,
      refreshToken: newRefresh,
      expiresIn,
    } = data.responseDto || {};

    if (!accessToken) throw new Error("reissue failed: no accessToken!");

    await Promise.all([
      saveToken("accessToken", accessToken),
      newRefresh ? saveToken("refreshToken", newRefresh) : Promise.resolve(),
      expiresIn != null
        ? saveToken("expiresIn", String(expiresIn))
        : Promise.resolve(),
    ]);

    // resolve 도중에 새로 들어온 요청이 섞이는 걸 방지하기 위해 큐를 지역 변수로 복사 해뒀습니당
    const queued = pendingQueue;
    pendingQueue = [];
    queued.forEach((p) => p.resolve(accessToken));

    return accessToken;
  } catch (err) {
    // 이것도 마찬가지로 큐를 지역변수로 복사 해뒀습니다 !
    const queued = pendingQueue;
    pendingQueue = [];
    queued.forEach((p) => p.reject(err));

    await Promise.all([
      deleteToken("accessToken"),
      deleteToken("refreshToken"),
      deleteToken("expiresIn"),
    ]);

    onAuthFail?.(err);

    throw err;
  } finally {
    isRefreshing = false;
  }
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const original = error.config || {};

    const code =
      error.response?.data?.code || error.response?.data?.error?.code;
    const msg =
      error.response?.data?.message || error.response?.data?.error?.message;

    const isTokenExpired =
      code === "4034" || msg?.toLowerCase().includes("token expired");

    // skipAuth 요청이거나, 이미 한 번 재시도했다면 그대로 실패 처리
    if (original.skipAuth || original._retry) {
      return Promise.reject(error);
    }

    if (status === 401 || (status === 403 && isTokenExpired)) {
      try {
        const newAccess = await reissueToken();
        original._retry = true;
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        };
        return client.request(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);
