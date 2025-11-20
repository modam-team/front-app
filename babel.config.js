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
            "@components": "./src/components",
            "@navigation": "./src/navigation",
            "@screens": "./src/screens",
            "@theme": "./src/theme",
          },
        },
      ],
      "react-native-reanimated/plugin", // 반드시 마지막
    ],
  };
};
