import type {
  AggregateAnalyzer,
  AnalyzerMetadata,
  AnalysisResult,
  DistributionOutput,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";

/**
 * Aggregates turnip pull distribution across all games
 * Combines per-game turnip results to show overall turnip pull statistics
 */
export class OverallTurnipPullsAnalyzer implements AggregateAnalyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "overall-turnip-pulls",
    name: "Overall Turnip Distribution",
    description: "Aggregates turnip pulls across all games",
    phase: AnalysisPhase.Aggregate,
    outputShape: DataShape.Distribution,
    version: 1,
    author: "DJAN",
    tags: ["peach", "items", "aggregate", "rng"],
    dependencies: ["turnip-pulls"],
  };

  aggregate(results: AnalysisResult[]): DistributionOutput {
    // Filter for turnip pull results
    const turnipResults = results.filter(
      (r) => r.analyzerId === "turnip-pulls"
    );

    if (turnipResults.length === 0) {
      return {
        shape: DataShape.Distribution,
        label: "Overall Turnip Pulls (0 total)",
        data: [],
      };
    }

    // Aggregate counts by turnip type
    const aggregateCounts = new Map<string, number>();

    for (const result of turnipResults) {
      const output = result.output as DistributionOutput;
      for (const item of output.data) {
        const currentCount = aggregateCounts.get(item.label) || 0;
        aggregateCounts.set(item.label, currentCount + item.count);
      }
    }

    // Calculate total and convert to distribution format
    const totalPulls = Array.from(aggregateCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const data = Array.from(aggregateCounts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          totalPulls > 0 ? Math.round((count / totalPulls) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      shape: DataShape.Distribution,
      label: `Overall Turnip Pulls (${totalPulls} total across ${turnipResults.length} games)`,
      data,
    };
  }
}
