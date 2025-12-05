import type { DataShape } from "@/analysis/types";
import type { Visualizer } from "./types";

export class VisualizerRegistry {
  private visualizers = new Map<string, Visualizer>();

  register(visualizer: Visualizer): void {
    this.visualizers.set(visualizer.metadata.id, visualizer);
  }

  /**
   * Get the best visualizer for a given data shape
   */
  getVisualizerForShape(shape: DataShape): Visualizer | undefined {
    const candidates = Array.from(this.visualizers.values())
      .filter((v) => v.metadata.supportedShapes.includes(shape))
      .sort((a, b) => (b.metadata.priority || 0) - (a.metadata.priority || 0));

    return candidates[0];
  }

  getVisualizer(id: string): Visualizer | undefined {
    return this.visualizers.get(id);
  }
}

// Singleton
let globalVisualizerRegistry: VisualizerRegistry | null = null;

export function getVisualizerRegistry(): VisualizerRegistry {
  if (!globalVisualizerRegistry) {
    globalVisualizerRegistry = new VisualizerRegistry();
  }
  return globalVisualizerRegistry;
}
