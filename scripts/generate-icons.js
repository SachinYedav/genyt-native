const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../assets');

// Brand colors based on theme
const BRAND_RED = '#FF0033';
const BRAND_WHITE = '#FFFFFF';

// Custom Brand SVG 
const getSvg = (color, strokeWidth = 2.5) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 9a.5.5 0 0 1 .75-.43l5 3a.5.5 0 0 1 0 .86l-5 3A.5.5 0 0 1 10 15V9Z" fill="${color}" stroke="none"/>
  <rect width="20" height="14" x="2" y="5" rx="4" />
</svg>`;

async function generateIcons() {
  console.log('Generating crisp GenYT Pro icons...');

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // 1. App Icon (1024x1024) - White Background with Red Icon
  const iconSvg = getSvg(BRAND_RED, 2.5).replace('width="1024" height="1024"', 'width="600" height="600"');
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BRAND_WHITE }
  })
    .composite([{ input: Buffer.from(iconSvg), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✅ Created icon.png (App Icon)');

  // 2. Splash Icon (1280x1280) - Transparent Background with Red Icon
  // Official Expo/Android 12+ recommendation for crisp scaling
  const splashSvg = getSvg(BRAND_RED, 2.5).replace('width="1024" height="1024"', 'width="1280" height="1280"');
  await sharp(Buffer.from(splashSvg))
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✅ Created splash-icon.png (Splash Screen - 1280x1280)');

  // 3. Android Adaptive Foreground (1080x1080) - Transparent with Red Icon, padded
  const adaptiveForegroundSvg = getSvg(BRAND_RED, 2.5).replace('width="1024" height="1024"', 'width="600" height="600"');
  await sharp({
    create: { width: 1080, height: 1080, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: Buffer.from(adaptiveForegroundSvg), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('✅ Created android-icon-foreground.png');

  // 4. Android Adaptive Background (1080x1080) - Solid White
  await sharp({
    create: { width: 1080, height: 1080, channels: 4, background: BRAND_WHITE }
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('✅ Created android-icon-background.png');

  // 5. Android Adaptive Monochrome (1080x1080) - MUST BE SOLID WHITE OR BLACK
  // Creating a new SVG specifically for Monochrome with White color
  const monochromeSvg = getSvg(BRAND_WHITE, 2.5).replace('width="1024" height="1024"', 'width="600" height="600"');
  await sharp({
    create: { width: 1080, height: 1080, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: Buffer.from(monochromeSvg), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
  console.log('✅ Created android-icon-monochrome.png (Pure White for Android 13+)');

  // 6. Notification Icon (96x96) - Transparent with Solid White Icon
  const notificationSvg = getSvg(BRAND_WHITE, 2.5).replace('width="1024" height="1024"', 'width="96" height="96"');
  await sharp({
    create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: Buffer.from(notificationSvg), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'notification-icon.png'));
  console.log('✅ Created notification-icon.png (Android Status Bar)');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
