import type { AnalysisResult, FileMetadata } from "@/analysis/types";

/**
 * Export format types
 */
export enum ExportType {
  /** Export a single game with all its analysis */
  SingleGame = "single-game",
  /** Export multiple selected games with all their per-game analysis */
  SelectedGames = "selected-games",
  /** Export only aggregate analysis for selected games */
  AggregateOnly = "aggregate-only",
  /** Export entire library (all games + all analysis) */
  FullLibrary = "full-library",
}

/**
 * Metadata about the export
 */
export interface ExportMetadata {
  /** When this export was created */
  exportedAt: string;
  /** Type of export */
  exportType: ExportType;
  /** Export format version (for future compatibility) */
  formatVersion: string;
  /** Number of games included */
  gameCount: number;
  /** Selection criteria (if applicable) */
  selection?: {
    /** IDs of files included */
    fileIds: string[];
    /** Filter text used (if any) */
    filterText?: string;
    /** Connect codes filtered for (if any) */
    connectCodes?: string[];
  };
}

/**
 * A single game's data for export
 */
export interface GameExport {
  /** File metadata */
  metadata: FileMetadata;
  /** All analysis results for this game */
  analysisResults: AnalysisResult[];
}

/**
 * Complete export data structure
 */
export interface ExportData {
  /** Export metadata */
  metadata: ExportMetadata;
  /** Individual game data (for single-game, selected-games, or full-library exports) */
  games?: GameExport[];
  /** Aggregate analysis results (for aggregate-only or when selections are active) */
  aggregateResults?: AnalysisResult[];
  /** Time-series analysis results */
  timeSeriesResults?: AnalysisResult[];
  /** Comparative analysis results */
  comparativeResults?: AnalysisResult[];
}
