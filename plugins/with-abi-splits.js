const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to inject ABI splits and universalApk true into android/app/build.gradle
 * This ensures EAS Build cloud workers (and local builds) generate both split APKs and the universal APK in CNG workflow.
 */
module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('splits {')) {
      const splitConfig = `
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk true
        }
    }
`;
      config.modResults.contents = config.modResults.contents.replace(
        /namespace 'com\.genyt\.mobile'/,
        `${splitConfig}\n    namespace 'com.genyt.mobile'`
      );
    }
    return config;
  });
};
