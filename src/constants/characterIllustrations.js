import Achiever from "../../assets/svg/achiever.svg";
import Adventurer from "../../assets/svg/adventurer.svg";
import Creator from "../../assets/svg/creator.svg";
import Dreamer from "../../assets/svg/dreamer.svg";
import Explorer from "../../assets/svg/explorer.svg";
import LifeLover from "../../assets/svg/life-lover.svg";
import Romantic from "../../assets/svg/romantic.svg";

export const CHARACTER_ILLUSTRATIONS = {
  // 순서: 과몰입러, 탐구자, 갓생러, 크리에이터, 낭만러, 탐험가, 꿈나무
  과몰입러: Explorer,
  탐구자: LifeLover,
  갓생러: Achiever,
  크리에이터: Creator,
  낭만러: Romantic,
  낭만가: Romantic, // fallback for older copy
  탐험가: Adventurer,
  꿈나무: Dreamer,
  default: Explorer,
  empty: null,
};
