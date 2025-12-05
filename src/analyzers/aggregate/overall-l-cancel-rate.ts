import type {
  AggregateAnalyzer,
  AnalyzerMetadata,
  AnalysisResult,
  PercentageOutput,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";

/**
 * Aggregates L-Cancel rates across all games
 * Depends on per-game l-cancel-rate analyzer
 */
export class OverallLCancelRateAnalyzer implements AggregateAnalyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "overall-l-cancel-rate",
    name: "Overall L-Cancel Rate",
    description: "Average L-Cancel rate across all analyzed games",
    phase: AnalysisPhase.Aggregate,
    outputShape: DataShape.Percentage,
    version: 1,
    dependencies: ["l-cancel-rate"],
    author: "DJAN",
    tags: ["aggregate", "tech-skill"],
  };

  aggregate(results: AnalysisResult[]): PercentageOutput {
    // Filter for L-cancel results
    const lCancelResults = results.filter(
      (r) => r.analyzerId === "l-cancel-rate"
    );

    if (lCancelResults.length === 0) {
      return {
        shape: DataShape.Percentage,
        value: 0,
        label: "Overall L-Cancel Rate",
        numerator: 0,
        denominator: 0,
      };
    }

    // Aggregate across all games
    let totalSuccessful = 0;
    let totalAttempts = 0;

    for (const result of lCancelResults) {
      const output = result.output as PercentageOutput;
      if (output.numerator !== undefined && output.denominator !== undefined) {
        totalSuccessful += output.numerator;
        totalAttempts += output.denominator;
      }
    }

    const percentage =
      totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 0;

    return {
      shape: DataShape.Percentage,
      value: Math.round(percentage * 100) / 100,
      label: `Overall L-Cancel Rate (${lCancelResults.length} games)`,
      numerator: totalSuccessful,
      denominator: totalAttempts,
    };
  }
}
