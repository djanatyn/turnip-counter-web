import { parseReplayFile } from "@/analyze";
import { AnalyzerRegistry } from "./registry";
import { StorageManager } from "@/storage/db";
import type {
  ProcessingOptions,
  ProcessingProgress,
  AnalysisContext,
  FileMetadata,
  UserContext,
  Analyzer,
} from "./types";
import { AnalysisPhase } from "./types";

/**
 * CRITICAL: Memory-efficient batch processor
 *
 * Strategy:
 * 1. Process files in small batches (default: 10 files)
 * 2. For each file:
 *    - Load ArrayBuffer
 *    - Parse to ReplayData
 *    - Run all applicable analyzers
 *    - Store results in IndexedDB
 *    - DISCARD ReplayData (free memory!)
 * 3. Only keep analysis results (small JSON) in memory/storage
 */
export class AnalysisPipeline {
  private registry: AnalyzerRegistry;
  private storage: StorageManager;
  private progressCallbacks: Set<(progress: ProcessingProgress) => void>;

  constructor(registry: AnalyzerRegistry, storage: StorageManager) {
    this.registry = registry;
    this.storage = storage;
    this.progressCallbacks = new Set();
  }

  /**
   * Register a callback to receive progress updates
   */
  onProgress(callback: (progress: ProcessingProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Main entry point: Process multiple files
   */
  async processFiles(
    files: File[],
    options: ProcessingOptions = {}
  ): Promise<ProcessingProgress> {
    const {
      batchSize = 10,
      analyzerIds,
      skipAnalyzed = true,
      forceReanalyze = false,
      userContext,
    } = options;

    const progress: ProcessingProgress = {
      totalFiles: files.length,
      processedFiles: 0,
      errors: [],
    };

    // Get analyzers to run (Phase 1 only for now)
    const analyzers = analyzerIds
      ? analyzerIds
          .map((id) => this.registry.getAnalyzer(id))
          .filter((a): a is Analyzer => a !== undefined)
      : this.registry.getAnalyzersByPhase(AnalysisPhase.PerGame);

    // Process in batches to avoid memory issues
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      // Process batch in parallel (but limited concurrency)
      await Promise.all(
        batch.map((file) =>
          this.processFile(file, analyzers, {
            skipAnalyzed,
            forceReanalyze,
            userContext,
            progress,
          })
        )
      );

      progress.processedFiles += batch.length;
      this.notifyProgress(progress);

      // Give browser a chance to breathe (prevent UI freeze)
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return progress;
  }

  /**
   * Process a single file through all analyzers
   */
  private async processFile(
    file: File,
    analyzers: Analyzer[],
    options: {
      skipAnalyzed: boolean;
      forceReanalyze: boolean;
      userContext?: UserContext;
      progress: ProcessingProgress;
    }
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Compute file hash and check if already processed
      const buffer = await file.arrayBuffer();
      const fileMetadata = await this.getOrCreateFileMetadata(file, buffer);

      if (options.skipAnalyzed && !options.forceReanalyze) {
        const alreadyProcessed = analyzers.every((a) =>
          fileMetadata.analyzedBy.has(a.metadata.id)
        );
        if (alreadyProcessed) {
          return; // Skip this file
        }
      }

      // 2. Parse replay (this is the memory-heavy part)
      const parseResult = parseReplayFile(file.name, buffer);
      if (!parseResult.ok) {
        options.progress.errors.push({
          fileName: file.name,
          analyzerId: "parser",
          error: parseResult.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const replay = parseResult.value.game;

      // 3. Run analyzers sequentially (to manage memory)
      for (const analyzer of analyzers) {
        try {
          options.progress.currentFile = file.name;
          options.progress.currentAnalyzer = analyzer.metadata.name;
          this.notifyProgress(options.progress);

          // Check if we need to run this analyzer
          if (
            !options.forceReanalyze &&
            fileMetadata.analyzedBy.has(analyzer.metadata.id)
          ) {
            continue; // Already analyzed with this analyzer
          }

          // Build context
          const context: AnalysisContext = {
            replay,
            fileMetadata,
            userContext: options.userContext,
          };

          // Run analyzer
          const output = await analyzer.analyze(context);

          // Store result
          await this.storage.saveAnalysisResult({
            id: `${fileMetadata.id}::${analyzer.metadata.id}`,
            fileId: fileMetadata.id,
            analyzerId: analyzer.metadata.id,
            analyzerVersion: analyzer.metadata.version,
            analyzedAt: new Date().toISOString(),
            output,
            processingTime: Date.now() - startTime,
          });

          // Update file metadata
          fileMetadata.analyzedBy.add(analyzer.metadata.id);
          fileMetadata.lastAnalyzed = new Date().toISOString();
        } catch (error) {
          options.progress.errors.push({
            fileName: file.name,
            analyzerId: analyzer.metadata.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 4. Update file metadata
      await this.storage.saveFileMetadata(fileMetadata);

      // 5. CRITICAL: Discard replay data to free memory
      // (JavaScript GC will reclaim this)
      // We only keep the small analysis results in IndexedDB
    } catch (error) {
      options.progress.errors.push({
        fileName: file.name,
        analyzerId: "pipeline",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async getOrCreateFileMetadata(
    file: File,
    buffer: ArrayBuffer
  ): Promise<FileMetadata> {
    const contentHash = await this.computeHash(buffer);
    const fileId = `${file.name}::${contentHash}`;

    // Check if already exists
    const existing = await this.storage.getFileMetadata(fileId);
    if (existing) {
      return existing;
    }

    // Parse just to get metadata (we'll parse again for analysis)
    const parseResult = parseReplayFile(file.name, buffer);
    if (!parseResult.ok) {
      throw new Error(`Failed to parse ${file.name}: ${parseResult.error}`);
    }

    const replay = parseResult.value.game;

    return {
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
      contentHash,
      firstAnalyzed: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      gameMetadata: {
        timestamp: replay.settings.startTimestamp,
        matchId: replay.settings.matchId,
        gameNumber: replay.settings.gameNumber,
        stageId: replay.settings.stageId,
        players: replay.settings.playerSettings.map((p) => ({
          playerIndex: p.playerIndex,
          characterId: p.externalCharacterId,
          connectCode: p.connectCode,
          displayName: p.displayName,
        })),
      },
      analyzedBy: new Set(),
    };
  }

  private async computeHash(buffer: ArrayBuffer): Promise<string> {
    // Try to use crypto.subtle if available (HTTPS contexts)
    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        // Fall through to simple hash
      }
    }

    // Fallback: Simple hash function for non-HTTPS contexts
    // This is not cryptographically secure but sufficient for deduplication
    const bytes = new Uint8Array(buffer);
    let hash = 0;

    // Sample bytes throughout the file for performance (every 1KB)
    const step = Math.max(1024, Math.floor(bytes.length / 1000));
    for (let i = 0; i < bytes.length; i += step) {
      hash = (hash * 31 + bytes[i]) | 0;
    }

    // Also include file size in hash
    hash = (hash * 31 + bytes.length) | 0;

    // Convert to hex string
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  private notifyProgress(progress: ProcessingProgress): void {
    this.progressCallbacks.forEach((callback) => callback({ ...progress }));
  }
}
