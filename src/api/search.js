// 백엔드 검색 API 유틸 (fetch 버전)
const BASE = "http://13.209.67.100:8080";

/**
 * @param {string} query      - 검색어 (예: "자바")
 * @param {"Title"|"Author"|"Publisher"|"Content"} queryType
 * @returns {Promise<{items: Array<{id:string|number,title:string,author?:string,cover?:string,_raw:any}>}>}
 */
export async function searchBooks(query, queryType = "Title") {
    const q = encodeURIComponent((query || "").trim());
    if (!q) return { items: [] };

    const res = await fetch(`${BASE}/search?query=${q}&queryType=${queryType}`, {
        method: "GET",
    });
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }

    const json = await res.json();

    // 서버 응답은 { responseDto: [...] } 형태
    const raw = json?.responseDto ?? json?.items ?? (Array.isArray(json) ? json : []);
    const list = Array.isArray(raw) ? raw : [];

    // 화면 공통 스키마로 매핑
    const items = list.map((it, i) => ({
        _raw: it,
        id: it.id ?? it.isbn ?? `${it.title ?? "untitled"}_${it.publisher ?? ""}_${i}`,
        title: it.title ?? it.bookTitle ?? it.name ?? "",
        author: it.author ?? (Array.isArray(it.authors) ? it.authors[0] : undefined),
        cover:
            it.cover ||
            it.thumbnailUrl || it.thumbnail || it.imageUrl || it.image ||
            it.coverUrl || it.bookImage || it.img || it.poster || null,
    }));

    return { items };
}
