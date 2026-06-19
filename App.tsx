import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import notifee, { EventType } from '@notifee/react-native';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { AppProviders } from './src/app/providers/AppProviders';
import { initDatabase } from './src/services/database/db';
import { notificationService } from './src/services/notifications/notificationService';

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Run all critical async initialization tasks here
        // We initialize SQLite sync database and request permissions
        initDatabase();
        await notificationService.requestPermissions();

        // If fonts or other critical assets are added later, await them here using Promise.all
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;

      if (type === EventType.ACTION_PRESS && pressAction?.id) {
        // Dynamically import to avoid circular dependencies
        const { pauseDownload, resumeDownload, cancelDownload } = await import('./src/services/downloads/downloadService');
        const taskId = notification?.id;

        if (!taskId) return;

        if (pressAction.id === 'pause-download') {
          await pauseDownload(taskId);
        } else if (pressAction.id === 'resume-download') {
          await resumeDownload(taskId);
        } else if (pressAction.id === 'cancel-download') {
          await cancelDownload(taskId);
        }
      }
    });

    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // ONLY hide the splash screen when the layout has fully painted.
      // This completely eliminates the white flash race condition.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }} onLayout={onLayoutRootView}>
      <AppProviders>
        <AppNavigator />
      </AppProviders>
    </View>
  );
}
