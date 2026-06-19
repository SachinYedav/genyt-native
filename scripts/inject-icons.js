const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../assets');
const RES_DIR = path.join(__dirname, '../android/app/src/main/res');

// Android DP scale factors
const SIZES = [
  { folder: 'mdpi', scale: 1 },    // 1x
  { folder: 'hdpi', scale: 1.5 },  // 1.5x
  { folder: 'xhdpi', scale: 2 },   // 2x
  { folder: 'xxhdpi', scale: 3 },  // 3x
  { folder: 'xxxhdpi', scale: 4 }  // 4x
];

async function injectIcons() {
  console.log('Injecting icons directly into Android res folder...');

  if (!fs.existsSync(RES_DIR)) {
    console.error('❌ Android res directory not found. Please ensure the android folder exists.');
    return;
  }

  try {
    for (const size of SIZES) {
      const mipmapDir = path.join(RES_DIR, `mipmap-${size.folder}`);
      const drawableDir = path.join(RES_DIR, `drawable-${size.folder}`);

      if (!fs.existsSync(mipmapDir)) fs.mkdirSync(mipmapDir, { recursive: true });
      if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

      // 1. Adaptive Foreground (Base 108dp * scale)
      const foregroundSize = Math.round(108 * size.scale);
      await sharp(path.join(ASSETS_DIR, 'android-icon-foreground.png'))
        .resize(foregroundSize, foregroundSize)
        .webp({ quality: 100 })
        .toFile(path.join(mipmapDir, 'ic_launcher_foreground.webp'));

      // 2. Adaptive Background
      await sharp(path.join(ASSETS_DIR, 'android-icon-background.png'))
        .resize(foregroundSize, foregroundSize)
        .webp({ quality: 100 })
        .toFile(path.join(mipmapDir, 'ic_launcher_background.webp'));

      // 2.5 Adaptive Monochrome
      await sharp(path.join(ASSETS_DIR, 'android-icon-monochrome.png'))
        .resize(foregroundSize, foregroundSize)
        .webp({ quality: 100 })
        .toFile(path.join(mipmapDir, 'ic_launcher_monochrome.webp'));

      // 3. Splash Screen Logo (Base 144dp * scale for a normal fit)
      const splashSize = Math.round(144 * size.scale);
      await sharp(path.join(ASSETS_DIR, 'splash-icon.png'))
        .resize(splashSize, splashSize)
        .webp({ quality: 100 })
        .toFile(path.join(drawableDir, 'splashscreen_logo.webp'));

      // 4. Notification Icon (Base 24dp * scale)
      const notifSize = Math.round(24 * size.scale);
      await sharp(path.join(ASSETS_DIR, 'notification-icon.png'))
        .resize(notifSize, notifSize)
        .png()
        .toFile(path.join(drawableDir, 'ic_notification.png'));
    }

    console.log('✅ All icons injected successfully! No full recompilation needed.');
  } catch (error) {
    console.error('❌ Error injecting icons:', error);
  }
}

injectIcons();
