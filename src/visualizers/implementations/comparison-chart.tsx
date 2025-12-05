import type { Visualizer, VisualizerMetadata } from "../types";
import type { AnalysisOutput, ComparisonOutput } from "@/analysis/types";
import { DataShape } from "@/analysis/types";

export class ComparisonVisualizer implements Visualizer {
  metadata: VisualizerMetadata = {
    id: "comparison-chart",
    name: "Comparison Chart",
    description: "Displays comparison data as horizontal bars",
    supportedShapes: [DataShape.Comparison],
    priority: 10,
  };

  render(output: AnalysisOutput): React.ReactNode {
    const data = output as ComparisonOutput;

    if (data.data.length === 0) {
      return (
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">{data.label}</h3>
          <p className="text-sm opacity-60">No data available</p>
        </div>
      );
    }

    // Find max value for scaling
    const maxValue = Math.max(...data.data.map((d) => d.value));

    return (
      <div className="p-6 border rounded">
        <h3 className="font-medium mb-4">{data.label}</h3>

        <div className="space-y-3">
          {data.data.map((item, idx) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const barWidth = Math.max(percentage, 2);

            return (
              <div key={idx}>
                <div className="flex items-center justify-between gap-4 text-sm mb-2">
                  <span className="font-medium text-left">{item.label}</span>
                  <span className="opacity-60 text-right whitespace-nowrap">
                    {item.value.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 rounded" style={{backgroundColor: 'var(--progress-bg)'}}>
                  <div
                    className="h-4 rounded"
                    style={{
                      backgroundColor: 'var(--progress-fill)',
                      width: `${barWidth}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
