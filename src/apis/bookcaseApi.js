import { client } from "@apis/clientApi";
import { getToken } from "@utils/secureStore";

// 책장 목록 조회
export async function fetchBookcase() {
  // 로그인 이전에는 호출하지 않도록 토큰을 확인
  const token = await getToken("accessToken");
  if (!token) {
    return { before: [], reading: [], after: [] };
  }

  // swagger 기준: /api/bookcase (v1 prefix 없음)
  const res = await client.get("/api/bookcase");
  return res.data?.responseDto;
}

// 책장에 책 추가
export async function addBookToBookcase(
  bookId,
  state = "BEFORE",
  { startDate, endDate } = {},
) {
  const payload = {
    bookId,
    state,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
  const res = await client.post("/api/bookcase", payload);
  return res.data?.responseDto;
}

// 책장 상태별 검색
export async function searchBookcase(title, state) {
  const res = await client.get("/api/bookcase/search", {
    params: { title, state },
  });
  return res.data?.responseDto || [];
}

// 책 상태 변경 (전/중/후)
export async function updateBookcaseState(
  bookId,
  state = "BEFORE",
  { startDate, endDate } = {},
) {
  const payload = {
    bookId,
    state,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
  const res = await client.patch("/api/bookcase", payload);
  return res.data?.responseDto;
}

// 리뷰 조회
export async function fetchReview(bookId) {
  if (!bookId) return null;
  try {
    const res = await client.get("/api/review", { params: { bookId } });
    return res.data?.responseDto;
  } catch (e) {
    // 리뷰가 없거나 서버에서 null로 응답해도 앱이 깨지지 않도록 무시
    const status = e?.response?.status;
    const code = e?.response?.data?.error?.code;
    if (status === 404 || code === "RR404") return null;
    console.warn("리뷰 조회 실패:", e?.response?.data || e.message);
    return null;
  }
}

// 리뷰 전체 리스트 조회 (가능한 엔드포인트를 순차 시도)
export async function fetchReviewsList(bookId) {
  if (!bookId) return [];
  // 0) /api/review/search (문서: 책 검색 시 리뷰 조회)
  try {
    const res = await client.get("/api/review/search", { params: { bookId } });
    const list = res.data?.responseDto ?? res.data;
    if (Array.isArray(list)) return list;
  } catch (e) {
    // 계속 진행
  }

  // 1) /api/review/list 시도
  try {
    const res = await client.get("/api/review/list", { params: { bookId } });
    const list = res.data?.responseDto ?? res.data;
    if (Array.isArray(list)) return list;
  } catch (e) {
    // 계속 진행
  }

  // 2) /api/review (배열 반환 시) 폴백
  try {
    const res = await client.get("/api/review", { params: { bookId } });
    const data = res.data?.responseDto ?? res.data;
    if (Array.isArray(data)) return data;
    if (data) return [data]; // 단일인 경우 배열로 감싸기
  } catch (e) {
    console.warn("리뷰 목록 조회 실패:", e?.response?.data || e.message);
  }
  return [];
}

// 다른 유저 리뷰 조회 (해시태그 등)
export async function fetchOtherReview({ bookId, otherId }) {
  if (!bookId || otherId == null) return null;
  try {
    const res = await client.get("/api/review/other", {
      params: { bookId, otherId },
    });
    return res.data?.responseDto ?? null;
  } catch (e) {
    return null;
  }
}

// 리뷰 생성
export async function createReview({
  bookId,
  rating,
  hashtag = [],
  comment = "",
}) {
  const safeTags = Array.isArray(hashtag)
    ? hashtag.filter((t) => typeof t === "string" && t.trim().length > 0)
    : [];
  const payload = { bookId, rating, hashtag: safeTags, comment };
  const res = await client.post("/api/review", payload);
  return res.data?.responseDto;
}

// 리뷰 수정 (코멘트 등)
export async function updateReview({ bookId, comment = "" }) {
  const payload = { bookId, comment };
  const res = await client.patch("/api/review", payload);
  return res.data?.responseDto;
}

// 책 삭제
export async function deleteBookFromBookcase(bookId) {
  if (!bookId) return null;
  const res = await client.delete(`/api/bookcase/${bookId}`);
  return res.data?.responseDto;
}

// 홈 추천 2권
export async function fetchRecommendedBooks() {
  const token = await getToken("accessToken");
  if (!token) return [];

  const res = await client.get("/api/bookcase/recommend");
  return res.data?.responseDto || [];
}

// 책 검색 시 리뷰 리스트 조회 (다른 유저들 리뷰)
export async function fetchReviewListByBookId(bookId) {
  if (!bookId) return [];

  try {
    const res = await client.get("/api/review/search", {
      params: { bookId: Number(bookId) },
    });

    return res.data?.responseDto || [];
  } catch (e) {
    console.warn("리뷰 리스트 조회 실패:", e?.response?.data || e.message);
    return [];
  }
}
