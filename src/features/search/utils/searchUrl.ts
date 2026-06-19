const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_WATCH_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const YOUTUBE_EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export function normalizeSearchTerm(searchTerm: string) {
  return searchTerm.trim();
}

function parseUrlCandidate(input: string) {
  const value = normalizeSearchTerm(input);
  if (!value || /\s/.test(value)) return null;

  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

export type ParsedYouTubeUrl =
  | { type: 'video'; videoId: string; isShort: boolean }
  | { type: 'playlist'; playlistId: string }
  | { type: 'channel'; channelIdOrUrl: string };

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const url = parseUrlCandidate(input);
  if (!url) return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/^\/+|\/+$/g, '');

  if (YOUTUBE_WATCH_HOSTS.has(host)) {
    // Playlist check (e.g. /playlist?list=...)
    if (path === 'playlist') {
      const playlistId = url.searchParams.get('list');
      if (playlistId) return { type: 'playlist', playlistId };
    }

    // Video check (e.g. /watch?v=...)
    if (path === 'watch') {
      const videoId = url.searchParams.get('v') || '';
      if (YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
        return { type: 'video', videoId, isShort: false };
      }
    }

    // Channel check (e.g. /channel/..., /c/..., /user/..., /@...)
    if (path.startsWith('channel/') || path.startsWith('c/') || path.startsWith('user/') || path.startsWith('@')) {
      return { type: 'channel', channelIdOrUrl: url.href };
    }

    if (path.startsWith('shorts/') || path.startsWith('live/') || path.startsWith('embed/')) {
      const videoId = path.split('/')[1] || '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? { type: 'video', videoId, isShort: path.startsWith('shorts/') } : null;
    }

    return null;
  }

  if (YOUTUBE_EMBED_HOSTS.has(host) && path.startsWith('embed/')) {
    const videoId = path.split('/')[1] || '';
    return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? { type: 'video', videoId, isShort: false } : null;
  }

  if (host === 'youtu.be') {
    const videoId = path.split('/')[0] || '';
    if (path.startsWith('shorts/')) {
      const sVideoId = path.split('/')[1] || '';
      return YOUTUBE_VIDEO_ID_PATTERN.test(sVideoId) ? { type: 'video', videoId: sVideoId, isShort: true } : null;
    }
    return YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? { type: 'video', videoId, isShort: false } : null;
  }

  return null;
}

export function extractYouTubeVideoId(input: string) {
  const parsed = parseYouTubeUrl(input);
  return parsed?.type === 'video' ? parsed.videoId : null;
}
