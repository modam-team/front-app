import { client } from "@apis/clientApi";
import { getToken } from "@utils/secureStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// 책 검색: POST /search, 실패 시 GET /search
export async function searchBooks(query) {
  const trimmed = (query || "").trim();
  if (trimmed && trimmed.length < 2) {
    const err = new Error("검색어는 2글자 이상 입력해주세요.");
    err.status = 400;
    err.code = "SHORT_QUERY";
    throw err;
  }
  const payloads = trimmed
    ? [{ query: trimmed, queryType: "Keyword" }]
    : [{ queryType: "Bestseller" }];

  const token = await getToken("accessToken");
  if (!token) {
    const err = new Error("로그인이 필요합니다. 다시 로그인해 주세요.");
    err.code = "NO_TOKEN";
    err.status = 401;
    throw err;
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (let i = 0; i < payloads.length; i += 1) {
    const payload = payloads[i];
    try {
      const res = await client.post("/search", payload, { headers });
      return res.data?.responseDto ?? [];
    } catch (e) {
      const status = e.response?.status;
      if ([400, 404, 405].includes(status)) {
        try {
          const res = await client.get("/search", {
            params: {
              queryType: payload.queryType,
              ...(payload.query ? { query: payload.query } : {}),
            },
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          return res.data?.responseDto ?? [];
        } catch (err) {
          console.warn("searchBooks GET fallback failed:", err.response?.data);
        }
      }

      if (i === payloads.length - 1) {
        const errObj = new Error(
          status === 401 || status === 403
            ? "세션이 만료되었습니다. 다시 로그인해주세요."
            : "책 검색 실패",
        );
        errObj.response = e.response?.data;
        errObj.status = status;
        console.error(
          "searchBooks failed payload:",
          payload,
          "status:",
          status,
          "data:",
          errObj.response,
        );
        throw errObj;
      }
    }
  }
}

// 미수록 책 관리자 요청
export async function requestBookRegistration({
  title,
  author,
  publisher,
  category,
}) {
  const token = await getToken("accessToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const body = {
    title,
    author,
    publisher,
    category,
  };

  const res = await fetch(`${API_BASE_URL}/request`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const err = new Error("책 요청 실패");
    err.response = json;
    err.status = res.status;
    throw err;
  }

  return json?.responseDto ?? json;
}
