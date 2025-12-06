import { getToken } from "@utils/secureStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

// 책 검색: 서버 스펙이 애매하여 POST→GET 순으로 시도
export async function searchBooks(query) {
  const trimmed = query?.trim() ?? "";
  const isKeyword = !!trimmed;
  const payload = isKeyword
    ? { query: trimmed, queryType: "Keyword" }
    : { queryType: "Bestseller" };

  const token = await getToken("accessToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1) POST 시도 (Body 허용 확실)
  let res = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // 405/404/500 등에서 GET 재시도
  if (!res.ok && [404, 405].includes(res.status)) {
    res = await fetch(
      `${API_BASE_URL}/search?queryType=${payload.queryType}${
        payload.query ? `&query=${encodeURIComponent(payload.query)}` : ""
      }`,
      {
        method: "GET",
        headers,
      },
    );
  }

  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { message: text };
    }
    const err = new Error("책 검색 실패");
    err.response = parsed;
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  return json?.responseDto ?? [];
}
