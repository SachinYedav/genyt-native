import { useState, useEffect, useCallback } from 'react';
import { Paths, Directory, File } from 'expo-file-system';

export type StorageInfo = {
  dbSize: string;
  cacheSize: string;
  totalSize: string;
  isCalculating: boolean;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getDirectorySize = (dir: Directory): number => {
  try {
    if (!dir.exists) return 0;
    let totalSize = 0;
    for (const item of dir.list()) {
      if (item instanceof Directory) {
        totalSize += getDirectorySize(item);
      } else {
        totalSize += (item as File).size || 0;
      }
    }
    return totalSize;
  } catch (error) {
    return 0;
  }
};

export function useStorageSize() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    dbSize: '0 B',
    cacheSize: '0 B',
    totalSize: '0 B',
    isCalculating: true,
  });

  const calculateStorage = useCallback(async () => {
    setStorageInfo(prev => ({ ...prev, isCalculating: true }));
    try {
      if (!Paths.document) return;
      
      // Calculate SQLite size
      const dbFile = new File(Paths.document, 'SQLite', 'genyt.db');
      const dbBytes = dbFile.exists ? dbFile.size : 0;

      // Calculate MMKV size
      const mmkvDir = new Directory(Paths.document, 'mmkv');
      const mmkvBytes = getDirectorySize(mmkvDir);

      const totalDbBytes = dbBytes + mmkvBytes;

      // Calculate Cache size
      let cacheBytes = 0;
      if (Paths.cache) {
        cacheBytes = getDirectorySize(Paths.cache);
      }

      setStorageInfo({
        dbSize: formatBytes(totalDbBytes),
        cacheSize: formatBytes(cacheBytes),
        totalSize: formatBytes(totalDbBytes + cacheBytes),
        isCalculating: false,
      });
    } catch (e) {
      setStorageInfo(prev => ({ ...prev, isCalculating: false }));
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      if (Paths.cache && Paths.cache.exists) {
        for (const item of Paths.cache.list()) {
          item.delete();
        }
      }
      await calculateStorage();
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, [calculateStorage]);

  useEffect(() => {
    calculateStorage();
  }, [calculateStorage]);

  return { ...storageInfo, refreshStorage: calculateStorage, clearCache };
}
