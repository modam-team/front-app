// 단어 단위로 줄바꿈 처리하는 유틸 함수 (한 줄에 최대 20자 까지만 보이도록 !)
export function splitToLines(text, maxLen = 20) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const w of words) {
    if ((current + " " + w).trim().length <= maxLen) {
      current += (current ? " " : "") + w;
    } else {
      lines.push(current);
      current = w;
    }
  }

  if (current) lines.push(current);

  return lines;
}
