import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
  // 전역 ignore
  globalIgnores([
    "node_modules",
    "dist",
    "build",
    "coverage",
    "android",
    "ios",
    ".expo",
    "babel.config.js",
  ]),

  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        __DEV__: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      eslintConfigPrettier,
    ],

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      // 콘솔은 경고만
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",

      // 최신 React + RN에서 필요 없는 규칙 끄기
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // react-hooks 추천 규칙 직접 추가
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // react-refresh 기본 권장 규칙 직접 추가
      "react-refresh/only-export-components": "warn",

      // 안 쓰는 변수 경고 임시로 꺼둠
      // (개발 끝나면 다시 킬거니까 최대한 안 쓰게 하세요 !!)
      "no-unused-vars": "off",
    },
  },
]);
