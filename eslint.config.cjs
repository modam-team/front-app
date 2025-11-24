const js = require("@eslint/js");
const eslintConfigPrettier = require("eslint-config-prettier");
const reactPlugin = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const globals = require("globals");

module.exports = [
  {
    settings: {
      react: {
        version: "19.1.0",
      },
    },

    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "android",
      "ios",
      ".expo",
      ".expo-shared",
    ],
  },

  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  eslintConfigPrettier,

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
    },

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
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

  {
    files: ["babel.config.js", "metro.config.js"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {},
  },
];
