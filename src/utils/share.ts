import { Share, Platform } from 'react-native';

/**
 * Shares a YouTube video using the native Share dialogue.
 * It shares the standard youtube.com URL so that other apps (like WhatsApp, Telegram)
 * can automatically fetch and display rich previews (thumbnails, titles).
 * 
 * @param videoId The YouTube video ID
 * @param title Optional title of the video
 * @param isShort Whether the video is a YouTube Short
 * @param isPlaylist Whether the item is a YouTube Playlist
 */
export const shareVideo = async (videoId: string, title?: string, isShort: boolean = false, isPlaylist: boolean = false) => {
  if (!videoId) return;

  try {
    const url = isPlaylist 
      ? `https://www.youtube.com/playlist?list=${videoId}`
      : isShort 
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      
    // On Android, passing the URL as the message works best for WhatsApp and other chat apps to generate previews.
    // On iOS, the `url` property is natively supported.
    await Share.share({
      message: Platform.OS === 'android' ? url : `${title ? title + '\n' : ''}${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
      title: title,
    });
  } catch (error) {
    console.error('Error sharing video:', error);
  }
};
