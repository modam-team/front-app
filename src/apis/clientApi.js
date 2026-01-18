import { deleteToken, getToken, saveToken } from "@utils/secureStore";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// 기본 api 요청용 axios 인스턴스
export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// refresh 토큰 재발급 전용 axios 인스턴스
// (무한 루프를 방지하기 위해 interceptor를 안 붙임)
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 모든 요청에 대해서 Authorization 헤더를 자동으로 추가
client.interceptors.request.use(async (config) => {
  // 로그인/회원가입 등 인증이 필요 없는 요청에는 skipAuth 플래그로 skip
  if (config.skipAuth) {
    return config;
  }

  try {
    const token = await getToken("accessToken");

    // access token이 있으면 기존 헤더에 Authorization 헤더를 자동 추가
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (e) {
    console.warn("[Auth] access token 조회 실패:", e);
  }

  return config;
});

let didAuthFail = false;
let isRefreshing = false; // 현재 재발급 중인지 여부
let pendingQueue = []; // 재발급을 기다리는 요청들

// 토큰 재발급에 실패한 경우
let onAuthFail = null;

// 인증 실패 시 실행할 로직을 주입하기 위한 함수
export function setOnAuthFail(handler) {
  onAuthFail = handler;
}

// 토큰 재발급 함수
async function reissueToken() {
  // 이미 재발급 중이면 큐에 쌓고 대기
  if (isRefreshing) {
    return new Promise((resolve, reject) =>
      pendingQueue.push({ resolve, reject }),
    );
  }

  isRefreshing = true;

  try {
    const refreshToken = await getToken("refreshToken");
    if (!refreshToken) throw new Error("[Auth] refresh token이 없음");

    // 서버에 재발급 요청 전송
    const res = await refreshClient.post("/api/v1/auth/reissue", null, {
      params: { refreshToken },
      headers: { Accept: "application/json" },
    });

    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error?.message || "[Auth] 토큰 재발급 실패");
    }

    // 새 토큰 저장
    const {
      accessToken,
      refreshToken: newRefresh,
      expiresIn,
    } = data.responseDto || {};

    if (!accessToken) throw new Error("[Auth] refresh 실패");

    await Promise.all([
      saveToken("accessToken", accessToken),
      newRefresh ? saveToken("refreshToken", newRefresh) : Promise.resolve(),
      expiresIn != null
        ? saveToken("expiresIn", String(expiresIn))
        : Promise.resolve(),
    ]);

    // resolve 도중에 새로 들어온 요청이 섞이는 걸 방지하기 위해 큐를 지역 변수로 복사
    const queued = pendingQueue;
    pendingQueue = [];

    // pendingQueue에 쌓인 요청들을 전부 성공 처리
    queued.forEach((p) => p.resolve(accessToken));

    return accessToken;
  } catch (err) {
    // 큐를 지역변수로 복사
    const queued = pendingQueue;
    pendingQueue = [];

    // pendingQueue에 쌓인 요청들을 전부 실패 처리
    queued.forEach((p) => p.reject(err));

    // 토큰 전부 삭제
    await Promise.all([
      deleteToken("accessToken"),
      deleteToken("refreshToken"),
      deleteToken("expiresIn"),
    ]);

    if (!didAuthFail) {
      didAuthFail = true;
      onAuthFail?.(err);
    }

    throw err;
  } finally {
    isRefreshing = false;
  }
}

// 401 및 토큰 만료인 경우 자동 재시도
client.interceptors.response.use(
  // 성공 응답이 오면 통과
  (res) => res,

  // 실패 응답이 오면 실행
  async (error) => {
    const status = error.response?.status;
    const original = error.config || {}; // 원래 실패했던 요청의 config

    // 토큰 만료 여부 판별
    const code = error.response?.data?.error?.code;
    const msg = error.response?.data?.error?.message;

    // skipAuth 요청이거나, 이미 한 번 재시도했다면 그대로 실패 처리
    if (original.skipAuth || original._retry) {
      return Promise.reject(error);
    }

    // 토큰 만료인 경우
    const isTokenExpired = code === "4034";

    // 토큰 자체가 유효하지 않은 경우
    const isTokenInvalid =
      code === "4032" || // TOKEN_MALFORMED
      code === "4033" || // TOKEN_TYPE
      code === "4035" || // TOKEN_UNSUPPORTED
      code === "4036" || // TOKEN_UNKNOWN
      code === "4037"; // TOKEN_INVALID

    // 토큰 만료(4034) or 401인 경우 -> 재발급 시도
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

    // 토큰이 invalid한 경우 -> 재발급 시도 없이 바로 실패 처리
    if (status === 403 && isTokenInvalid) {
      console.warn("[Auth] 유효하지 않은 토큰으로 요청 실패", code, msg);

      // 토큰 정리
      await Promise.all([
        deleteToken("accessToken"),
        deleteToken("refreshToken"),
        deleteToken("expiresIn"),
      ]);

      if (!didAuthFail) {
        didAuthFail = true;
        onAuthFail?.(error);
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export function resetAuthFailFlag() {
  didAuthFail = false;
}
