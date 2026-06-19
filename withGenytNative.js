const { withAndroidManifest, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const withGenytNative = (config) => {
  // 1. Modify AndroidManifest for Notifee DataSync
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    const app = androidManifest.application[0];
    
    if (!app.service) {
      app.service = [];
    }
    
    // Check if the notifee foreground service already exists
    const hasService = app.service.some(
      (s) => s.$['android:name'] === 'app.notifee.core.ForegroundService'
    );
    
    if (!hasService) {
      app.service.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:foregroundServiceType': 'dataSync',
          'android:exported': 'false',
          'tools:replace': 'android:foregroundServiceType'
        }
      });
    } else {
      // Update existing service if found
      const service = app.service.find((s) => s.$['android:name'] === 'app.notifee.core.ForegroundService');
      service.$['android:foregroundServiceType'] = 'dataSync';
      service.$['tools:replace'] = 'android:foregroundServiceType';
    }

    return config;
  });

  // 3. Modify app/build.gradle for coreLibraryDesugaring
  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    
    if (!buildGradle.includes('coreLibraryDesugaringEnabled true')) {
      buildGradle = buildGradle.replace(
        /compileOptions\s*\{/,
        `compileOptions {\n        coreLibraryDesugaringEnabled true`
      );
    }

    if (!buildGradle.includes('com.android.tools:desugar_jdk_libs_nio')) {
      buildGradle = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.1.4'`
      );
    }
    
    config.modResults.contents = buildGradle;
    return config;
  });

  // 4. Copy notification icon using dangerous mod
  const fs = require('fs');
  const path = require('path');
  const { withDangerousMod } = require('@expo/config-plugins');

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const iconPath = path.join(config.modRequest.projectRoot, 'assets', 'notification-icon.png');
      const resPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      
      const drawableDirs = ['drawable', 'drawable-mdpi', 'drawable-hdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];
      
      if (fs.existsSync(iconPath)) {
        drawableDirs.forEach(dir => {
          const dirPath = path.join(resPath, dir);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          fs.copyFileSync(iconPath, path.join(dirPath, 'notification_icon.png'));
        });
      }
      return config;
    },
  ]);

  return config;
};

module.exports = createRunOncePlugin(withGenytNative, 'withGenytNative', '1.0.0');
