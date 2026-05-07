const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// sql 관련 push나 filter 코드가 있다면 삭제하고 기본 config만 사용하세요.

module.exports = withNativeWind(config, { input: "./global.css" });
