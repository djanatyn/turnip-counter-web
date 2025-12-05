import type {
  TimeSeriesAnalyzer,
  AnalyzerMetadata,
  AnalysisResult,
  TimeSeriesOutput,
  PercentageOutput,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";

/**
 * Shows L-Cancel rate progression over time
 * Depends on per-game l-cancel-rate analyzer
 */
export class LCancelProgressionAnalyzer implements TimeSeriesAnalyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "l-cancel-progression",
    name: "L-Cancel Rate Over Time",
    description: "Track L-Cancel success rate chronologically",
    phase: AnalysisPhase.TimeSeries,
    outputShape: DataShape.TimeSeries,
    version: 1,
    dependencies: ["l-cancel-rate"],
    author: "DJAN",
    tags: ["time-series", "tech-skill", "progression"],
  };

  analyzeTrends(results: AnalysisResult[]): TimeSeriesOutput {
    // Filter and sort by timestamp
    const lCancelResults = results
      .filter((r) => r.analyzerId === "l-cancel-rate")
      .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));

    if (lCancelResults.length === 0) {
      return {
        shape: DataShape.TimeSeries,
        label: "L-Cancel Rate Over Time",
        data: [],
        unit: "%",
      };
    }

    // Convert to time series data points
    const data = lCancelResults.map((result) => ({
      timestamp: result.analyzedAt,
      value: (result.output as PercentageOutput).value,
    }));

    return {
      shape: DataShape.TimeSeries,
      label: `L-Cancel Rate Over Time (${data.length} games)`,
      data,
      unit: "%",
    };
  }
}
