import { create } from "zustand";

export const useOnboardingStore = create((set) => ({
  goalScore: null,
  categories: [],
  nickname: "",

  // setter
  setGoalScore: (score) => set({ goalScore: score }),
  setCategories: (c) => set({ categories: c }),
  setNickname: (name) => set({ nickname: name }),

  // 모든 온보딩 정보 초기화
  resetOnboarding: () =>
    set({
      goalScore: null,
      categories: [],
      nickname: "",
    }),
}));
