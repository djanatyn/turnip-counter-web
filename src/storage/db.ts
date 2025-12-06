import { DB_NAME, DB_VERSION, StoreName, createDatabase } from "./schema";
import type { FileMetadata, AnalysisResult } from "@/analysis/types";

/**
 * IndexedDB wrapper with type-safe operations
 */
export class StorageManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = createDatabase();

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };
    });
  }

  /**
   * Save file metadata
   */
  async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreName.Files], "readwrite");
      const store = transaction.objectStore(StoreName.Files);

      // Convert Set to Array for storage
      const storableMetadata = {
        ...metadata,
        analyzedBy: Array.from(metadata.analyzedBy),
      };

      const request = store.put(storableMetadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreName.Files], "readonly");
      const store = transaction.objectStore(StoreName.Files);
      const request = store.get(fileId);

      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
          resolve(null);
        } else {
          // Convert Array back to Set
          resolve({
            ...data,
            analyzedBy: new Set(data.analyzedBy),
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all file metadata
   */
  async getAllFileMetadata(): Promise<FileMetadata[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreName.Files], "readonly");
      const store = transaction.objectStore(StoreName.Files);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((data: any) => ({
          ...data,
          analyzedBy: new Set(data.analyzedBy),
        }));
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.AnalysisResults],
        "readwrite"
      );
      const store = transaction.objectStore(StoreName.AnalysisResults);
      const request = store.put(result);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get analysis results for a specific file
   */
  async getAnalysisResultsForFile(fileId: string): Promise<AnalysisResult[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.AnalysisResults],
        "readonly"
      );
      const store = transaction.objectStore(StoreName.AnalysisResults);
      const index = store.index("byFileId");
      const request = index.getAll(fileId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all results for a specific analyzer
   */
  async getAnalysisResultsByAnalyzer(
    analyzerId: string
  ): Promise<AnalysisResult[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.AnalysisResults],
        "readonly"
      );
      const store = transaction.objectStore(StoreName.AnalysisResults);
      const index = store.index("byAnalyzerId");
      const request = index.getAll(analyzerId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query files by connect code (for user-specific analysis)
   */
  async getFilesByConnectCode(connectCode: string): Promise<FileMetadata[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreName.Files], "readonly");
      const store = transaction.objectStore(StoreName.Files);
      const index = store.index("byConnectCode");
      const request = index.getAll(connectCode);

      request.onsuccess = () => {
        const results = request.result.map((data: any) => ({
          ...data,
          analyzedBy: new Set(data.analyzedBy),
        }));
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a file and all its associated analysis results
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.Files, StoreName.AnalysisResults],
        "readwrite"
      );

      // Delete file metadata
      const filesStore = transaction.objectStore(StoreName.Files);
      filesStore.delete(fileId);

      // Delete all analysis results for this file
      const resultsStore = transaction.objectStore(StoreName.AnalysisResults);
      const index = resultsStore.index("byFileId");
      const request = index.openCursor(fileId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get a user preference by key
   */
  async getUserPreference<T>(key: string): Promise<T | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.UserPreferences],
        "readonly"
      );
      const store = transaction.objectStore(StoreName.UserPreferences);
      const request = store.get(key);

      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
        } else {
          resolve(request.result.value as T);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set a user preference
   */
  async setUserPreference<T>(key: string, value: T): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.UserPreferences],
        "readwrite"
      );
      const store = transaction.objectStore(StoreName.UserPreferences);

      const record = {
        key,
        value,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all user preferences
   */
  async getAllUserPreferences(): Promise<Record<string, any>> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [StoreName.UserPreferences],
        "readonly"
      );
      const store = transaction.objectStore(StoreName.UserPreferences);
      const request = store.getAll();

      request.onsuccess = () => {
        const prefs: Record<string, any> = {};
        for (const record of request.result) {
          prefs[record.key] = record.value;
        }
        resolve(prefs);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    await this.init();

    const stores = [
      StoreName.Files,
      StoreName.AnalysisResults,
      StoreName.AggregateCache,
      StoreName.UserPreferences,
    ];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, "readwrite");

      let completed = 0;
      const total = stores.length;

      stores.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };

        request.onerror = () => reject(request.error);
      });
    });
  }
}

// Singleton instance
let globalStorage: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!globalStorage) {
    globalStorage = new StorageManager();
  }
  return globalStorage;
}
