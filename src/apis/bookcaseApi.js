import { client } from "@apis/clientApi";

// 책장 목록 조회
export async function fetchBookcase() {
  // swagger 기준: /api/bookcase (v1 prefix 없음)
  const res = await client.get("/api/bookcase");
  return res.data?.responseDto;
}

// 책장에 책 추가
export async function addBookToBookcase(bookId, state = "BEFORE") {
  const payload = { bookId, state };
  const res = await client.post("/api/bookcase", payload);
  return res.data?.responseDto;
}

// 책 상태 변경 (전/중/후)
export async function updateBookcaseState(bookId, state = "BEFORE") {
  const payload = { bookId, state };
  const res = await client.patch("/api/bookcase", payload);
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

// 책 삭제
export async function deleteBookFromBookcase(bookId) {
  if (!bookId) return null;
  const res = await client.delete(`/api/bookcase/${bookId}`);
  return res.data?.responseDto;
}
