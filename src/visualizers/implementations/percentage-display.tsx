import type { Visualizer, VisualizerMetadata } from "../types";
import type { AnalysisOutput, PercentageOutput } from "@/analysis/types";
import { DataShape } from "@/analysis/types";

export class PercentageVisualizer implements Visualizer {
  metadata: VisualizerMetadata = {
    id: "percentage-display",
    name: "Percentage Display",
    description: "Displays a percentage with a progress bar",
    supportedShapes: [DataShape.Percentage],
    priority: 10,
  };

  render(output: AnalysisOutput): React.ReactNode {
    const data = output as PercentageOutput;

    return (
      <div className="p-6 border rounded">
        <h3 className="font-medium mb-4">{data.label}</h3>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="w-full h-4 rounded" style={{backgroundColor: 'var(--progress-bg)'}}>
              <div
                className="h-4 rounded"
                style={{
                  backgroundColor: 'var(--progress-fill)',
                  width: `${Math.min(data.value, 100)}%`
                }}
              />
            </div>
          </div>

          <div className="text-2xl font-bold">{data.value.toFixed(1)}%</div>
        </div>

        {data.numerator !== undefined && data.denominator !== undefined && (
          <div className="text-sm opacity-60 mt-3">
            {data.numerator} / {data.denominator} successful
          </div>
        )}
      </div>
    );
  }
}
