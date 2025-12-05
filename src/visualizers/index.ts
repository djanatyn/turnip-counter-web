import { getVisualizerRegistry } from "./registry";
import { PercentageVisualizer } from "./implementations/percentage-display";
import { TimeSeriesVisualizer } from "./implementations/time-series-chart";
import { ComparisonVisualizer } from "./implementations/comparison-chart";
import { DistributionVisualizer } from "./implementations/distribution-chart";

/**
 * Auto-register all visualizers
 * This file is imported once at app startup
 */
export function registerAllVisualizers(): void {
  const registry = getVisualizerRegistry();

  // Register visualizers
  registry.register(new PercentageVisualizer());
  registry.register(new TimeSeriesVisualizer());
  registry.register(new ComparisonVisualizer());
  registry.register(new DistributionVisualizer());
}
