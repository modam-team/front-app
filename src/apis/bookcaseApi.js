import { client } from "@apis/clientApi";

// 책장 목록 조회
export async function fetchBookcase() {
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
  const res = await client.get("/api/review", { params: { bookId } });
  return res.data?.responseDto;
}

// 리뷰 생성
export async function createReview({
  bookId,
  rating,
  hashtag = [],
  comment = "",
}) {
  const payload = { bookId, rating, hashtag, comment };
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
  const res = await client.get("/api/bookcase/recommend");
  return res.data?.responseDto || [];
}
