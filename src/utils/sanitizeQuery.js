export function sanitizeQuery(query = "") {
  return query
    .replace(/[^a-zA-Z0-9가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
