import notifee, { EventType, AndroidImportance, AndroidColor } from '@notifee/react-native';
import { navigate } from '@/app/navigation/navigationRef';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // Small delay to ensure navigation is mounted when app opens from dead state
    setTimeout(() => {
      navigate('Tabs', { screen: 'Downloads' } as any);
    }, 100);
  }
});

notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    navigate('Tabs', { screen: 'Downloads' } as any);
  }
});

class NotificationService {
  private channelId: string = 'downloads';

  async initChannels() {
    this.channelId = await notifee.createChannel({
      id: 'downloads',
      name: 'Downloads',
      importance: AndroidImportance.LOW, // Low importance so it doesn't vibrate/make sound on every update
    });
  }

  async showDownloadProgressNotification(
    taskId: string,
    title: string,
    progress: number,
    isPaused: boolean = false,
    thumbnailUrl?: string
  ) {
    await notifee.displayNotification({
      id: taskId,
      title: 'Downloading...',
      body: title,
      android: {
        channelId: this.channelId,
        smallIcon: 'notification_icon',
        asForegroundService: true,
        onlyAlertOnce: true, // Don't alert on every progress update
        color: AndroidColor.AQUA,
        pressAction: { id: 'default', launchActivity: 'default' },
        ...(thumbnailUrl ? { largeIcon: thumbnailUrl } : {}),
        progress: {
          max: 100,
          current: Math.round(progress * 100),
          indeterminate: false,
        },
        actions: [
          {
            title: isPaused ? 'Resume' : 'Pause',
            pressAction: {
              id: isPaused ? 'resume-download' : 'pause-download',
            },
          },
          {
            title: 'Cancel',
            pressAction: {
              id: 'cancel-download',
            },
          },
        ],
      },
    });
  }

  async showDownloadCompleteNotification(taskId: string, title: string, thumbnailUrl?: string) {
    await notifee.displayNotification({
      id: taskId,
      title: 'Download Completed',
      body: title,
      android: {
        channelId: this.channelId,
        smallIcon: 'notification_icon',
        color: AndroidColor.AQUA,
        pressAction: { id: 'default', launchActivity: 'default' },
        ...(thumbnailUrl ? { largeIcon: thumbnailUrl } : {}),
      },
    });
  }

  async showDownloadErrorNotification(taskId: string, title: string, errorMsg?: string) {
    await notifee.displayNotification({
      id: taskId,
      title: 'Download Failed',
      body: `${title}\n${errorMsg ?? ''}`,
      android: {
        channelId: this.channelId,
        color: AndroidColor.RED,
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });
  }

  async removeNotification(taskId: string) {
    await notifee.cancelNotification(taskId);
  }

  async requestPermissions() {
    await notifee.requestPermission();
  }

  async stopForegroundService() {
    try {
      await notifee.stopForegroundService();
    } catch (e) {
      // Ignored
    }
  }
}

export const notificationService = new NotificationService();
