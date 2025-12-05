import { getAnalyzerRegistry } from "@/analysis/registry";

// Import all analyzers
import { LCancelRateAnalyzer } from "./per-game/l-cancel-rate";
import { TurnipPullsAnalyzer } from "./per-game/turnip-pulls";
import { OverallLCancelRateAnalyzer } from "./aggregate/overall-l-cancel-rate";
import { OverallTurnipPullsAnalyzer } from "./aggregate/overall-turnip-pulls";
import { LCancelProgressionAnalyzer } from "./time-series/l-cancel-progression";
import { LCancelByMatchupAnalyzer } from "./comparative/l-cancel-by-matchup";

/**
 * Auto-register all analyzers
 * This file is imported once at app startup
 */
export function registerAllAnalyzers(): void {
  const registry = getAnalyzerRegistry();

  // Register Phase 1 analyzers (per-game)
  registry.registerAnalyzer(new LCancelRateAnalyzer());
  registry.registerAnalyzer(new TurnipPullsAnalyzer());

  // Register Phase 2 analyzers (aggregate)
  registry.registerAggregateAnalyzer(new OverallLCancelRateAnalyzer());
  registry.registerAggregateAnalyzer(new OverallTurnipPullsAnalyzer());

  // Register Phase 3 analyzers (time-series)
  registry.registerTimeSeriesAnalyzer(new LCancelProgressionAnalyzer());

  // Register Phase 4 analyzers (comparative)
  registry.registerComparativeAnalyzer(new LCancelByMatchupAnalyzer());

  // Validate dependencies
  const validation = registry.validateDependencies();
  if (!validation.valid) {
    console.error("Analyzer dependency validation failed:", validation.errors);
  }
}
