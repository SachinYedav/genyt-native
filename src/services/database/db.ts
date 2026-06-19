import * as SQLite from 'expo-sqlite';

// Open a synchronous database instance
export const db = SQLite.openDatabaseSync('genyt.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS history (
      videoId TEXT PRIMARY KEY,
      videoData TEXT NOT NULL,
      viewedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      videoId TEXT PRIMARY KEY,
      videoData TEXT NOT NULL,
      addedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_playlists (
      playlistId TEXT PRIMARY KEY,
      playlistData TEXT NOT NULL,
      addedAt INTEGER NOT NULL
    );
  `);
}
