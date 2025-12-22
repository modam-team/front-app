module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@apis": "./src/apis",
            "@assets": "./assets",
            "@components": "./src/components",
            "@constants": "./src/constants",
            "@navigation": "./src/navigation",
            "@screens": "./src/screens",
            "@store": "./src/store",
            "@theme": "./src/theme",
            "@utils": "./src/utils",
            "@mocks": "./src/mocks",
          },
        },
      ],
      "react-native-reanimated/plugin", // 반드시 마지막
    ],
  };
};
