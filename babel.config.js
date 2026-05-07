module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo"], "nativewind/babel"],

    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
      // --- 여기에 추가합니다 ---
      [
        "inline-import",
        {
          extensions: [".sql"],
        },
      ],
      // -----------------------
      "react-native-worklets/plugin",
    ],
  };
};
