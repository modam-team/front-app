import { getToken } from "@utils/secureStore";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// 모든 요청에 대해서 Authorization 헤더를 자동으로 추가하도록
client.interceptors.request.use(async (config) => {
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
