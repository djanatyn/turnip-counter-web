import type { DataShape, AnalysisOutput } from "@/analysis/types";
import type { ReactNode } from "react";

/**
 * Visualizer metadata
 */
export interface VisualizerMetadata {
  id: string;
  name: string;
  description: string;
  /** Which data shapes this visualizer can handle */
  supportedShapes: DataShape[];
  /** Priority (higher = preferred when multiple match) */
  priority?: number;
}

/**
 * Visualizer interface
 */
export interface Visualizer {
  metadata: VisualizerMetadata;

  /**
   * Render the visualization
   * Returns a React component
   */
  render(output: AnalysisOutput): ReactNode;
}
