import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';

notifee.onBackgroundEvent(async ({ type, detail }) => {
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

notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Keep the service alive. It will be stopped automatically when the notification is cancelled or the download completes.
  });
});

registerRootComponent(App);
