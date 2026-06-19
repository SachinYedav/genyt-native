import type { VideoSummary } from '@/entities/video/types';
import { db } from './db';

// History Queries

export function getHistory(): VideoSummary[] {
  const rows = db.getAllSync<{ videoData: string }>('SELECT videoData FROM history ORDER BY viewedAt DESC');
  return rows.map(row => JSON.parse(row.videoData) as VideoSummary);
}

export function addToHistory(video: VideoSummary) {
  const statement = db.prepareSync('INSERT OR REPLACE INTO history (videoId, videoData, viewedAt) VALUES (?, ?, ?)');
  try {
    statement.executeSync([video.id, JSON.stringify(video), Date.now()]);
  } finally {
    statement.finalizeSync();
  }
}

export function clearHistory() {
  db.execSync('DELETE FROM history');
}

export function removeFromHistory(videoId: string) {
  const statement = db.prepareSync('DELETE FROM history WHERE videoId = ?');
  try {
    statement.executeSync([videoId]);
  } finally {
    statement.finalizeSync();
  }
}

// Watchlist Queries

export function getWatchlist(): VideoSummary[] {
  const rows = db.getAllSync<{ videoData: string }>('SELECT videoData FROM watchlist ORDER BY addedAt DESC');
  return rows.map(row => JSON.parse(row.videoData) as VideoSummary);
}

export function addToWatchlist(video: VideoSummary) {
  const statement = db.prepareSync('INSERT OR REPLACE INTO watchlist (videoId, videoData, addedAt) VALUES (?, ?, ?)');
  try {
    statement.executeSync([video.id, JSON.stringify(video), Date.now()]);
  } finally {
    statement.finalizeSync();
  }
}

export function removeFromWatchlist(videoId: string) {
  const statement = db.prepareSync('DELETE FROM watchlist WHERE videoId = ?');
  try {
    statement.executeSync([videoId]);
  } finally {
    statement.finalizeSync();
  }
}

export function clearWatchlist() {
  db.execSync('DELETE FROM watchlist');
}

export function isInWatchlist(videoId: string): boolean {
  const statement = db.prepareSync('SELECT 1 FROM watchlist WHERE videoId = ?');
  try {
    const result = statement.executeSync([videoId]);
    return result.getFirstSync() !== null;
  } finally {
    statement.finalizeSync();
  }
}

// Saved Playlists Queries

export function getSavedPlaylists(): VideoSummary[] {
  const rows = db.getAllSync<{ playlistData: string }>('SELECT playlistData FROM saved_playlists ORDER BY addedAt DESC');
  return rows.map(row => JSON.parse(row.playlistData) as VideoSummary);
}

export function savePlaylist(playlist: VideoSummary) {
  const statement = db.prepareSync('INSERT OR REPLACE INTO saved_playlists (playlistId, playlistData, addedAt) VALUES (?, ?, ?)');
  try {
    statement.executeSync([playlist.id, JSON.stringify(playlist), Date.now()]);
  } finally {
    statement.finalizeSync();
  }
}

export function removeSavedPlaylist(playlistId: string) {
  const statement = db.prepareSync('DELETE FROM saved_playlists WHERE playlistId = ?');
  try {
    statement.executeSync([playlistId]);
  } finally {
    statement.finalizeSync();
  }
}

export function isPlaylistSaved(playlistId: string): boolean {
  const statement = db.prepareSync('SELECT 1 FROM saved_playlists WHERE playlistId = ?');
  try {
    const result = statement.executeSync([playlistId]);
    return result.getFirstSync() !== null;
  } finally {
    statement.finalizeSync();
  }
}

export function clearSavedPlaylists() {
  db.execSync('DELETE FROM saved_playlists');
}
