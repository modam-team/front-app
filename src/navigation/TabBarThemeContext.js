import React, { createContext, useContext, useMemo, useState } from "react";

// 탭바 테마: 기본 / 리포트-현재달
const TabBarThemeContext = createContext(null);

export function TabBarThemeProvider({ children }) {
  const [theme, setTheme] = useState("default"); // "default" | "reportCurrent"

  const value = useMemo(() => {
    return { theme, setTheme };
  }, [theme]);

  return (
    <TabBarThemeContext.Provider value={value}>
      {children}
    </TabBarThemeContext.Provider>
  );
}

export function useTabBarTheme() {
  const ctx = useContext(TabBarThemeContext);
  if (!ctx) {
    throw new Error("useTabBarTheme must be used inside TabBarThemeProvider");
  }
  return ctx;
}
