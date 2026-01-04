import FallGreen1 from "@assets/flowers/fall/green1.svg";
import FallGreen2 from "@assets/flowers/fall/green2.svg";
import FallGreen3 from "@assets/flowers/fall/green3.svg";
import FallGreen4 from "@assets/flowers/fall/green4.svg";
import FallPink1 from "@assets/flowers/fall/pink1.svg";
import FallPink2 from "@assets/flowers/fall/pink2.svg";
import FallPink3 from "@assets/flowers/fall/pink3.svg";
import FallPink4 from "@assets/flowers/fall/pink4.svg";
import FallYellow1 from "@assets/flowers/fall/yellow1.svg";
import FallYellow2 from "@assets/flowers/fall/yellow2.svg";
import FallYellow3 from "@assets/flowers/fall/yellow3.svg";
import FallYellow4 from "@assets/flowers/fall/yellow4.svg";
import SpringGreen1 from "@assets/flowers/spring/green1.svg";
import SpringGreen2 from "@assets/flowers/spring/green2.svg";
import SpringGreen3 from "@assets/flowers/spring/green3.svg";
import SpringGreen4 from "@assets/flowers/spring/green4.svg";
import SpringPink1 from "@assets/flowers/spring/pink1.svg";
import SpringPink2 from "@assets/flowers/spring/pink2.svg";
import SpringPink3 from "@assets/flowers/spring/pink3.svg";
import SpringPink4 from "@assets/flowers/spring/pink4.svg";
import SpringYellow1 from "@assets/flowers/spring/yellow1.svg";
import SpringYellow2 from "@assets/flowers/spring/yellow2.svg";
import SpringYellow3 from "@assets/flowers/spring/yellow3.svg";
import SpringYellow4 from "@assets/flowers/spring/yellow4.svg";
import SummerGreen1 from "@assets/flowers/summer/green1.svg";
import SummerGreen2 from "@assets/flowers/summer/green2.svg";
import SummerGreen3 from "@assets/flowers/summer/green3.svg";
import SummerGreen4 from "@assets/flowers/summer/green4.svg";
import SummerPink1 from "@assets/flowers/summer/pink1.svg";
import SummerPink2 from "@assets/flowers/summer/pink2.svg";
import SummerPink3 from "@assets/flowers/summer/pink3.svg";
import SummerPink4 from "@assets/flowers/summer/pink4.svg";
import SummerYellow1 from "@assets/flowers/summer/yellow1.svg";
import SummerYellow2 from "@assets/flowers/summer/yellow2.svg";
import SummerYellow3 from "@assets/flowers/summer/yellow3.svg";
import SummerYellow4 from "@assets/flowers/summer/yellow4.svg";
import WinterGreen1 from "@assets/flowers/winter/green1.svg";
import WinterGreen2 from "@assets/flowers/winter/green2.svg";
import WinterGreen3 from "@assets/flowers/winter/green3.svg";
import WinterGreen4 from "@assets/flowers/winter/green4.svg";
import WinterPink1 from "@assets/flowers/winter/pink1.svg";
import WinterPink2 from "@assets/flowers/winter/pink2.svg";
import WinterPink3 from "@assets/flowers/winter/pink3.svg";
import WinterPink4 from "@assets/flowers/winter/pink4.svg";
import WinterYellow1 from "@assets/flowers/winter/yellow1.svg";
import WinterYellow2 from "@assets/flowers/winter/yellow2.svg";
import WinterYellow3 from "@assets/flowers/winter/yellow3.svg";
import WinterYellow4 from "@assets/flowers/winter/yellow4.svg";

// 숫자 클수록 진한 꽃
export const FLOWER_MAP = {
  green: {
    spring: {
      1: SpringGreen1,
      2: SpringGreen2,
      3: SpringGreen3,
      4: SpringGreen4,
    },
    summer: {
      1: SummerGreen1,
      2: SummerGreen2,
      3: SummerGreen3,
      4: SummerGreen4,
    },
    fall: { 1: FallGreen1, 2: FallGreen2, 3: FallGreen3, 4: FallGreen4 },
    winter: {
      1: WinterGreen1,
      2: WinterGreen2,
      3: WinterGreen3,
      4: WinterGreen4,
    },
  },

  pink: {
    spring: { 1: SpringPink1, 2: SpringPink2, 3: SpringPink3, 4: SpringPink4 },
    summer: { 1: SummerPink1, 2: SummerPink2, 3: SummerPink3, 4: SummerPink4 },
    fall: { 1: FallPink1, 2: FallPink2, 3: FallPink3, 4: FallPink4 },
    winter: { 1: WinterPink1, 2: WinterPink2, 3: WinterPink3, 4: WinterPink4 },
  },

  yellow: {
    spring: {
      1: SpringYellow1,
      2: SpringYellow2,
      3: SpringYellow3,
      4: SpringYellow4,
    },
    summer: {
      1: SummerYellow1,
      2: SummerYellow2,
      3: SummerYellow3,
      4: SummerYellow4,
    },
    fall: {
      1: FallYellow1,
      2: FallYellow2,
      3: FallYellow3,
      4: FallYellow4,
    },
    winter: {
      1: WinterYellow1,
      2: WinterYellow2,
      3: WinterYellow3,
      4: WinterYellow4,
    },
  },
};

export function clampLevel(n) {
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 4;
}

// 월별로 계절 매핑
export function monthToSeason(month) {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

export function getFlowerComponent({ themeKey, season, count }) {
  if (!count) return null;
  const level = clampLevel(count);
  return FLOWER_MAP?.[themeKey]?.[season]?.[level] ?? null;
}
