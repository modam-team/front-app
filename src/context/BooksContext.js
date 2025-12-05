import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const BooksContext = createContext(null);

const initialShelves = {
  before: [],
  reading: [],
  after: [],
};

export function BooksProvider({ children }) {
  const [shelves, setShelves] = useState(initialShelves);
  const [lastShelf, setLastShelf] = useState(null);

  const addBook = useCallback((book, { shelf = "before", place, replace = false, fromShelf } = {}) => {
    const bookId = book?.id ?? `${Date.now()}`;
    setShelves((prev) => {
      const safeShelf = shelf === "reading" || shelf === "after" ? shelf : "before";
      const next = { ...prev };

      // 선택된 책을 기존 선반들에서 제거 (상태 변경 시 중복 방지)
      if (replace || fromShelf) {
        Object.keys(next).forEach((key) => {
          if (!replace && fromShelf && key !== fromShelf) return;
          next[key] = (next[key] || []).filter((b) => (b?.id ?? b) !== bookId);
        });
      }

      const payload = {
        ...book,
        id: bookId,
        place: place || null,
      };

      next[safeShelf] = [...(next[safeShelf] || []), payload];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ shelves, addBook, lastShelf, setLastShelf }),
    [shelves, addBook, lastShelf]
  );

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooks must be used within BooksProvider");
  return ctx;
}
