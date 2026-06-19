import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from './db';
import { useSearchHistoryStore } from '@/features/search/store/useSearchHistoryStore';
import { queryClient } from '@/app/providers/queryClient';

type BackupData = {
  version: number;
  timestamp: number;
  history: any[];
  watchlist: any[];
  saved_playlists: any[];
  search_history: string[];
};

export const exportData = async (): Promise<boolean> => {
  try {
    // Gather SQLite Data
    const history = db.getAllSync('SELECT * FROM history');
    const watchlist = db.getAllSync('SELECT * FROM watchlist');
    const saved_playlists = db.getAllSync('SELECT * FROM saved_playlists');

    // Gather MMKV Data (Search History)
    const search_history = useSearchHistoryStore.getState().searches;

    const backupData: BackupData = {
      version: 1,
      timestamp: Date.now(),
      history,
      watchlist,
      saved_playlists,
      search_history,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    if (!Paths.cache) return false;
    
    const backupFile = new File(Paths.cache, 'GenYT_Backup.json');
    backupFile.write(jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export GenYT Data',
        UTI: 'public.json',
      });
      return true;
    } else {
      console.error('Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Export Failed:', error);
    return false;
  }
};

export const importData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Import cancelled' };
    }

    const backupFile = new File(result.assets[0].uri);
    const jsonString = await backupFile.text();

    let backupData: BackupData;
    try {
      backupData = JSON.parse(jsonString);
    } catch (e) {
      return { success: false, message: 'Invalid JSON format' };
    }

    // Strict Validation
    if (
      !backupData ||
      backupData.version !== 1 ||
      !Array.isArray(backupData.history) ||
      !Array.isArray(backupData.watchlist) ||
      !Array.isArray(backupData.saved_playlists) ||
      !Array.isArray(backupData.search_history)
    ) {
      return { success: false, message: 'Corrupted or incompatible backup file' };
    }

    // Wrap Database Inserts in a Transaction for safety (Upsert pattern)
    db.withTransactionSync(() => {
      // Upsert History
      const historyStmt = db.prepareSync(`
        INSERT INTO history (videoId, videoData, viewedAt) 
        VALUES (?, ?, ?) 
        ON CONFLICT(videoId) DO UPDATE SET 
        videoData = excluded.videoData, 
        viewedAt = excluded.viewedAt
      `);
      try {
        for (const item of backupData.history) {
          if (item.videoId && item.videoData && item.viewedAt) {
            historyStmt.executeSync([item.videoId, item.videoData, item.viewedAt]);
          }
        }
      } finally {
        historyStmt.finalizeSync();
      }

      // Upsert Watchlist
      const watchlistStmt = db.prepareSync(`
        INSERT INTO watchlist (videoId, videoData, addedAt) 
        VALUES (?, ?, ?) 
        ON CONFLICT(videoId) DO UPDATE SET 
        videoData = excluded.videoData, 
        addedAt = excluded.addedAt
      `);
      try {
        for (const item of backupData.watchlist) {
          if (item.videoId && item.videoData && item.addedAt) {
            watchlistStmt.executeSync([item.videoId, item.videoData, item.addedAt]);
          }
        }
      } finally {
        watchlistStmt.finalizeSync();
      }

      // Upsert Saved Playlists
      const playlistStmt = db.prepareSync(`
        INSERT INTO saved_playlists (playlistId, playlistData, addedAt) 
        VALUES (?, ?, ?) 
        ON CONFLICT(playlistId) DO UPDATE SET 
        playlistData = excluded.playlistData, 
        addedAt = excluded.addedAt
      `);
      try {
        for (const item of backupData.saved_playlists) {
          if (item.playlistId && item.playlistData && item.addedAt) {
            playlistStmt.executeSync([item.playlistId, item.playlistData, item.addedAt]);
          }
        }
      } finally {
        playlistStmt.finalizeSync();
      }
    });

    // Merge Search History in MMKV
    useSearchHistoryStore.setState((state) => {
      const mergedSearches = [...new Set([...backupData.search_history, ...state.searches])].slice(0, 50); // limit to max
      return { searches: mergedSearches };
    });

    // Invalidate React Query cache so UI updates immediately
    await queryClient.invalidateQueries({ queryKey: ['library-history'] });
    await queryClient.invalidateQueries({ queryKey: ['library-watchlist'] });
    await queryClient.invalidateQueries({ queryKey: ['library-saved-playlists'] });

    return { success: true, message: 'Data imported successfully!' };
  } catch (error) {
    console.error('Import Failed:', error);
    return { success: false, message: 'An error occurred during import' };
  }
};
