import Basic from "@assets/basic-profile.svg";
import Achiever from "@assets/default-character/achiever.svg";
import Adventurer from "@assets/default-character/adventurer.svg";
import Creator from "@assets/default-character/creator.svg";
import Explorer from "@assets/default-character/explorer.svg";
import Learner from "@assets/default-character/learner.svg";
import OverImmersed from "@assets/default-character/over_immersed.svg";
import Romantic from "@assets/default-character/romantic.svg";
import { READING_TENDENCY_MAP } from "@constants/readingTendencyMap";

// 서버에서 주는 readingTendency를 한국어 캐릭터 이름으로 변환해주는 용도
export const DEFAULT_CHARACTER_SVG_MAP = {
  과몰입러: OverImmersed,
  탐구자: Explorer,
  갓생러: Achiever,
  크리에이터: Creator,
  낭만러: Romantic,
  탐험가: Adventurer,
  꿈나무: Learner,
};

// readingTendency에 따라서 캐릭터 svg 컴포넌트
export function pickDefaultCharacterByTendency(readingTendency) {
  const personaKr = READING_TENDENCY_MAP?.[readingTendency]; // ex) 성취발전형이면 갓생러로 매핑해줌
  return DEFAULT_CHARACTER_SVG_MAP?.[personaKr] || Basic; // fallback은 기본 캐릭터로
}
