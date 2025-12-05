import type { Visualizer, VisualizerMetadata } from "../types";
import type { AnalysisOutput, TimeSeriesOutput } from "@/analysis/types";
import { DataShape } from "@/analysis/types";

export class TimeSeriesVisualizer implements Visualizer {
  metadata: VisualizerMetadata = {
    id: "time-series-chart",
    name: "Time Series Chart",
    description: "Displays time series data as a simple line chart",
    supportedShapes: [DataShape.TimeSeries],
    priority: 10,
  };

  render(output: AnalysisOutput): React.ReactNode {
    const data = output as TimeSeriesOutput;

    if (data.data.length === 0) {
      return (
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">{data.label}</h3>
          <p className="text-sm opacity-60">No data available</p>
        </div>
      );
    }

    // Find min/max for scaling
    const values = data.data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    return (
      <div className="p-6 border rounded">
        <h3 className="font-medium mb-4">{data.label}</h3>

        {/* Simple ASCII-style chart */}
        <div className="space-y-2 text-sm font-mono">
          {data.data.map((point, idx) => {
            const percentage = ((point.value - minValue) / range) * 100;
            const barWidth = Math.max(percentage, 2);

            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-32 opacity-60 truncate text-left">
                  Game {idx + 1}
                </div>
                <div className="flex-1 h-4 relative" style={{backgroundColor: 'var(--progress-bg)'}}>
                  <div
                    className="h-4 absolute"
                    style={{
                      backgroundColor: 'var(--progress-fill)',
                      width: `${barWidth}%`
                    }}
                  />
                </div>
                <div className="w-16 text-right whitespace-nowrap">
                  {point.value.toFixed(1)}
                  {data.unit}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm opacity-60">
          Range: {minValue.toFixed(1)}{data.unit} - {maxValue.toFixed(1)}
          {data.unit}
        </div>
      </div>
    );
  }
}
