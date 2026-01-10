import CafeAchiever from "@assets/report/character/cafe_achiever.png";
import CafeAdventurer from "@assets/report/character/cafe_adventurer.png";
import CafeCreator from "@assets/report/character/cafe_creator.png";
import CafeExplorer from "@assets/report/character/cafe_explorer.png";
import CafeLearner from "@assets/report/character/cafe_learner.png";
import CafeOverImmersed from "@assets/report/character/cafe_over_immersed.png";
import CafeRomantic from "@assets/report/character/cafe_romantic.png";
import HomeAchiever from "@assets/report/character/home_achiever.png";
import HomeAdventurer from "@assets/report/character/home_adventurer.png";
import HomeCreator from "@assets/report/character/home_creator.png";
import HomeExplorer from "@assets/report/character/home_explorer.png";
import HomeLearner from "@assets/report/character/home_learner.png";
import HomeOverImmersed from "@assets/report/character/home_over_immersed.png";
import HomeRomantic from "@assets/report/character/home_romantic.png";
import LibraryAchiever from "@assets/report/character/library_achiever.png";
import LibraryAdventurer from "@assets/report/character/library_adventurer.png";
import LibraryCreator from "@assets/report/character/library_creator.png";
import LibraryExplorer from "@assets/report/character/library_explorer.png";
import LibraryLearner from "@assets/report/character/library_learner.png";
import LibraryOverImmersed from "@assets/report/character/library_over_immersed.png";
import LibraryRomantic from "@assets/report/character/library_romantic.png";
import MoveAchiever from "@assets/report/character/move_achiever.png";
import MoveAdventurer from "@assets/report/character/move_adventurer.png";
import MoveCreator from "@assets/report/character/move_creator.png";
import MoveExplorer from "@assets/report/character/move_explorer.png";
import MoveLearner from "@assets/report/character/move_learner.png";
import MoveOverImmersed from "@assets/report/character/move_over_immersed.png";
import MoveRomantic from "@assets/report/character/move_romantic.png";

// 한국어 페르소나 -> 파일 슬러그 매핑
export const PERSONA_SLUG_MAP = {
  과몰입러: "over_immersed",
  탐구자: "explorer",
  갓생러: "achiever",
  크리에이터: "creator",
  낭만러: "romantic",
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
