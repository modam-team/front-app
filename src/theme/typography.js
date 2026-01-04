// 공통 기본값
const baseText = {
  fontFamily: "Pretendard",
  color: "#191919",
};

// 개별 텍스트 스타일
export const typography = {
  // Headings
  "heading-1-medium": {
    ...baseText,
    fontSize: 24,
    fontWeight: "500",
  },
  "heading-2-medium": {
    ...baseText,
    fontSize: 22,
    fontWeight: "500",
  },
  "heading-3-medium": {
    ...baseText,
    fontSize: 20,
    fontWeight: "500",
  },
  "heading-4-medium": {
    ...baseText,
    fontSize: 18,
    fontWeight: "500",
  },
  "heading-4-bold": {
    ...baseText,
    fontSize: 18,
    fontWeight: "700",
  },

  // Body 1
  "body-1-bold": {
    ...baseText,
    fontSize: 16,
    fontWeight: "700",
  },
  "body-1-regular": {
    ...baseText,
    fontSize: 16,
    fontWeight: "400",
  },

  // Body 2
  "body-2-bold": {
    ...baseText,
    fontSize: 14,
    fontWeight: "700",
  },
  "body-2-regular": {
    ...baseText,
    fontSize: 14,
    fontWeight: "400",
  },

  // Detail
  "detail-bold": {
    ...baseText,
    fontSize: 12,
    fontWeight: "700",
  },
  "detail-regular": {
    ...baseText,
    fontSize: 12,
    fontWeight: "400",
  },
  "detail-2-bold": {
    ...baseText,
    fontSize: 10,
    fontWeight: "700",
  },
  "detail-2-regular": {
    ...baseText,
    fontSize: 10,
    fontWeight: "400",
  },
};
