/* global require, module */
const { withPodfile } = require("@expo/config-plugins");

const SETTING_KEY = "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES";
const INSERT_BLOCK = `  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['${SETTING_KEY}'] = 'YES'
    end
  end
`;

function withNonModularHeaders(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes(SETTING_KEY)) {
      return config;
    }

    if (contents.includes("post_install do |installer|")) {
      config.modResults.contents = contents.replace(
        /post_install do \|installer\|\n/,
        (match) => `${match}${INSERT_BLOCK}`,
      );
      return config;
    }

    config.modResults.contents = `${contents}\npost_install do |installer|\n${INSERT_BLOCK}end\n`;
    return config;
  });
}

module.exports = withNonModularHeaders;
