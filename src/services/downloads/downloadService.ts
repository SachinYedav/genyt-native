import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { MediaFormat } from '@/entities/video/types';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { nativeExtractor } from '@/services/extraction/nativeExtractor';
import { notificationService } from '@/services/notifications/notificationService';

const GenytDownloadBridge = requireNativeModule('GenytDownloadBridge');
const downloadEmitter = new EventEmitter(GenytDownloadBridge) as any;

type DownloadProgressEvent = {
  taskId: string;
  bytesWritten: number;
  totalBytes: number;
};

type DownloadStateEvent = {
  taskId: string;
  state: 'QUEUED' | 'DOWNLOADING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  error?: string;
  finalUri?: string;
};

let channelsInitialized = false;
async function ensureChannels() {
  if (!channelsInitialized) {
    await notificationService.initChannels();
    channelsInitialized = true;
  }
}

const checkAndStopForegroundService = async () => {
  const store = useDownloadStore.getState();
  const hasActive = Object.values(store.tasks).some(
    t => t.status === 'downloading' || t.status === 'pending' // pending = QUEUED
  );
  if (!hasActive) {
    await notificationService.stopForegroundService();
  }
};

// Setup global event listeners for native events
downloadEmitter.addListener('onDownloadProgress', (event: DownloadProgressEvent) => {
  const { taskId, bytesWritten, totalBytes } = event;
  useDownloadStore.getState().updateTaskProgress(taskId, bytesWritten, totalBytes);

  const task = useDownloadStore.getState().tasks[taskId];
  if (task) {
    const progress = totalBytes > 0 ? bytesWritten / totalBytes : 0;
    notificationService.showDownloadProgressNotification(taskId, task.videoTitle, progress, false, task.thumbnailUrl);
  }
});

const downloadRetries: Record<string, number> = {};

downloadEmitter.addListener('onDownloadStateChanged', async (event: DownloadStateEvent) => {
  const { taskId, state, error, finalUri } = event;
  const store = useDownloadStore.getState();
  const task = store.tasks[taskId];
  if (!task) return;

  if (state === 'QUEUED') {
    store.updateTaskStatus(taskId, 'pending');
    notificationService.showDownloadProgressNotification(taskId, task.videoTitle, task.progress, true, task.thumbnailUrl);
  } else if (state === 'DOWNLOADING') {
    store.updateTaskStatus(taskId, 'downloading');
    notificationService.showDownloadProgressNotification(taskId, task.videoTitle, task.progress, false, task.thumbnailUrl);
  } else if (state === 'PAUSED') {
    store.updateTaskStatus(taskId, 'paused');
    notificationService.showDownloadProgressNotification(taskId, task.videoTitle, task.progress, true, task.thumbnailUrl);
  } else if (state === 'COMPLETED') {
    delete downloadRetries[taskId]; // Clear tracker on success
    store.updateTaskStatus(taskId, 'completed', { localUri: finalUri });
    await checkAndStopForegroundService();
    notificationService.showDownloadCompleteNotification(taskId, task.videoTitle, task.thumbnailUrl);
  } else if (state === 'FAILED') {
    if (error === 'HTTP_403') {
      const retryCount = downloadRetries[taskId] || 0;
      if (retryCount < 2) {
        downloadRetries[taskId] = retryCount + 1;
        // URL Expired or CDN blocked it. Attempt to re-resolve the format URL via JS.
        try {
          const resolved = await nativeExtractor.resolveFormat(task.format.extractionSessionId!, task.format.id);
          if (resolved.url) {
            GenytDownloadBridge.resumeNativeDownload(taskId, resolved.url);
            return; // Skip setting to error, it's back in queue
          }
        } catch (e) {
          console.error('Failed to re-resolve expired URL:', e);
        }
      } else {
        console.error(`[GenYT-JS-Download] Max retries reached for task ${taskId}. Breaking 403 loop.`);
        delete downloadRetries[taskId]; // Clear tracker
      }
    }

    // Fallthrough to normal error
    store.updateTaskStatus(taskId, 'error', { error: String(error) });
    await checkAndStopForegroundService();
    notificationService.showDownloadErrorNotification(taskId, task.videoTitle, String(error));
  }
});

export const startDownload = async (videoId: string, videoTitle: string, format: MediaFormat, thumbnailUrl?: string) => {
  const store = useDownloadStore.getState();
  const id = `${videoId}-${format.id}`;

  await ensureChannels();

  const existingTask = store.tasks[id];
  if (existingTask?.status === 'downloading' || existingTask?.status === 'pending') return;

  const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${sanitizedTitle}_${format.qualityLabel}.${format.extension}`;
  const mimeType = format.category === 'video' ? 'video/mp4' : 'audio/mpeg';

  store.addTask({
    id,
    videoId,
    videoTitle,
    format,
    progress: existingTask?.progress ?? 0,
    status: 'pending', // Starts as QUEUED
    bytesWritten: existingTask?.bytesWritten ?? 0,
    bytesExpected: existingTask?.bytesExpected ?? 0,
    localUri: undefined,
    error: undefined,
    thumbnailUrl,
  });

  try {
    let resolvedUrl = format.downloadUrl;
    if (!resolvedUrl && format.extractionSessionId) {
      const resolved = await nativeExtractor.resolveFormat(format.extractionSessionId, format.id);
      resolvedUrl = resolved.url;
    }

    if (!resolvedUrl) throw new Error("Could not resolve media URL.");

    const customSavePath = useSettingsStore.getState().downloadSavePath || null;

    GenytDownloadBridge.startNativeDownload(id, resolvedUrl, videoTitle, fileName, mimeType, customSavePath);

  } catch (error) {
    console.error(`Download initialization failed for ${id}:`, error);
    store.updateTaskStatus(id, 'error', { error: String(error) });
    await checkAndStopForegroundService();
    notificationService.showDownloadErrorNotification(id, videoTitle, String(error));
  }
};

export const pauseDownload = async (id: string) => {
  const storeTask = useDownloadStore.getState().tasks[id];
  if (storeTask && (storeTask.status === 'downloading' || storeTask.status === 'pending')) {
    GenytDownloadBridge.pauseNativeDownload(id);
  }
};

export const resumeDownload = async (id: string) => {
  const storeTask = useDownloadStore.getState().tasks[id];
  if (storeTask) {
    // If we have a session ID, always resolve fresh just in case it expired while paused,
    // though the Native bridge will handle automatic 403 retries too. Let's just tell Native to resume.
    GenytDownloadBridge.resumeNativeDownload(id, null);
  }
};

export const cancelDownload = async (id: string) => {
  GenytDownloadBridge.cancelNativeDownload(id);
  useDownloadStore.getState().removeTask(id);
  await checkAndStopForegroundService();
  notificationService.removeNotification(id);
};
