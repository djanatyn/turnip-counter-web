/**
 * IndexedDB database name and version
 */
export const DB_NAME = "SlippiAnalysisDB";
export const DB_VERSION = 2;

/**
 * Object store names
 */
export enum StoreName {
  Files = "files",
  AnalysisResults = "analysis_results",
  AggregateCache = "aggregate_cache",
  UserPreferences = "user_preferences",
}

/**
 * Database schema definition
 */
export interface DatabaseSchema {
  files: {
    key: string; // fileId
    value: any; // FileMetadata (with Set converted to Array)
    indexes: {
      byFileName: string;
      byLastAnalyzed: string;
      byContentHash: string;
      byTimestamp: string;
      byConnectCode: string;
    };
  };

  analysis_results: {
    key: string; // id
    value: any; // AnalysisResult
    indexes: {
      byFileId: string;
      byAnalyzerId: string;
      byAnalyzedAt: string;
      byVersion: number;
    };
  };

  aggregate_cache: {
    key: string; // cacheKey
    value: {
      cacheKey: string;
      analyzerId: string;
      output: any; // AnalysisOutput
      computedAt: string;
      sourceFileIds: string[];
      expiresAt?: string;
    };
    indexes: {
      byAnalyzerId: string;
      byComputedAt: string;
    };
  };

  user_preferences: {
    key: string; // preference key
    value: {
      key: string;
      value: any;
      updatedAt: string;
    };
    indexes: {
      byUpdatedAt: string;
    };
  };
}

/**
 * Helper to create the database with proper schema
 */
export function createDatabase(): IDBOpenDBRequest {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;

    // Create FILES store
    if (!db.objectStoreNames.contains(StoreName.Files)) {
      const filesStore = db.createObjectStore(StoreName.Files, {
        keyPath: "id",
      });
      filesStore.createIndex("byFileName", "fileName", { unique: false });
      filesStore.createIndex("byLastAnalyzed", "lastAnalyzed", {
        unique: false,
      });
      filesStore.createIndex("byContentHash", "contentHash", {
        unique: false,
      });
      filesStore.createIndex("byTimestamp", "gameMetadata.timestamp", {
        unique: false,
      });
      filesStore.createIndex(
        "byConnectCode",
        "gameMetadata.players.connectCode",
        {
          unique: false,
          multiEntry: true,
        }
      );
    }

    // Create ANALYSIS_RESULTS store
    if (!db.objectStoreNames.contains(StoreName.AnalysisResults)) {
      const resultsStore = db.createObjectStore(StoreName.AnalysisResults, {
        keyPath: "id",
      });
      resultsStore.createIndex("byFileId", "fileId", { unique: false });
      resultsStore.createIndex("byAnalyzerId", "analyzerId", {
        unique: false,
      });
      resultsStore.createIndex("byAnalyzedAt", "analyzedAt", {
        unique: false,
      });
      resultsStore.createIndex("byVersion", "analyzerVersion", {
        unique: false,
      });
    }

    // Create AGGREGATE_CACHE store
    if (!db.objectStoreNames.contains(StoreName.AggregateCache)) {
      const cacheStore = db.createObjectStore(StoreName.AggregateCache, {
        keyPath: "cacheKey",
      });
      cacheStore.createIndex("byAnalyzerId", "analyzerId", { unique: false });
      cacheStore.createIndex("byComputedAt", "computedAt", { unique: false });
    }

    // Create USER_PREFERENCES store
    if (!db.objectStoreNames.contains(StoreName.UserPreferences)) {
      const prefsStore = db.createObjectStore(StoreName.UserPreferences, {
        keyPath: "key",
      });
      prefsStore.createIndex("byUpdatedAt", "updatedAt", { unique: false });
    }
  };

  return request;
}
