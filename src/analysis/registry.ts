import type {
  Analyzer,
  AggregateAnalyzer,
  TimeSeriesAnalyzer,
  ComparativeAnalyzer,
  AnalysisPhase,
} from "./types";

/**
 * Central registry for all analyzers
 * Contributors register their analyzers here
 */
export class AnalyzerRegistry {
  private analyzers = new Map<string, Analyzer>();
  private aggregateAnalyzers = new Map<string, AggregateAnalyzer>();
  private timeSeriesAnalyzers = new Map<string, TimeSeriesAnalyzer>();
  private comparativeAnalyzers = new Map<string, ComparativeAnalyzer>();

  /**
   * Register a per-game analyzer (Phase 1)
   */
  registerAnalyzer(analyzer: Analyzer): void {
    if (this.analyzers.has(analyzer.metadata.id)) {
      console.warn(
        `Analyzer ${analyzer.metadata.id} already registered, overwriting`
      );
    }
    this.analyzers.set(analyzer.metadata.id, analyzer);
  }

  /**
   * Register an aggregate analyzer (Phase 2)
   */
  registerAggregateAnalyzer(analyzer: AggregateAnalyzer): void {
    this.aggregateAnalyzers.set(analyzer.metadata.id, analyzer);
  }

  /**
   * Register a time-series analyzer (Phase 3)
   */
  registerTimeSeriesAnalyzer(analyzer: TimeSeriesAnalyzer): void {
    this.timeSeriesAnalyzers.set(analyzer.metadata.id, analyzer);
  }

  /**
   * Register a comparative analyzer (Phase 4)
   */
  registerComparativeAnalyzer(analyzer: ComparativeAnalyzer): void {
    this.comparativeAnalyzers.set(analyzer.metadata.id, analyzer);
  }

  /**
   * Get analyzer by ID
   */
  getAnalyzer(id: string): Analyzer | undefined {
    return this.analyzers.get(id);
  }

  /**
   * Get all analyzers for a specific phase
   */
  getAnalyzersByPhase(phase: AnalysisPhase): Analyzer[] {
    switch (phase) {
      case "per-game":
        return Array.from(this.analyzers.values());
      case "aggregate":
        return Array.from(this.aggregateAnalyzers.values()) as any[];
      case "time-series":
        return Array.from(this.timeSeriesAnalyzers.values()) as any[];
      case "comparative":
        return Array.from(this.comparativeAnalyzers.values()) as any[];
      default:
        return [];
    }
  }

  /**
   * Get all registered analyzer IDs
   */
  getAllAnalyzerIds(): string[] {
    return [
      ...this.analyzers.keys(),
      ...this.aggregateAnalyzers.keys(),
      ...this.timeSeriesAnalyzers.keys(),
      ...this.comparativeAnalyzers.keys(),
    ];
  }

  /**
   * Validate dependencies (ensure all deps are registered)
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const analyzer of this.analyzers.values()) {
      if (analyzer.metadata.dependencies) {
        for (const depId of analyzer.metadata.dependencies) {
          if (!this.analyzers.has(depId)) {
            errors.push(
              `Analyzer "${analyzer.metadata.id}" depends on "${depId}" which is not registered`
            );
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

// Singleton instance
let globalRegistry: AnalyzerRegistry | null = null;

export function getAnalyzerRegistry(): AnalyzerRegistry {
  if (!globalRegistry) {
    globalRegistry = new AnalyzerRegistry();
  }
  return globalRegistry;
}
