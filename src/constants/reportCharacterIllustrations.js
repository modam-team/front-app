import CafeAchiever from "@assets/report/character/cafe_achiever.svg";
import CafeAdventurer from "@assets/report/character/cafe_adventurer.svg";
import CafeCreator from "@assets/report/character/cafe_creator.svg";
import CafeExplorer from "@assets/report/character/cafe_explorer.svg";
import CafeLearner from "@assets/report/character/cafe_learner.svg";
import CafeOverImmersed from "@assets/report/character/cafe_over_immersed.svg";
import CafeRomantic from "@assets/report/character/cafe_romantic.svg";
import HomeAchiever from "@assets/report/character/home_achiever.svg";
import HomeAdventurer from "@assets/report/character/home_adventurer.svg";
import HomeCreator from "@assets/report/character/home_creator.svg";
import HomeExplorer from "@assets/report/character/home_explorer.svg";
import HomeLearner from "@assets/report/character/home_learner.svg";
import HomeOverImmersed from "@assets/report/character/home_over_immersed.svg";
import HomeRomantic from "@assets/report/character/home_romantic.svg";
import LibraryAchiever from "@assets/report/character/library_achiever.svg";
import LibraryAdventurer from "@assets/report/character/library_adventurer.svg";
import LibraryCreator from "@assets/report/character/library_creator.svg";
import LibraryExplorer from "@assets/report/character/library_explorer.svg";
import LibraryLearner from "@assets/report/character/library_learner.svg";
import LibraryOverImmersed from "@assets/report/character/library_over_immersed.svg";
import LibraryRomantic from "@assets/report/character/library_romantic.svg";
import MoveAchiever from "@assets/report/character/move_achiever.svg";
import MoveAdventurer from "@assets/report/character/move_adventurer.svg";
import MoveCreator from "@assets/report/character/move_creator.svg";
import MoveExplorer from "@assets/report/character/move_explorer.svg";
import MoveLearner from "@assets/report/character/move_learner.svg";
import MoveOverImmersed from "@assets/report/character/move_over_immersed.svg";
import MoveRomantic from "@assets/report/character/move_romantic.svg";

// 한국어 페르소나 -> 파일 슬러그 매핑
export const PERSONA_SLUG_MAP = {
  과몰입러: "over_immersed",
  탐구자: "explorer",
  갓생러: "achiever",
  크리에이터: "creator",
  낭만러: "romantic",
  낭만가: "romantic",
  탐험가: "adventurer",
  꿈나무: "learner",
};

// placeKey -> 파일 place 슬러그 매핑
export const PLACE_SLUG_MAP = {
  CAFE: "cafe",
  HOME: "home",
  LIBRARY: "library",
  MOVING: "move",
};

// (placeSlug, personaSlug) -> 합쳐진 SVG 컴포넌트
export const REPORT_CHARACTER_ILLUSTRATION_MAP = {
  cafe: {
    achiever: CafeAchiever,
    adventurer: CafeAdventurer,
    creator: CafeCreator,
    explorer: CafeExplorer,
    learner: CafeLearner,
    over_immersed: CafeOverImmersed,
    romantic: CafeRomantic,
  },
  home: {
    achiever: HomeAchiever,
    adventurer: HomeAdventurer,
    creator: HomeCreator,
    explorer: HomeExplorer,
    learner: HomeLearner,
    over_immersed: HomeOverImmersed,
    romantic: HomeRomantic,
  },
  library: {
    achiever: LibraryAchiever,
    adventurer: LibraryAdventurer,
    creator: LibraryCreator,
    explorer: LibraryExplorer,
    learner: LibraryLearner,
    over_immersed: LibraryOverImmersed,
    romantic: LibraryRomantic,
  },
  move: {
    achiever: MoveAchiever,
    adventurer: MoveAdventurer,
    creator: MoveCreator,
    explorer: MoveExplorer,
    learner: MoveLearner,
    over_immersed: MoveOverImmersed,
    romantic: MoveRomantic,
  },
};
