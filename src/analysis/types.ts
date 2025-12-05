import { ReplayData } from "@slippilab/common";

// ============================================================================
// ANALYZER PHASE DEFINITIONS
// ============================================================================

export enum AnalysisPhase {
  /** Phase 1: Analyze individual games */
  PerGame = "per-game",
  /** Phase 2: Aggregate across multiple games */
  Aggregate = "aggregate",
  /** Phase 3: Time-series trends */
  TimeSeries = "time-series",
  /** Phase 4: Comparative analysis */
  Comparative = "comparative",
}

// ============================================================================
// DATA SHAPE CONTRACTS
// ============================================================================

/**
 * Standard data shapes that analyzers can output.
 * Visualizers register to handle specific shapes.
 */
export enum DataShape {
  /** Single numeric value with label */
  SingleValue = "single-value",
  /** Percentage (0-100) */
  Percentage = "percentage",
  /** Time series: Array of {timestamp, value} */
  TimeSeries = "time-series",
  /** Distribution: Array of {label, count} */
  Distribution = "distribution",
  /** Comparison: Array of {label, value, baseline?} */
  Comparison = "comparison",
  /** Table: Array of objects with consistent schema */
  Table = "table",
  /** Custom: Analyzer-specific visualization required */
  Custom = "custom",
}

/**
 * Standard data output formats
 */
export type AnalysisOutput =
  | SingleValueOutput
  | PercentageOutput
  | TimeSeriesOutput
  | DistributionOutput
  | ComparisonOutput
  | TableOutput
  | CustomOutput;

export interface SingleValueOutput {
  shape: DataShape.SingleValue;
  value: number;
  label: string;
  unit?: string;
}

export interface PercentageOutput {
  shape: DataShape.Percentage;
  value: number; // 0-100
  label: string;
  numerator?: number;
  denominator?: number;
}

export interface TimeSeriesOutput {
  shape: DataShape.TimeSeries;
  label: string;
  data: Array<{
    timestamp: string; // ISO 8601
    value: number;
  }>;
  unit?: string;
}

export interface DistributionOutput {
  shape: DataShape.Distribution;
  label: string;
  data: Array<{
    label: string;
    count: number;
    percentage?: number;
  }>;
}

export interface ComparisonOutput {
  shape: DataShape.Comparison;
  label: string;
  data: Array<{
    label: string;
    value: number;
    baseline?: number;
  }>;
}

export interface TableOutput {
  shape: DataShape.Table;
  label: string;
  columns: Array<{
    key: string;
    label: string;
    type: "string" | "number" | "percentage" | "timestamp";
  }>;
  rows: Array<Record<string, any>>;
}

export interface CustomOutput {
  shape: DataShape.Custom;
  label: string;
  data: any;
  customVisualizerId: string;
}

// ============================================================================
// ANALYZER INTERFACE
// ============================================================================

/**
 * Metadata about what an analyzer does and what it needs
 */
export interface AnalyzerMetadata {
  /** Unique identifier (e.g., "l-cancel-rate") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Analysis phase */
  phase: AnalysisPhase;
  /** Output data shape */
  outputShape: DataShape;
  /** Version (for schema evolution) */
  version: number;
  /** Dependencies: analyzer IDs that must run first */
  dependencies?: string[];
  /** Author info (for contributor attribution) */
  author?: string;
  /** Tags for filtering/categorization */
  tags?: string[];
}

/**
 * Context provided to analyzers
 */
export interface AnalysisContext {
  /** The replay being analyzed */
  replay: ReplayData;
  /** File metadata */
  fileMetadata: FileMetadata;
  /** Results from dependency analyzers (if any) */
  dependencyResults?: Map<string, AnalysisOutput>;
  /** User preferences/filters (e.g., player connect codes) */
  userContext?: UserContext;
}

export interface UserContext {
  /** Connect codes to focus on */
  targetPlayerCodes?: string[];
  /** Other user preferences */
  preferences?: Record<string, any>;
}

/**
 * Base analyzer interface - all analyzers must implement this
 */
export interface Analyzer {
  /** Metadata about this analyzer */
  readonly metadata: AnalyzerMetadata;

  /**
   * Analyze a single replay
   * Phase 1 analyzers implement this
   */
  analyze(context: AnalysisContext): Promise<AnalysisOutput> | AnalysisOutput;
}

/**
 * Aggregate analyzer - operates on multiple game results
 */
export interface AggregateAnalyzer {
  readonly metadata: AnalyzerMetadata;

  /**
   * Aggregate results from multiple per-game analyses
   * Phase 2 analyzers implement this
   */
  aggregate(results: AnalysisResult[]): Promise<AnalysisOutput> | AnalysisOutput;
}

/**
 * Time-series analyzer - operates on chronologically ordered results
 */
export interface TimeSeriesAnalyzer {
  readonly metadata: AnalyzerMetadata;

  /**
   * Analyze trends over time
   * Phase 3 analyzers implement this
   */
  analyzeTrends(
    results: AnalysisResult[]
  ): Promise<AnalysisOutput> | AnalysisOutput;
}

/**
 * Comparative analyzer - compares across different dimensions
 */
export interface ComparativeAnalyzer {
  readonly metadata: AnalyzerMetadata;

  /**
   * Compare performance across dimensions (opponents, characters, stages)
   * Phase 4 analyzers implement this
   */
  compare(
    results: AnalysisResult[],
    dimension: ComparisonDimension
  ): Promise<AnalysisOutput> | AnalysisOutput;
}

export enum ComparisonDimension {
  Opponent = "opponent",
  Character = "character",
  Stage = "stage",
  TimeOfDay = "time-of-day",
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * File metadata tracked in IndexedDB
 */
export interface FileMetadata {
  /** Unique identifier (fileName + hash) */
  id: string;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Last modified timestamp from File API */
  lastModified: number;
  /** Hash of file contents (for deduplication) */
  contentHash: string;
  /** When this file was first added */
  firstAnalyzed: string; // ISO 8601
  /** When this file was last analyzed */
  lastAnalyzed: string; // ISO 8601
  /** Game metadata (extracted from replay) */
  gameMetadata: GameMetadataSnapshot;
  /** Which analyzers have been run on this file */
  analyzedBy: Set<string>; // analyzer IDs
}

/**
 * Snapshot of key game info for quick filtering
 */
export interface GameMetadataSnapshot {
  timestamp: string;
  matchId: string;
  gameNumber: number;
  stageId: number;
  players: Array<{
    playerIndex: number;
    characterId: number;
    connectCode?: string;
    displayName?: string;
  }>;
}

/**
 * Analysis result stored in IndexedDB
 */
export interface AnalysisResult {
  /** fileId + analyzerId */
  id: string;
  /** Reference to file */
  fileId: string;
  /** Reference to analyzer */
  analyzerId: string;
  /** Analyzer version */
  analyzerVersion: number;
  /** When analysis was run */
  analyzedAt: string; // ISO 8601
  /** The output data */
  output: AnalysisOutput;
  /** Processing time in ms */
  processingTime: number;
}

// ============================================================================
// PROCESSING PIPELINE TYPES
// ============================================================================

export interface ProcessingOptions {
  /** Max files to process in one batch (default: 10) */
  batchSize?: number;
  /** Which analyzers to run (default: all registered) */
  analyzerIds?: string[];
  /** Skip files already analyzed (default: true) */
  skipAnalyzed?: boolean;
  /** Force re-analysis even if already done (default: false) */
  forceReanalyze?: boolean;
  /** User context for filtering */
  userContext?: UserContext;
}

export interface ProcessingProgress {
  /** Total files to process */
  totalFiles: number;
  /** Files processed so far */
  processedFiles: number;
  /** Current file being processed */
  currentFile?: string;
  /** Current analyzer running */
  currentAnalyzer?: string;
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
  /** Errors encountered */
  errors: ProcessingError[];
}

export interface ProcessingError {
  fileName: string;
  analyzerId: string;
  error: string;
  timestamp: string;
}
