export function formatYoutubeUrl(idOrUrl: string, type: 'channel' | 'playlist'): string {
  if (!idOrUrl) return idOrUrl;
  if (idOrUrl.startsWith('http')) {
    return idOrUrl;
  }
  if (idOrUrl.startsWith('/')) {
    return `https://www.youtube.com${idOrUrl}`;
  }
  if (type === 'channel') {
    return `https://www.youtube.com/channel/${idOrUrl}`;
  }
  if (type === 'playlist') {
    return `https://www.youtube.com/playlist?list=${idOrUrl}`;
  }
  return idOrUrl;
}
